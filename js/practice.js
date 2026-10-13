/*
 * Modo «Practicar»: ejercicios de codificar, decodificar, validez (o localidad) y aptitud sobre el
 * ejemplo de la página. Lógica pura, sin DOM: la usan la página, los tests y, después, Moodle.
 *
 * Una «página» es el estado de una codificación tal como lo guarda la URL:
 *   knapsack-bits      { inst: { weights, values, capacity }, x, variant, lambda, draw }
 *   tsp-perm           { inst: { coords }, x }
 *   assignment-int     { inst: { p }, x }                  x = (a₁, …, aₙ)
 *   assignment-matrix  { inst: { p }, x, variant, lambda }  x = matriz n × m de bits
 *   function-real      { fn, x, variant, lambda }           x = (x₁, x₂)
 *   function-bits      { fn, k, variant, x }                variant = 'standard' | 'gray'; x = 2k bits
 *
 * exercise(id, type, page) → {
 *   id, type,
 *   page,       la página que usa el ejercicio (a veces con el tratamiento o el cromosoma que pide el
 *               tipo de ejercicio; volver a llamar a exercise con ella da el mismo ejercicio)
 *   givens,     [{ key, params } | { table: { head, rows } }]   datos que se dan, además de la vista
 *   groups,     [{ id, key, params, kind, items: [{ label: { key, params }, answer }], options?, tol?, grid? }]
 *   view,       { type, hideGenes }   paso de la traza que se enseña mientras se practica
 *   solution,   { types } | { last }  paso al que lleva «Ver la solución»: el primero de esos tipos, o el último
 * }
 * start: valores con los que empieza la respuesta (p. ej., el cromosoma que hay que reparar).
 * Tipos de respuesta (kind): 'bit' (0/1), 'check' (0/1, casilla), 'yesno' ('yes'/'no'),
 * 'choice' (uno de options), 'int', 'num' (con tolerancia tol(valor correcto)) y 'tour' (circuito del
 * viajante: se corrige por aristas, así que vale cualquiera de los 2n cromosomas equivalentes).
 *
 * validate(ex, response) → clave de error o null;  grade(ex, response) → corrección elemento a elemento.
 * response = { [id del grupo]: [valores] }.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const G = isNode ? null : root.GAX;
  const R = isNode ? require('./rng.js') : G.rng;
  const A = isNode ? require('./assignment.js') : G.assignment;
  const Fn = isNode ? require('./func.js') : G.func;
  const problem = (id) => (isNode ? require(`./problems/${id}.js`) : G.problems[id]);

  const TYPES = {
    'knapsack-bits': ['encode', 'decode', 'validity', 'fitness'],
    'tsp-perm': ['encode', 'decode', 'validity', 'fitness'],
    'assignment-int': ['encode', 'decode', 'fitness'],
    'assignment-matrix': ['encode', 'decode', 'validity', 'fitness'],
    'function-real': ['validity', 'fitness'],
    'function-bits': ['encode', 'decode', 'locality', 'fitness'],
  };
  const typesFor = (id) => (TYPES[id] || []).slice();

  // ---------- Tolerancias ----------
  const EXACT = () => 1e-6;            // enteros y décimas exactas (distancias del viajante)
  const CENTS = () => 0.005;           // centésimas exactas (penalizaciones, acotar y reflejar)
  const COORD = () => 0.01;            // coordenadas de la rejilla, que no son exactas en decimal
  /** f de la función: ±0,01 o el 0,1 % del valor, lo que sea mayor. */
  const FVAL = (v) => Math.max(0.01, 0.001 * Math.abs(v));
  const TOL = { exact: EXACT, cents: CENTS, coord: COORD, fval: FVAL };

  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const round2 = (v) => Math.round(v * 100) / 100 + 0;
  const lbl = (key, params) => ({ key, params: params || {} });
  const g = (key, params) => ({ key, params: params || {} });
  const cloneMatrix = (y) => y.map((r) => r.slice());
  const seq = (n, f) => Array.from({ length: n }, (_, i) => f(i));

  function group(id, key, kind, answers, labelOf, extra) {
    return Object.assign({ id, key, params: {}, kind, items: answers.map((a, i) => ({ label: labelOf(i), answer: a })) }, extra || {});
  }

  // ======================================================================
  // Mochila 0/1
  // ======================================================================
  function knapsack(type, page) {
    const P = problem('knapsack-bits');
    const { inst, x } = page;
    const n = x.length;
    const W = inst.capacity;
    const chrom = x.join('');
    const geneLabel = (i) => lbl('prGene', { i: i + 1 });
    const itemLabel = (i) => lbl('prItem', { i: i + 1 });

    if (type === 'encode') {
      const pg = Object.assign({}, page, { variant: 'decoder' });
      const sol = P.decoderDecode(inst, x).solution;
      const inside = sol.map((b, i) => (b ? i + 1 : 0)).filter(Boolean);
      // Gen i: el objeto de la solución exige un 1; uno que no está puede llevar un 1 solo si no cabe al llegar a él
      let acc = 0;
      const genes = sol.map((b, i) => {
        if (b) { acc += inst.weights[i]; return '1'; }
        return acc + inst.weights[i] > W ? 'any' : '0';
      });
      const free = genes.filter((v) => v === 'any').length;
      return {
        page: pg,
        givens: [
          g('prKnapEncodeSolution', { list: inside.length ? inside.join(', ') : '∅', weight: P.weightOf(inst, sol), value: P.valueOf(inst, sol), W }),
          g('prKnapDecoderRule'),
          g('prKnapEncodeTask'),
        ],
        groups: [
          group('genes', 'prKnapGenes', 'choice', genes, geneLabel, { options: ['1', '0', 'any'] }),
          group('count', 'prKnapCount', 'int', [Math.pow(2, free)], () => lbl('prCount')),
        ],
        view: { type: 'decodeDone', hideGenes: true },
        solution: { types: ['decoderRedundancy'] },
      };
    }

    if (type === 'decode') {
      const dec = page.variant === 'decoder';
      const sol = dec ? P.decoderDecode(inst, x).solution : x.slice();
      return {
        page,
        givens: [g('prChromosome', { chrom }), g(dec ? 'prKnapReadDecoder' : 'prKnapReadAsIs'), g('prKnapDecodeTask')],
        groups: [
          group('inside', 'prKnapInside', 'check', sol, itemLabel),
          group('weight', 'prWeight', 'int', [P.weightOf(inst, sol)], () => lbl('prWeightShort')),
          group('value', 'prValue', 'int', [P.valueOf(inst, sol)], () => lbl('prValueShort')),
        ],
        view: { type: 'encode' },
        solution: { types: ['decodeIntro'] },
      };
    }

    if (type === 'validity') {
      const v = page.variant;
      const w = P.weightOf(inst, x);
      const feasible = w <= W;
      const givens = [g('prChromosome', { chrom }), g('prKnapValidityAsIs', { W })];
      const opts = { lambda: page.lambda };
      if (v === 'repair-random') {
        // Se dan tantos números como objetos dentro (nunca se sacan más); la reparación usa los primeros
        const k = Math.max(1, sum(x));
        const src = P.drawSource({ seed: page.draw });
        const draws = seq(k, () => src.next());
        opts.draws = draws;
        givens.push(g('prKnapTreat_repair-random'), g('prKnapDraws', { draws }));
      } else givens.push(g(`prKnapTreat_${v}`, { lambda: page.lambda }));
      const groups = [group('feasible', 'prKnapFeasible', 'yesno', [feasible ? 'yes' : 'no'], () => lbl('prFeasibleShort'))];
      if (v.startsWith('penalty')) {
        groups.push(group('excess', 'prKnapExcess', 'int', [Math.max(0, w - W)], () => lbl('prExcessShort')));
        givens.push(g('prKnapValidityTaskPenalty'));
      } else {
        const ev = P.evaluate(inst, x, v, opts);
        groups.push(group('treated', v === 'decoder' ? 'prKnapDecoded' : 'prKnapRepaired', 'bit', ev.solution, geneLabel, { start: x.slice() }));
        givens.push(g(v === 'decoder' ? 'prKnapValidityTaskDecoder' : 'prKnapValidityTaskRepair'));
      }
      return { page, givens, groups, view: { type: 'encode' }, solution: { types: ['feasible', 'infeasible'] } };
    }

    // Aptitud: con penalización (la de la página si es cuadrática; si no, lineal)
    const variant = page.variant === 'penalty-quadratic' ? 'penalty-quadratic' : 'penalty-linear';
    const pg = Object.assign({}, page, { variant });
    const w = P.weightOf(inst, x);
    const val = P.valueOf(inst, x);
    const pf = P.penaltyFitness(inst, x, variant, page.lambda);
    return {
      page: pg,
      givens: [g('prChromosome', { chrom }), g(`prKnapFit_${variant}`, { lambda: page.lambda, W })],
      groups: [
        group('value', 'prKnapValueAsIs', 'int', [val], () => lbl('prValueShort')),
        group('excess', 'prKnapExcess', 'int', [Math.max(0, w - W)], () => lbl('prExcessShort')),
        group('penalty', 'prPenalty', 'num', [round2(pf.penalty)], () => lbl('prPenaltyShort'), { tol: 'cents' }),
        group('fitness', 'prFitness', 'num', [round2(pf.fitness)], () => lbl('prFitnessShort'), { tol: 'cents' }),
      ],
      view: { type: 'encode' },
      solution: { last: true },
    };
  }

  // ======================================================================
  // Viajante
  // ======================================================================
  function tsp(type, page) {
    const P = problem('tsp-perm');
    const { inst, x } = page;
    const n = x.length;
    const placeLabel = (i) => lbl('prPlace', { i: i + 1 });

    if (type === 'encode') {
      const tour = P.repair(x).tour;
      return {
        page: Object.assign({}, page, { x: tour }),
        givens: [g('prTspEncodeTask', { n, twoN: 2 * n })],
        groups: [group('tour', 'prTspChromosome', 'tour', tour, placeLabel)],
        view: { type: 'decodeClose', hideGenes: true, route: true },
        solution: { types: ['redundancy'] },
      };
    }
    if (type === 'decode') {
      return {
        page,
        givens: [g('prChromosome', { chrom: x.join(' ') }), g('prTspDecodeTask')],
        groups: [group('tour', 'prTspCircuit', 'tour', x.slice(), (i) => lbl('prVisit', { i: i + 1 }))],
        view: { type: 'encode', route: true },
        solution: { types: ['decodeIntro'] },
      };
    }
    if (type === 'validity') {
      const info = P.analyze(x);
      return {
        page,
        givens: [g('prChromosome', { chrom: x.join(' ') }), g('prTspRepairRule'), g('prTspValidityTask')],
        groups: [
          group('valid', 'prTspIsPerm', 'yesno', [info.valid ? 'yes' : 'no'], () => lbl('prPermShort')),
          group('repaired', 'prTspRepaired', 'int', P.repair(x).tour, placeLabel, { min: 1, max: n, start: x.slice() }),
        ],
        view: { type: 'encode' },
        solution: { types: ['validPerm', 'invalidPerm'] },
      };
    }
    // Aptitud: longitud del circuito (de la permutación reparada, si hiciera falta)
    const tour = P.repair(x).tour;
    const cities = seq(n, (i) => i + 1);
    const table = { head: cities, rows: cities.map((a) => [a].concat(cities.map((b) => (a === b ? null : P.distTenths(inst, a, b) / 10)))) };
    const legs = seq(n, (k) => P.distTenths(inst, tour[k], tour[(k + 1) % n]) / 10);
    return {
      page: Object.assign({}, page, { x: tour }),
      givens: [g('prChromosome', { chrom: tour.join(' ') }), g('prTspFitTask'), { table, key: 'prTspTable' }],
      groups: [
        group('legs', 'prTspLegs', 'num', legs, (k) => lbl('prLeg', { k: k + 1 }), { tol: 'exact' }),
        group('length', 'prTspLength', 'num', [P.tourLength(inst, tour)], () => lbl('prLengthShort'), { tol: 'exact' }),
      ],
      view: { type: 'encode' },
      solution: { last: true },
    };
  }

  // ======================================================================
  // Asignación de tareas a máquinas
  // ======================================================================
  const machineOptions = (m) => seq(m, (j) => String(j + 1));
  const taskLabel = (i) => lbl('prTask', { i: i + 1 });
  const machLabel = (j) => lbl('prMachine', { j: j + 1 });

  function assignmentInt(type, page) {
    const { inst, x } = page;
    const { n, m } = A.sizes(inst);
    if (type === 'encode') {
      return {
        page,
        givens: [g('prAssignEncodeTask', { n, m })],
        groups: [group('vector', 'prAssignVector', 'choice', x.map(String), taskLabel, { options: machineOptions(m) })],
        view: { type: 'decodeDone', hideGenes: true },
        solution: { types: ['encode'] },
      };
    }
    const L = A.loads(inst, x);
    if (type === 'decode') {
      return {
        page,
        givens: [g('prChromosome', { chrom: x.join(' ') }), g('prAssignDecodeTask')],
        groups: [group('loads', 'prAssignLoads', 'int', L, machLabel)],
        view: { type: 'encode' },
        solution: { types: ['decodeIntro'] },
      };
    }
    const cmax = A.cmaxOf(L);
    return {
      page,
      givens: [g('prChromosome', { chrom: x.join(' ') }), g('prAssignFitTask')],
      groups: [
        group('cmax', 'prMakespan', 'int', [cmax], () => lbl('prMakespanShort')),
        group('critical', 'prCritical', 'check', L.map((v) => (v === cmax ? 1 : 0)), machLabel),
      ],
      view: { type: 'encode' },
      solution: { last: true },
    };
  }

  function assignmentMatrix(type, page) {
    const P = problem('assignment-matrix');
    const { inst, x } = page;
    const { n, m } = A.sizes(inst);
    const rows = x.map((r) => r.join('')).join(' ');
    const flat = (y) => [].concat(...y);
    const cellLabel = (q) => lbl('prCell', { i: Math.floor(q / m) + 1, j: (q % m) + 1 });
    const grid = { n, m };
    if (type === 'encode') {
      const a = A.fromMatrix(x) || A.fromMatrix(P.repair(inst, x).matrix);
      const y = A.toMatrix(a, m);
      return {
        page: Object.assign({}, page, { x: y }),
        givens: [g('prAssignVectorGiven', { vec: a.join(' ') }), g('prMatrixEncodeTask', { n, m })],
        groups: [group('matrix', 'prMatrix', 'bit', flat(y), cellLabel, { grid })],
        view: { type: 'decodeDone', hideGenes: true },
        solution: { types: ['encode'] },
      };
    }
    if (type === 'decode') {
      const ans = x.map((row) => {
        const ones = A.rowOnes(row);
        return ones.length === 1 ? String(ones[0]) : (ones.length ? 'many' : 'none');
      });
      return {
        page,
        givens: [g('prMatrixGiven', { rows }), g('prMatrixDecodeTask')],
        groups: [group('vector', 'prAssignVector', 'choice', ans, taskLabel, { options: machineOptions(m).concat(['none', 'many']) })],
        view: { type: 'encode' },
        solution: { types: ['decodeIntro'] },
      };
    }
    if (type === 'validity') {
      const pg = Object.assign({}, page, { variant: 'repair' });
      return {
        page: pg,
        givens: [g('prMatrixGiven', { rows }), g('prMatrixRepairRule'), g('prMatrixValidityTask')],
        groups: [
          group('invalid', 'prMatrixInvalidRows', 'check', x.map((row) => (A.rowOnes(row).length === 1 ? 0 : 1)), taskLabel),
          group('repaired', 'prMatrixRepaired', 'bit', flat(P.repair(inst, x).matrix), cellLabel, { grid, start: flat(x) }),
        ],
        view: { type: 'encode' },
        solution: { types: ['feasible', 'infeasible'] },
      };
    }
    const pg = Object.assign({}, page, { variant: 'penalty' });
    const pf = P.penaltyFitness(inst, x, page.lambda);
    return {
      page: pg,
      givens: [g('prMatrixGiven', { rows }), g('prMatrixFitRule', { lambda: page.lambda })],
      groups: [
        group('cmax', 'prMatrixCmaxAsIs', 'int', [pf.cmax], () => lbl('prMakespanShort')),
        group('v', 'prMatrixViolations', 'int', [pf.v], () => lbl('prViolationsShort')),
        group('fitness', 'prFitness', 'num', [round2(pf.fitness)], () => lbl('prFitnessShort'), { tol: 'cents' }),
      ],
      view: { type: 'encode' },
      solution: { last: true },
    };
  }

  // ======================================================================
  // Función continua: vector de reales
  // ======================================================================
  const coordLabel = (i) => lbl(i === 0 ? 'prX1' : 'prX2');

  function functionReal(type, page) {
    const P = problem('function-real');
    const F = Fn.fnOf(page.fn);
    const x = page.x;
    const base = [g(`prFn_${F.id}`, { a: F.a, b: F.b }), g('prPointGiven', { x1: x[0], x2: x[1] })];
    if (type === 'validity') {
      const variant = page.variant === 'reflect' ? 'reflect' : 'clamp';
      const pg = Object.assign({}, page, { variant });
      const ev = P.evaluate({ fn: page.fn }, x, variant, {});
      return {
        page: pg,
        givens: base.concat([g(`prRealTreat_${variant}`, { a: F.a, b: F.b }), g('prRealValidityTask')]),
        groups: [
          group('inside', 'prRealInside', 'yesno', [Fn.inBox(page.fn, x) ? 'yes' : 'no'], () => lbl('prInsideShort')),
          group('point', 'prRealTreated', 'num', ev.solution.map(round2), coordLabel, { tol: 'cents' }),
        ],
        view: { type: 'encode' },
        solution: { types: ['validIn', 'validOut'] },
      };
    }
    const v = page.variant;
    const ev = P.evaluate({ fn: page.fn }, x, v, { lambda: page.lambda });
    const givens = base.concat([g(`prRealTreat_${v}`, { a: F.a, b: F.b, lambda: page.lambda }), g('prFvalTol')]);
    let groups;
    if (v === 'penalty') {
      groups = [
        group('f', 'prFx', 'num', [Fn.evalAt(page.fn, x)], () => lbl('prFxShort'), { tol: 'fval' }),
        group('d', 'prRealDistance', 'num', [round2(ev.d)], () => lbl('prDistanceShort'), { tol: 'cents' }),
        group('fitness', 'prFitness', 'num', [ev.fitness], () => lbl('prFitnessShort'), { tol: 'fval' }),
      ];
    } else {
      groups = [
        group('point', 'prRealEvaluated', 'num', ev.solution.map(round2), coordLabel, { tol: 'cents' }),
        group('fitness', 'prFitness', 'num', [ev.fitness], () => lbl('prFitnessShort'), { tol: 'fval' }),
      ];
    }
    return { page, givens, groups, view: { type: 'encode' }, solution: { last: true } };
  }

  // ======================================================================
  // Función continua: cadena binaria (estándar o Gray)
  // ======================================================================
  /** Vecino de la rejilla con el mayor salto de Hamming (el mismo que enseña el paso a paso). */
  function cliffOf(z, k, code) {
    const N = Fn.levels(k);
    let best = null;
    [0, 1].forEach((i) => [1, -1].forEach((dir) => {
      const z2 = z[i] + dir;
      if (z2 < 0 || z2 > N) return;
      const h = Fn.stepBits(z[i], z2, k, code);
      if (!best || h > best.h) best = { i, z: z[i], z2, h };
    }));
    return best;
  }

  function functionBits(type, page) {
    const F = Fn.fnOf(page.fn);
    const { k, x } = page;
    const code = page.variant === 'gray' ? 'gray' : 'standard';
    const dec = Fn.decodeBits(page.fn, x, k, code);
    const base = [g(`prFn_${F.id}`, { a: F.a, b: F.b }), g(`prBitsSetup_${code}`, { k, nb: 2 * k, n1: Fn.levels(k), delta: Fn.delta(page.fn, k) })];
    const bitLabel = (off) => (j) => lbl('prBit', { j: off + j + 1 });
    const varGroups = (id, key, bits, start) => [
      group(`${id}1`, `${key}1`, 'bit', bits.slice(0, k), bitLabel(0), start ? { start: start.slice(0, k) } : {}),
      group(`${id}2`, `${key}2`, 'bit', bits.slice(k), bitLabel(k), start ? { start: start.slice(k) } : {}),
    ];
    const chrom = `${x.slice(0, k).join('')} ${x.slice(k).join('')}`;
    if (type === 'encode') {
      return {
        page,
        givens: base.concat([g('prBitsPointGiven', { x1: dec.point[0], x2: dec.point[1] }), g('prBitsEncodeTask')]),
        groups: varGroups('bits', 'prBitsOf', x),
        view: { type: 'decodeDone', hideGenes: true },
        solution: { types: ['encode'] },
      };
    }
    if (type === 'decode') {
      return {
        page,
        givens: base.concat([g('prChromosome', { chrom }), g('prBitsDecodeTask')]),
        groups: [
          group('z', 'prBitsZ', 'int', dec.z, (i) => lbl(i === 0 ? 'prZ1' : 'prZ2')),
          group('point', 'prBitsPoint', 'num', dec.point, coordLabel, { tol: 'coord' }),
        ],
        view: { type: 'encode' },
        solution: { types: ['decodeIntro'] },
      };
    }
    if (type === 'locality') {
      const c = cliffOf(dec.z, k, code);
      const target = x.slice();
      Fn.codeOf(c.z2, k, code).forEach((b, j) => { target[c.i * k + j] = b; });
      return {
        page,
        givens: base.concat([g('prChromosome', { chrom }),
          g(c.i === 0 ? 'prBitsNeighbour1' : 'prBitsNeighbour2', { z: c.z, z2: c.z2 }), g('prBitsLocalityTask')]),
        groups: varGroups('neighbour', 'prBitsNeighbourOf', target, x).concat([
          group('changed', 'prBitsChanged', 'int', [c.h], () => lbl('prChangedShort')),
        ]),
        view: { type: 'encode' },
        solution: { types: ['hamming'] },
        cliff: c,
      };
    }
    return {
      page,
      givens: base.concat([g('prChromosome', { chrom }), g('prBitsFitTask'), g('prFvalTol')]),
      groups: [
        group('point', 'prBitsPoint', 'num', dec.point, coordLabel, { tol: 'coord' }),
        group('f', 'prFx', 'num', [Fn.evalAt(page.fn, dec.point)], () => lbl('prFxShort'), { tol: 'fval' }),
      ],
      view: { type: 'encode' },
      solution: { last: true },
    };
  }

  // ======================================================================

  const BUILD = {
    'knapsack-bits': knapsack, 'tsp-perm': tsp, 'assignment-int': assignmentInt,
    'assignment-matrix': assignmentMatrix, 'function-real': functionReal, 'function-bits': functionBits,
  };

  function exercise(id, type, page) {
    if (!BUILD[id] || TYPES[id].indexOf(type) === -1) throw new Error(`practice: ${id}/${type}`);
    const ex = BUILD[id](type, page);
    ex.id = id;
    ex.type = type;
    return ex;
  }

  /** Página nueva para «Nuevo ejercicio»: otra instancia del mismo tamaño y otro cromosoma. */
  function newPage(id, type, seed, page) {
    const r = R.mulberry32((seed >>> 0) || 1);
    const coin = () => r() < 0.5;
    if (id === 'knapsack-bits') {
      const P = problem(id);
      const n = page.inst.weights.length;
      return Object.assign({}, page, { inst: P.randomInstance(seed, n), x: P.randomChromosome(seed, n), draw: (seed % 999) + 1, seed });
    }
    if (id === 'tsp-perm') {
      const P = problem(id);
      const n = page.x.length;
      const broken = type === 'validity' && coin();
      return Object.assign({}, page, { inst: P.randomInstance(seed, n), x: broken ? P.brokenChromosome(seed, n) : P.randomChromosome(seed, n), seed });
    }
    if (id === 'assignment-int' || id === 'assignment-matrix') {
      const { n, m } = A.sizes(page.inst);
      const inst = A.randomInstance(seed, n, m);
      let x;
      if (id === 'assignment-int') x = A.randomAssignment(seed, n, m);
      else x = type === 'encode' ? problem(id).randomFeasible(seed, n, m) : problem(id).randomChromosome(seed, n, m);
      return Object.assign({}, page, { inst, x, seed });
    }
    if (id === 'function-real') {
      const out = r() < 2 / 3;
      return Object.assign({}, page, { x: out ? Fn.randomOutside(page.fn, seed) : Fn.randomPoint(page.fn, seed) });
    }
    return Object.assign({}, page, { x: Fn.randomBits(seed, page.k) });
  }

  // ---------- Respuestas ----------

  /** Aristas no dirigidas de un circuito cerrado, como multiconjunto { 'a-b': veces }. */
  function edgeBag(c) {
    const bag = {};
    c.forEach((a, i) => {
      const b = c[(i + 1) % c.length];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      bag[key] = (bag[key] || 0) + 1;
    });
    return bag;
  }

  /** Clave de error de la respuesta (formato), o null. */
  function validate(ex, response) {
    for (const gr of ex.groups) {
      const vals = response && response[gr.id];
      if (!Array.isArray(vals) || vals.length !== gr.items.length) return gr.kind === 'tour' ? 'prErrTour' : 'prErrEmpty';
      for (const v of vals) {
        if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) return gr.kind === 'tour' ? 'prErrTour' : 'prErrEmpty';
        if (gr.kind === 'int' || gr.kind === 'tour') {
          if (!Number.isInteger(v)) return 'prErrInteger';
          if (gr.kind === 'tour' && (v < 1 || v > gr.items.length)) return 'prErrTour';
          if (gr.min != null && (v < gr.min || v > gr.max)) return 'prErrRange';
        } else if (gr.kind === 'num') {
          if (typeof v !== 'number' || !Number.isFinite(v)) return 'prErrNumber';
        } else if (gr.kind === 'bit' || gr.kind === 'check') {
          if (v !== 0 && v !== 1) return 'prErrEmpty';
        } else if (gr.kind === 'yesno') {
          if (v !== 'yes' && v !== 'no') return 'prErrEmpty';
        } else if (gr.kind === 'choice' && gr.options.indexOf(v) === -1) return 'prErrEmpty';
      }
    }
    return null;
  }

  /**
   * Corrección elemento a elemento: { groups: [{ id, items: [{ guess, correct, ok }] }], ok, total }.
   * En el viajante cada lugar k se corrige por la arista que sale de él: vale si el circuito correcto
   * la tiene (sin contar dos veces la misma), así que todo bien ⇔ el mismo circuito (cualquiera de los 2n).
   */
  function grade(ex, response) {
    let ok = 0;
    let total = 0;
    const groups = ex.groups.map((gr) => {
      const vals = response[gr.id];
      let items;
      if (gr.kind === 'tour') {
        const bag = edgeBag(gr.items.map((it) => it.answer));
        items = vals.map((a, i) => {
          const b = vals[(i + 1) % vals.length];
          const key = a < b ? `${a}-${b}` : `${b}-${a}`;
          const hit = bag[key] > 0;
          if (hit) bag[key]--;
          return { guess: a, correct: gr.items[i].answer, ok: hit, edge: [a, b] };
        });
      } else {
        const tol = gr.tol ? TOL[gr.tol] : null;
        items = vals.map((v, i) => {
          const c = gr.items[i].answer;
          const good = tol ? Math.abs(v - c) <= tol(c) + 1e-9 : v === c;
          return { guess: v, correct: c, ok: good };
        });
      }
      items.forEach((it) => { total++; if (it.ok) ok++; });
      return { id: gr.id, items };
    });
    return { groups, ok, total };
  }

  /** La respuesta correcta en el formato de response (para los tests y para Moodle). */
  const answerOf = (ex) => ex.groups.reduce((o, gr) => { o[gr.id] = gr.items.map((it) => it.answer); return o; }, {});

  const api = { TYPES, typesFor, exercise, newPage, validate, grade, answerOf, edgeBag, cliffOf, TOL };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).practice = api;
})(typeof self !== 'undefined' ? self : this);
