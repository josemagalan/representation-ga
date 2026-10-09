/*
 * Asignación de tareas a máquinas no relacionadas (R‖Cmax) con una matriz binaria.
 *
 * Cromosoma: y = (yᵢⱼ), n × m bits; yᵢⱼ = 1 si la tarea i se hace en la máquina j. La restricción
 * Σⱼ yᵢⱼ = 1 (cada tarea en exactamente una máquina) no la garantiza la codificación: de los 2ⁿᵐ
 * cromosomas solo mⁿ son factibles. Leída tal cual, una tarea sin unos no se hace y una tarea con
 * varios unos se hace en todas esas máquinas.
 * Tratamientos de la infactibilidad (variantes):
 *   repair    tarea a tarea: sin unos → la máquina más rápida para ella; con varios → se queda el
 *             de menor pᵢⱼ (empates: la máquina de menor índice)
 *   penalty   aptitud = Cmax de la matriz tal cual + λ · v,  v = Σᵢ │Σⱼ yᵢⱼ − 1│
 *
 * run(instance, y, opts) devuelve { steps, result, stats } con la traza de las cinco etapas.
 * Funciona tanto en el navegador (window.GAX.problems['assignment-matrix']) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const A = isNode ? require('../assignment.js') : root.GAX.assignment;
  const R = isNode ? require('../rng.js') : root.GAX.rng;

  const VARIANTS = ['repair', 'penalty'];
  const LAMBDA = { min: 0, max: 10, step: 0.5, def: 1 };

  /** Matriz aleatoria: cada bit vale 1 con probabilidad 1/m, de modo que haya filas con cero, uno o varios unos. */
  function randomChromosome(seed, n, m) {
    const r = R.mulberry32((Math.imul((seed >>> 0) || 1, 3266489917) ^ 0x85ebca6b) >>> 0);
    return Array.from({ length: n }, () => Array.from({ length: m }, () => (r() < 1 / m ? 1 : 0)));
  }

  /** Matriz factible aleatoria: la de una asignación aleatoria. */
  const randomFeasible = (seed, n, m) => A.toMatrix(A.randomAssignment(seed, n, m), m);

  /** Clave de error de i18n, o null. Las filas con cero o varios unos se admiten: son infactibles, no un error. */
  function validate(inst, y) {
    const err = A.validateInstance(inst);
    if (err) return err;
    const { n, m } = A.sizes(inst);
    if (y) {
      if (!Array.isArray(y) || y.length !== n || !y.every((row) => Array.isArray(row) && row.length === m)) return 'errMatrixShape';
      if (!y.every((row) => row.every((b) => b === 0 || b === 1))) return 'errMatrixBits';
    }
    return null;
  }

  // ---------- Tratamientos ----------

  function repair(inst, y) {
    const out = y.map((row) => row.slice());
    const fixes = [];
    out.forEach((row, i) => {
      const ones = A.rowOnes(row);
      if (ones.length === 1) return;
      const j = A.fastest(inst, i, ones);
      fixes.push({ task: i, machine: j, ones, kind: ones.length ? 'many' : 'none' });
      out[i] = row.map((_, k) => (k === j - 1 ? 1 : 0));
    });
    return { matrix: out, fixes };
  }

  function penaltyFitness(inst, y, lambda) {
    const cmax = A.cmaxOf(A.matrixLoads(inst, y));
    const v = A.violations(y);
    return { cmax, v, penalty: lambda * v, fitness: cmax + lambda * v };
  }

  /** Aptitud con un tratamiento: { fitness, solution (matriz evaluada), ... } */
  function evaluate(inst, y, variant, opts) {
    const lambda = opts && opts.lambda != null ? opts.lambda : LAMBDA.def;
    if (variant === 'penalty') return Object.assign({ solution: y.map((r) => r.slice()) }, penaltyFitness(inst, y, lambda));
    const rp = repair(inst, y);
    return { fitness: A.cmaxOf(A.matrixLoads(inst, rp.matrix)), solution: rp.matrix, fixes: rp.fixes };
  }

  /**
   * Cuántas matrices da la reparación como esta asignación: por cada tarea, la fila tiene que llevar
   * el 1 de su máquina j, puede llevar unos en las máquinas peores que j y ninguno en las mejores;
   * si j es la mejor de todas, también vale la fila vacía.
   */
  function repairPreimages(inst, a) {
    const { m } = A.sizes(inst);
    return a.reduce((prod, j, i) => {
      let worse = 0;
      for (let k = 1; k <= m; k++) if (k !== j && A.beats(inst, i, j, k)) worse++;
      return prod * (Math.pow(2, worse) + (worse === m - 1 ? 1 : 0));
    }, 1);
  }

  const pct1 = (v) => Math.round(v * 1000) / 10;
  /** Porcentaje con dos cifras significativas (los factibles pueden ser una fracción minúscula). */
  const share = (v) => { const p = 100 * v; return p >= 10 ? Math.round(p) : Number(p.toPrecision(2)); };
  const rowsText = (y) => y.map((row) => row.join('')).join(' ');

  // ---------- Traza paso a paso ----------

  function run(inst, y, opts) {
    opts = opts || {};
    const err = validate(inst, y);
    if (err) throw new Error(err);
    const variant = VARIANTS.indexOf(opts.variant) !== -1 ? opts.variant : VARIANTS[0];
    const lambda = opts.lambda == null ? LAMBDA.def : opts.lambda;
    const { n, m } = A.sizes(inst);
    const opt = A.optimum(inst);
    const total = Math.pow(2, n * m);
    const stats = { total, feasible: Math.pow(m, n), optimum: opt.makespan, optimalAssignment: opt.assignment, optimalCount: opt.count, bound: A.lambdaBound(inst) };
    const steps = [];
    const st = { genes: y.map((r) => r.slice()), revealed: 0, formula: null, showOpt: false, result: null, changed: [] };
    const curLoads = () => A.matrixLoads(inst, st.genes.slice(0, st.revealed));
    function snap(type, stage, key, params, extra) {
      steps.push(Object.assign({
        type, stage, text: { key, params: params || {} },
        genes: st.genes.map((r) => r.slice()), revealed: st.revealed, formula: st.formula, showOpt: st.showOpt, result: st.result,
        loads: curLoads(), changed: st.changed.slice(), focus: [], cells: [],
      }, extra || {}));
    }

    // 1 · Problema
    snap('problem', 1, 'problem', { n, m });
    // 2 · Formalización
    st.formula = 'vars';
    snap('formVars', 2, 'formVars', { n, m, nm: n * m });
    st.formula = 'obj';
    snap('formObj', 2, 'formObj', {});
    st.formula = 'cons';
    snap('formCons', 2, 'formCons', { n });
    st.formula = 'space';
    st.showOpt = true;
    snap('formSpace', 2, 'formSpace', { nm: n * m, pow: A.power(2, n * m), total, mn: A.power(m, n), feasible: stats.feasible, share: share(stats.feasible / total), opt: opt.makespan });
    st.formula = null;
    st.showOpt = false;
    // 3 · Codificación
    snap('encode', 3, 'encode', { chrom: rowsText(y), nm: n * m });
    // 4 · Exploración: decodificación tarea a tarea, leyendo la matriz tal cual
    snap('decodeIntro', 4, 'decodeIntro', {});
    const none = [];
    const many = [];
    for (let i = 0; i < n; i++) {
      st.revealed = i + 1;
      const ones = A.rowOnes(y[i]);
      const L = curLoads();
      const cells = ones.map((j) => [i, j]);
      if (ones.length === 1) {
        const j = ones[0];
        snap('decodeOne', 4, 'decodeOne', { i: i + 1, j, p: inst.p[i][j - 1], load: L[j - 1] }, { focus: [i], cells });
      } else if (!ones.length) {
        none.push(i + 1);
        snap('decodeNone', 4, 'decodeNone', { i: i + 1 }, { focus: [i] });
      } else {
        many.push(i + 1);
        snap('decodeMany', 4, 'decodeMany', { i: i + 1, list: ones.join(', '), k: ones.length }, { focus: [i], cells });
      }
    }
    const L = A.matrixLoads(inst, y);
    const cmax = A.cmaxOf(L);
    const feasible = !none.length && !many.length;
    st.showOpt = true;
    if (feasible) {
      snap('decodeDone', 4, cmax === opt.makespan ? 'decodeDoneOpt' : 'decodeDone', { loads: L.join(', '), cmax, opt: opt.makespan, gap: pct1((cmax - opt.makespan) / opt.makespan) });
    } else {
      snap('decodeDone', 4, 'decodeDoneBad', { loads: L.join(', '), cmax, opt: opt.makespan });
    }
    st.showOpt = false;

    // 5 · Validez
    let result;
    if (feasible) {
      const a = A.fromMatrix(y);
      result = { fitness: cmax, solution: y.map((r) => r.slice()), assignment: a, feasible: true };
      st.result = result;
      snap('feasible', 5, 'feasible', { cmax, vec: a.join(' ') });
      snap('locality', 5, 'locality', { nm: n * m });
    } else {
      const v = A.violations(y);
      snap('infeasible', 5, none.length && many.length ? 'infeasibleBoth' : none.length ? 'infeasibleNone' : 'infeasibleMany',
        { none: none.join(', '), many: many.join(', '), v });
      if (variant === 'penalty') {
        const pf = penaltyFitness(inst, y, lambda);
        result = { fitness: pf.fitness, cmax: pf.cmax, violations: v, penalty: pf.penalty, solution: y.map((r) => r.slice()), feasible: false };
        st.result = result;
        st.showOpt = true;
        snap('penalty', 5, 'penalty', { cmax: pf.cmax, lambda, v, pen: pf.penalty, fitness: pf.fitness });
        snap('penaltyCompare', 5, pf.fitness < opt.makespan ? 'penaltyBeats' : 'penaltyBelow', { fitness: pf.fitness, opt: opt.makespan, bound: stats.bound });
      } else {
        snap('repairIntro', 5, 'repairIntro', {});
        const rp = repair(inst, y);
        rp.fixes.forEach((f) => {
          const i = f.task;
          st.genes[i] = st.genes[i].map((_, k) => (k === f.machine - 1 ? 1 : 0));
          y[i].forEach((b, k) => { if (b !== st.genes[i][k]) st.changed.push([i, k + 1]); });
          snap('repairFix', 5, f.kind === 'none' ? 'repairNone' : 'repairMany',
            { i: i + 1, j: f.machine, p: inst.p[i][f.machine - 1], list: f.ones.join(', ') }, { focus: [i], cells: [[i, f.machine]] });
        });
        const a = A.fromMatrix(rp.matrix);
        const rc = A.makespan(inst, a);
        result = { fitness: rc, solution: rp.matrix, assignment: a, feasible: true, fixes: rp.fixes };
        st.result = result;
        st.showOpt = true;
        snap('repairDone', 5, 'repairDone', { chrom: rowsText(rp.matrix), vec: a.join(' '), cmax: rc, opt: opt.makespan, k: rp.fixes.length });
        st.showOpt = false;
        const pre = repairPreimages(inst, a);
        snap('repairRedundancy', 5, 'repairRedundancy', { count: pre, total });
      }
    }
    return { steps, result, stats, variant, lambda, draws: [] };
  }

  const api = {
    VARIANTS, LAMBDA, LIMITS: A.LIMITS, randomInstance: A.randomInstance, randomChromosome, randomFeasible,
    validate, repair, penaltyFitness, evaluate, repairPreimages, share, run,
  };
  if (isNode) module.exports = api;
  else {
    const G = (root.GAX = root.GAX || {});
    (G.problems = G.problems || {})['assignment-matrix'] = api;
  }
})(typeof self !== 'undefined' ? self : this);
