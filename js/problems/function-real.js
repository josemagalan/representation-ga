/*
 * Optimización de una función continua de dos variables con un vector de reales.
 *
 * Instancia: { fn } (himmelblau | rastrigin), con su caja [a, b]².
 * Cromosoma: x = (x₁, x₂), dos reales redondeados a centésimas. Toda la precisión del problema está
 * en el gen, pero nada impide que un gen quede fuera de [a, b] (escrito a mano, arrastrado fuera o
 * tras una mutación gaussiana).
 * Tratamientos de un punto fuera de la caja (variantes):
 *   clamp     acotar: cada gen fuera se lleva al límite más cercano
 *   reflect   reflejar: el gen se refleja en el límite que ha cruzado (repetido si hace falta)
 *   penalty   penalizar: aptitud = f(x) + λ · d, con d = Σᵢ máx(0, a − xᵢ, xᵢ − b)
 *
 * run(instance, x, opts) devuelve { steps, result, stats } con la traza de las cinco etapas.
 * Funciona tanto en el navegador (window.GAX.problems['function-real']) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const Fn = isNode ? require('../func.js') : root.GAX.func;

  const VARIANTS = ['clamp', 'reflect', 'penalty'];
  const LAMBDA = { min: 0, max: 100, step: 1, def: 10 };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** Clave de error de i18n, o null. Un gen fuera de la caja se admite: es infactible, no un error. */
  function validate(inst, x) {
    if (!inst || Fn.FN_IDS.indexOf(inst.fn) === -1) return 'errFunction';
    if (x) {
      if (!Array.isArray(x) || x.length !== 2) return 'errRealLength';
      if (!x.every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= Fn.LIMITS.realMax)) return 'errRealRange';
    }
    return null;
  }

  /** { fitness, solution, feasible, d }: la aptitud con el tratamiento elegido y el punto que se evalúa. */
  function evaluate(inst, x, variant, opts) {
    const id = inst.fn;
    const d = Fn.outside(id, x);
    const lambda = opts && opts.lambda != null ? opts.lambda : LAMBDA.def;
    if (variant === 'penalty') return { fitness: Fn.evalAt(id, x) + lambda * d, solution: x.slice(), feasible: d === 0, d, penalty: lambda * d };
    const sol = variant === 'reflect' ? Fn.reflectPoint(id, x) : Fn.clampPoint(id, x);
    return { fitness: Fn.evalAt(id, sol), solution: sol, feasible: d === 0, d, penalty: 0 };
  }

  function run(inst, x, opts) {
    const err = validate(inst, x);
    if (err) throw new Error(err);
    const o = opts || {};
    const variant = VARIANTS.indexOf(o.variant) !== -1 ? o.variant : 'clamp';
    const lambda = o.lambda != null ? o.lambda : LAMBDA.def;
    const id = inst.fn;
    const F = Fn.fnOf(id);
    const fx = Fn.evalAt(id, x);
    const stats = { optimum: F.fmin, minima: F.minima, a: F.a, b: F.b };
    const steps = [];
    const st = { revealed: 0, formula: null, showMinima: false, result: null, treated: null };
    function snap(type, stage, key, params, extra) {
      steps.push(Object.assign({
        type, stage, text: { key, params: params || {} },
        genes: x.slice(), revealed: st.revealed, formula: st.formula, showMinima: st.showMinima,
        result: st.result, treated: st.treated, focus: [],
      }, extra || {}));
    }
    const Fid = cap(id);
    const box = { a: F.a, b: F.b };

    // 1 · Problema
    snap('problem', 1, `problem${Fid}`, box);
    // 2 · Formalización
    st.formula = 'vars';
    snap('formVars', 2, 'formVars', box);
    st.formula = 'obj';
    snap('formObj', 2, `formObj${Fid}`, {});
    st.formula = 'cons';
    snap('formCons', 2, 'formCons', box);
    st.formula = 'space';
    st.showMinima = true;
    snap('formSpace', 2, `formSpace${Fid}`, box);
    st.formula = null;
    st.showMinima = false;
    // 3 · Codificación
    snap('encode', 3, 'encode', { x1: x[0], x2: x[1] });
    // 4 · Exploración: decodificación gen a gen
    snap('decodeIntro', 4, 'decodeIntro', {});
    for (let i = 0; i < 2; i++) {
      st.revealed = i + 1;
      snap('decodeGene', 4, i === 0 ? 'decodeGene1' : 'decodeGene2', { x: x[i] }, { focus: [i] });
    }
    const inside = Fn.inBox(id, x);
    st.showMinima = true;
    snap('decodeDone', 4, inside ? 'decodeDone' : 'decodeDoneOut', { x1: x[0], x2: x[1], fx, opt: F.fmin });
    // 5 · Validez
    const ev = evaluate(inst, x, variant, { lambda });
    const result = { fitness: ev.fitness, solution: ev.solution, feasible: inside, point: x.slice() };
    if (inside) {
      st.result = result;
      snap('validIn', 5, 'validIn', Object.assign({ fx }, box));
      snap('localityReal', 5, 'localityReal', {});
    } else {
      const out = [0, 1].filter((i) => x[i] < F.a || x[i] > F.b);
      snap('validOut', 5, out.length === 2 ? 'validOutBoth' : (out[0] === 0 ? 'validOut1' : 'validOut2'),
        Object.assign({ d: ev.d }, box), { focus: out });
      st.result = result;
      if (variant === 'penalty') {
        snap('penalty', 5, 'penalty', { fx, lambda, d: ev.d, pen: ev.penalty, fit: ev.fitness }, { focus: out });
      } else {
        st.treated = { kind: variant, point: ev.solution };
        snap(variant, 5, variant, { x1: x[0], x2: x[1], c1: ev.solution[0], c2: ev.solution[1], fx, fc: ev.fitness }, { focus: out });
      }
    }
    return { steps, result, stats, draws: [] };
  }

  const api = {
    VARIANTS, LAMBDA, LIMITS: Fn.LIMITS, validate, run, evaluate,
    randomInstance: () => ({ fn: 'himmelblau' }),
    randomChromosome: (seed, id) => Fn.randomPoint(id || 'himmelblau', seed),
  };
  if (isNode) module.exports = api;
  else {
    const G = (root.GAX = root.GAX || {});
    (G.problems = G.problems || {})['function-real'] = api;
  }
})(typeof self !== 'undefined' ? self : this);
