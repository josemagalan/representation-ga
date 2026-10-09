/*
 * Asignación de tareas a máquinas no relacionadas (R‖Cmax) con un vector de enteros.
 *
 * Cromosoma: a = (a₁, …, aₙ), aᵢ ∈ {1, …, m}: la máquina en la que se hace la tarea i. La
 * restricción «cada tarea en exactamente una máquina» se cumple por construcción, así que los mⁿ
 * cromosomas son asignaciones factibles. El entero es nominal: una etiqueta, no una cantidad.
 *
 * run(instance, a) devuelve { steps, result, stats } con la traza de las cinco etapas.
 * Funciona tanto en el navegador (window.GAX.problems['assignment-int']) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const A = isNode ? require('../assignment.js') : root.GAX.assignment;

  const VARIANTS = ['int'];

  /** Clave de error de i18n, o null. */
  function validate(inst, a) {
    const err = A.validateInstance(inst);
    if (err) return err;
    const { n, m } = A.sizes(inst);
    if (a) {
      if (a.length !== n) return 'errAssignLength';
      if (!a.every((g) => Number.isInteger(g) && g >= 1 && g <= m)) return 'errAssignGenes';
    }
    return null;
  }

  const pct1 = (v) => Math.round(v * 1000) / 10;

  function run(inst, a) {
    const err = validate(inst, a);
    if (err) throw new Error(err);
    const { n, m } = A.sizes(inst);
    const opt = A.optimum(inst);
    const stats = { total: Math.pow(m, n), feasible: Math.pow(m, n), optimum: opt.makespan, optimalAssignment: opt.assignment, optimalCount: opt.count };
    const steps = [];
    const st = { revealed: 0, formula: null, showOpt: false, result: null };
    const L = Array(m).fill(0);
    function snap(type, stage, key, params, extra) {
      steps.push(Object.assign({
        type, stage, text: { key, params: params || {} },
        genes: a.slice(), revealed: st.revealed, formula: st.formula, showOpt: st.showOpt, result: st.result,
        loads: L.slice(), changed: [], focus: [], cells: [],
      }, extra || {}));
    }

    // 1 · Problema
    snap('problem', 1, 'problem', { n, m });
    // 2 · Formalización
    st.formula = 'vars';
    snap('formVars', 2, 'formVars', { n, m });
    st.formula = 'obj';
    snap('formObj', 2, 'formObj', {});
    st.formula = 'cons';
    snap('formCons', 2, 'formCons', {});
    st.formula = 'space';
    st.showOpt = true;
    snap('formSpace', 2, 'formSpace', { m, n, pow: A.power(m, n), total: stats.total, opt: opt.makespan });
    st.formula = null;
    st.showOpt = false;
    // 3 · Codificación
    snap('encode', 3, 'encode', { chrom: a.join(' '), m });
    // 4 · Exploración: decodificación tarea a tarea
    snap('decodeIntro', 4, 'decodeIntro', {});
    for (let i = 0; i < n; i++) {
      const j = a[i];
      L[j - 1] += inst.p[i][j - 1];
      st.revealed = i + 1;
      snap('decodeTask', 4, 'decodeTask', { i: i + 1, j, p: inst.p[i][j - 1], load: L[j - 1] }, { focus: [i], cells: [[i, j]] });
    }
    const cmax = A.cmaxOf(L);
    const crit = A.critical(L);
    st.showOpt = true;
    snap('decodeDone', 4, cmax === opt.makespan ? 'decodeDoneOpt' : 'decodeDone',
      { loads: L.join(', '), cmax, crit: crit.join(', '), opt: opt.makespan, gap: pct1((cmax - opt.makespan) / opt.makespan) });
    st.showOpt = false;
    // 5 · Validez
    const result = { fitness: cmax, assignment: a.slice(), loads: L.slice(), feasible: true };
    st.result = result;
    snap('validInt', 5, 'validInt', { cmax, total: stats.total });
    snap('nominal', 5, 'nominal', { m });
    return { steps, result, stats, draws: [] };
  }

  const api = {
    VARIANTS, LIMITS: A.LIMITS, randomInstance: A.randomInstance, randomChromosome: A.randomAssignment,
    validate, run,
    evaluate: (inst, a) => ({ fitness: A.makespan(inst, a), solution: a.slice() }),
  };
  if (isNode) module.exports = api;
  else {
    const G = (root.GAX = root.GAX || {});
    (G.problems = G.problems || {})['assignment-int'] = api;
  }
})(typeof self !== 'undefined' ? self : this);
