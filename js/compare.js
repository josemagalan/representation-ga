/*
 * «Comparar codificaciones» del mismo problema: el espacio de búsqueda de cada una y su localidad,
 * medida con todos los vecinos a un gen del cromosoma (Rothlauf, 2006): cuántos son, cuántos siguen
 * siendo factibles, cuántos representan la misma solución y cuánto cambia la solución que representan.
 *
 * Lógica pura (sin DOM), usada por la pantalla de comparar (js/compare-view.js) y por los tests.
 *
 *   assignment(inst, a)            → { solution, rows: [{ id, chrom, space, local }] }
 *   assignmentMean(n, m, S, seed)  → { [id]: local }   media sobre S instancias y asignaciones al azar
 *   fn(fnId, k, p)                 → { point, rows }
 *   fnMean(fnId, k, S, seed)       → { [id]: local }   media sobre S puntos al azar
 *
 * La matriz se decodifica con su reparación (sin una solución no hay distancia que medir). Los reales
 * se mueven en centésimas, la resolución de la herramienta: su vecino a un gen es un gen ± 0,01 y su
 * «rejilla», la de las centésimas.
 * Funciona tanto en el navegador (window.GAX.compare) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rng.js') : root.GAX.rng;
  const A = isNode ? require('./assignment.js') : root.GAX.assignment;
  const Fn = isNode ? require('./func.js') : root.GAX.func;
  const matrixP = () => (isNode ? require('./problems/assignment-matrix.js') : root.GAX.problems['assignment-matrix']);

  const PROBLEMS = {
    assignment: ['assignment-int', 'assignment-matrix'],
    function: ['function-real', 'function-standard', 'function-gray'],
  };
  /** Codificación de la página (y variante) de cada fila. */
  const PAGE = {
    'assignment-int': { enc: 'assignment-int' },
    'assignment-matrix': { enc: 'assignment-matrix' },
    'function-real': { enc: 'function-real' },
    'function-standard': { enc: 'function-bits', variant: 'standard' },
    'function-gray': { enc: 'function-bits', variant: 'gray' },
  };
  const problemOf = (enc) => Object.keys(PROBLEMS).find((p) => PROBLEMS[p].some((id) => PAGE[id].enc === enc)) || null;

  // Columnas de cada tabla. kind: 'pct' (fracción 0…1, con barra), 'num', 'int', 'big' (entero grande) o 'text'.
  const COLUMNS = {
    assignment: {
      space: [{ id: 'genes', kind: 'text' }, { id: 'size', kind: 'text' }, { id: 'feasible', kind: 'pct' }, { id: 'redundancy', kind: 'big', mean: true }],
      local: [{ id: 'neighbours', kind: 'int' }, { id: 'feasibleNb', kind: 'pct' }, { id: 'neutral', kind: 'pct' },
        { id: 'moved', kind: 'num' }, { id: 'dCmax', kind: 'num' }],
    },
    function: {
      space: [{ id: 'genes', kind: 'text' }, { id: 'size', kind: 'text' }, { id: 'precision', kind: 'coord' }, { id: 'box', kind: 'text' }],
      local: [{ id: 'neighbours', kind: 'int' }, { id: 'jump', kind: 'coord' }, { id: 'maxJump', kind: 'coord' },
        { id: 'gridNb', kind: 'pct' }, { id: 'cliff', kind: 'int' }, { id: 'dF', kind: 'fval' }],
    },
  };

  // ======================================================================
  // Asignación
  // ======================================================================

  /** Asignación que da la matriz (con la reparación de la página). */
  const decodeMatrix = (inst, y) => A.fromMatrix(y) || A.fromMatrix(matrixP().repair(inst, y).matrix);
  const movedTasks = (a, b) => a.reduce((s, j, i) => s + (j !== b[i] ? 1 : 0), 0);

  /** Recuentos de localidad de un cromosoma: sumas sobre sus vecinos a un gen. */
  function assignmentCounts(inst, a, id) {
    const { n, m } = A.sizes(inst);
    const c0 = A.makespan(inst, a);
    const acc = { neighbours: 0, feasible: 0, neutral: 0, moved: 0, dCmax: 0 };
    const visit = (b, feasible) => {
      acc.neighbours++;
      if (feasible) acc.feasible++;
      const d = movedTasks(a, b);
      if (!d) acc.neutral++;
      acc.moved += d;
      acc.dCmax += Math.abs(A.makespan(inst, b) - c0);
    };
    if (id === 'assignment-int') {
      for (let i = 0; i < n; i++) {
        for (let j = 1; j <= m; j++) {
          if (j === a[i]) continue;
          const b = a.slice();
          b[i] = j;
          visit(b, true);
        }
      }
    } else {
      const y = A.toMatrix(a, m);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          const z = y.map((r) => r.slice());
          z[i][j] = 1 - z[i][j];
          visit(decodeMatrix(inst, z), A.isFeasibleMatrix(z));
        }
      }
    }
    return acc;
  }

  function finishLocal(acc) {
    const N = acc.neighbours || 1;
    return { neighbours: acc.neighbours / (acc.runs || 1), feasibleNb: acc.feasible / N, neutral: acc.neutral / N, moved: acc.moved / N, dCmax: acc.dCmax / N };
  }
  function addTo(acc, c) {
    Object.keys(c).forEach((k) => { acc[k] = (acc[k] || 0) + c[k]; });
    acc.runs = (acc.runs || 0) + 1;
    return acc;
  }

  function assignment(inst, a) {
    const { n, m } = A.sizes(inst);
    const total = Math.pow(2, n * m);
    const sol = Math.pow(m, n);
    const rows = PROBLEMS.assignment.map((id) => {
      const isInt = id === 'assignment-int';
      return {
        id,
        chrom: isInt ? a.slice() : A.toMatrix(a, m),
        space: {
          genes: { n, m, nm: n * m, int: isInt },
          size: isInt ? { base: m, exp: n, value: sol } : { base: 2, exp: n * m, value: total },
          feasible: isInt ? 1 : sol / total,
          redundancy: isInt ? 1 : matrixP().repairPreimages(inst, a),
          redundancyMean: isInt ? 1 : total / sol,   // exacta: cada matriz se repara a una sola asignación
        },
        local: finishLocal(assignmentCounts(inst, a, id)),
      };
    });
    return { solution: a.slice(), makespan: A.makespan(inst, a), rows };
  }

  function assignmentMean(n, m, samples, seed) {
    const r = R.mulberry32(R.seedState(seed));
    const accs = {};
    for (let s = 0; s < samples; s++) {
      const sd = 1 + Math.floor(r() * 4294967000);
      const inst = A.randomInstance(sd, n, m);
      const a = A.randomAssignment(sd, n, m);
      PROBLEMS.assignment.forEach((id) => { accs[id] = addTo(accs[id] || {}, assignmentCounts(inst, a, id)); });
    }
    const out = {};
    Object.keys(accs).forEach((id) => { out[id] = finishLocal(accs[id]); });
    return out;
  }

  // ======================================================================
  // Función
  // ======================================================================
  const STEP = 0.01;   // resolución de los reales en la herramienta
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

  /** Recuentos de localidad para el punto p escrito en una codificación. */
  function fnCounts(fnId, k, p, id) {
    const f0 = Fn.evalAt(fnId, p);
    const acc = { neighbours: 0, jump: 0, maxJump: 0, grid: 0, cliff: 0, dF: 0 };
    const visit = (q, isGrid) => {
      const d = dist(p, q);
      acc.neighbours++;
      acc.jump += d;
      acc.maxJump = Math.max(acc.maxJump, d);
      if (isGrid) acc.grid++;
      acc.dF += Math.abs(Fn.evalAt(fnId, q) - f0);
    };
    if (id === 'function-real') {
      [0, 1].forEach((i) => [1, -1].forEach((dir) => {
        const q = p.slice();
        q[i] = Fn.round2(q[i] + dir * STEP);
        visit(q, true);
      }));
      acc.cliff = 1;   // un vecino de la rejilla de centésimas está siempre a un gen
      return acc;
    }
    const code = id === 'function-gray' ? 'gray' : 'standard';
    const z = [Fn.nearestIndex(fnId, p[0], k), Fn.nearestIndex(fnId, p[1], k)];
    const bits = Fn.codeOf(z[0], k, code).concat(Fn.codeOf(z[1], k, code));
    const base = [Fn.scale(fnId, z[0], k), Fn.scale(fnId, z[1], k)];
    const f0b = Fn.evalAt(fnId, base);
    acc.dF = 0;
    for (let j = 0; j < 2 * k; j++) {
      const c = bits.slice();
      c[j] = 1 - c[j];
      const dec = Fn.decodeBits(fnId, c, k, code);
      const i = j < k ? 0 : 1;
      const isGrid = Math.abs(dec.z[i] - z[i]) === 1;
      const d = dist(base, dec.point);
      acc.neighbours++;
      acc.jump += d;
      acc.maxJump = Math.max(acc.maxJump, d);
      if (isGrid) acc.grid++;
      acc.dF += Math.abs(Fn.evalAt(fnId, dec.point) - f0b);
    }
    // Peor caso: bits que hay que cambiar para llegar a un vecino de la rejilla (z ± 1 en una variable)
    const N = Fn.levels(k);
    [0, 1].forEach((i) => [1, -1].forEach((dir) => {
      const z2 = z[i] + dir;
      if (z2 >= 0 && z2 <= N) acc.cliff = Math.max(acc.cliff, Fn.stepBits(z[i], z2, k, code));
    }));
    return acc;
  }

  function finishFn(acc) {
    const N = acc.neighbours || 1;
    const runs = acc.runs || 1;
    return { neighbours: acc.neighbours / runs, jump: acc.jump / N, maxJump: acc.maxJump / runs, gridNb: acc.grid / N, cliff: acc.cliff / runs, dF: acc.dF / N };
  }

  /** Punto que se compara: el de la página, en centésimas y dentro de la caja. */
  const comparePoint = (fnId, p) => Fn.clampPoint(fnId, p.map(Fn.round2));

  function fn(fnId, k, p0) {
    const F = Fn.fnOf(fnId);
    const p = comparePoint(fnId, p0);
    const rows = PROBLEMS.function.map((id) => {
      const isReal = id === 'function-real';
      const code = id === 'function-gray' ? 'gray' : 'standard';
      return {
        id,
        chrom: isReal ? p.slice() : Fn.encodePoint(fnId, p, k, code),
        space: {
          genes: { k, nb: 2 * k, real: isReal },
          size: isReal ? null : { base: 2, exp: 2 * k, value: Math.pow(2, 2 * k) },
          precision: isReal ? STEP : Fn.delta(fnId, k),
          box: isReal ? 'out' : 'in',
        },
        local: finishFn(fnCounts(fnId, k, p, id)),
      };
    });
    const z = [Fn.nearestIndex(fnId, p[0], k), Fn.nearestIndex(fnId, p[1], k)];
    return { point: p, grid: [Fn.scale(fnId, z[0], k), Fn.scale(fnId, z[1], k)], box: { a: F.a, b: F.b }, rows };
  }

  function fnMean(fnId, k, samples, seed) {
    const r = R.mulberry32(R.seedState(seed));
    const accs = {};
    for (let s = 0; s < samples; s++) {
      const p = Fn.randomPoint(fnId, 1 + Math.floor(r() * 4294967000));
      PROBLEMS.function.forEach((id) => {
        const c = fnCounts(fnId, k, p, id);
        const acc = accs[id] || (accs[id] = {});
        ['neighbours', 'jump', 'grid', 'dF', 'maxJump', 'cliff'].forEach((key) => { acc[key] = (acc[key] || 0) + c[key]; });
        acc.runs = (acc.runs || 0) + 1;
      });
    }
    const out = {};
    Object.keys(accs).forEach((id) => { out[id] = finishFn(accs[id]); });
    return out;
  }

  const api = { PROBLEMS, PAGE, COLUMNS, problemOf, STEP, assignment, assignmentMean, assignmentCounts, fn, fnMean, fnCounts, comparePoint, decodeMatrix };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).compare = api;
})(typeof self !== 'undefined' ? self : this);
