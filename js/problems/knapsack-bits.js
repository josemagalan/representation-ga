/*
 * Mochila 0/1 con representación binaria.
 *
 * Instancia: n objetos con peso w[i] y valor v[i] enteros, y una capacidad W.
 * Cromosoma: x[i] ∈ {0, 1}; 1 = el objeto i entra en la mochila.
 * Tratamientos de la infactibilidad (variantes):
 *   penalty-linear      aptitud = valor − λ · e,      e = máx(0, peso − W)
 *   penalty-quadratic   aptitud = valor − (λ · e)²    (como Michalewicz, 1996)
 *   repair-greedy       se sacan objetos, el de menor v/w primero (empates: el de menor índice)
 *   repair-random       se sacan objetos al azar: r en [0, 1), se saca el ⌊r · k⌋-ésimo de los k que
 *                       hay dentro, contando desde 0 en el orden de los genes
 *   decoder             se recorren los genes en orden y cada 1 mete su objeto solo si cabe
 *
 * run(instance, x, opts) devuelve { steps, result, draws, stats }:
 *   cada paso lleva el tipo, la etapa (1 problema · 2 formalización · 3 codificación ·
 *   4 exploración · 5 validez), la narración { key, params } y el estado que dibuja la vista.
 * Los números aleatorios se sortean redondeados hacia abajo a centésimas, para que la narración
 * muestre exactamente el número usado; son reproducibles (opts.seed) o se pueden fijar (opts.draws).
 * Funciona tanto en el navegador (window.GAX.problems['knapsack-bits']) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../rng.js') : root.GAX.rng;

  const LIMITS = { nMin: 5, nMax: 12, wMax: 9, vMax: 9, manualMax: 99 };
  const VARIANTS = ['penalty-linear', 'penalty-quadratic', 'repair-greedy', 'repair-random', 'decoder'];
  const PENALTIES = ['penalty-linear', 'penalty-quadratic'];
  const LAMBDA = { min: 0, max: 5, step: 0.1, def: 1 };

  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const round2 = (x) => Math.round(x * 100) / 100;
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const pow2 = (n) => `2${String(n).split('').map((d) => SUP[d]).join('')}`;

  // ---------- Instancias y cromosomas ----------

  const defaultCapacity = (weights) => Math.max(1, Math.floor(sum(weights) / 2));

  function randomInstance(seed, n) {
    const r = R.mulberry32(R.seedState(seed));
    const weights = [];
    const values = [];
    for (let i = 0; i < n; i++) {
      weights.push(R.randInt(r, 1, LIMITS.wMax));
      values.push(R.randInt(r, 1, LIMITS.vMax));
    }
    return { weights, values, capacity: defaultCapacity(weights) };
  }

  /** Cromosoma aleatorio (cada bit, 0 o 1 con probabilidad 1/2), de un flujo distinto al de la instancia. */
  function randomChromosome(seed, n) {
    const r = R.mulberry32((Math.imul(R.seedState(seed), 2654435761) ^ 0x5bd1e995) >>> 0);
    return Array.from({ length: n }, () => (r() < 0.5 ? 0 : 1));
  }

  /** Clave de error de i18n, o null si la instancia y el cromosoma son válidos. */
  function validate(inst, x) {
    const n = inst.weights.length;
    if (n < LIMITS.nMin || n > LIMITS.nMax) return 'errItemsCount';
    if (inst.values.length !== n) return 'errValuesCount';
    const okInt = (v) => Number.isInteger(v) && v >= 1 && v <= LIMITS.manualMax;
    if (!inst.weights.every(okInt) || !inst.values.every(okInt)) return 'errItemNumbers';
    if (!(Number.isInteger(inst.capacity) && inst.capacity >= 1 && inst.capacity <= sum(inst.weights))) return 'errCapacity';
    if (x) {
      if (x.length !== n) return 'errChromosomeLength';
      if (!x.every((b) => b === 0 || b === 1)) return 'errChromosomeBits';
    }
    return null;
  }

  // ---------- Decodificación, evaluación y tratamientos ----------

  const weightOf = (inst, s) => s.reduce((acc, b, i) => acc + b * inst.weights[i], 0);
  const valueOf = (inst, s) => s.reduce((acc, b, i) => acc + b * inst.values[i], 0);
  const feasible = (inst, s) => weightOf(inst, s) <= inst.capacity;
  const rho = (inst) => Math.max(...inst.values.map((v, i) => v / inst.weights[i]));

  /** ¿Tiene i peor relación valor/peso que j? (comparación exacta, sin divisiones) */
  const worseRatio = (inst, i, j) => inst.values[i] * inst.weights[j] < inst.values[j] * inst.weights[i];

  function worstInside(inst, s) {
    let best = -1;
    s.forEach((b, i) => { if (b && (best < 0 || worseRatio(inst, i, best))) best = i; });
    return best;
  }

  function penaltyFitness(inst, s, variant, lambda) {
    const e = Math.max(0, weightOf(inst, s) - inst.capacity);
    const pen = variant === 'penalty-quadratic' ? Math.pow(lambda * e, 2) : lambda * e;
    return { excess: e, penalty: pen, fitness: valueOf(inst, s) - pen };
  }

  function repairGreedy(inst, x) {
    const s = x.slice();
    const removed = [];
    while (weightOf(inst, s) > inst.capacity) {
      const j = worstInside(inst, s);
      s[j] = 0;
      removed.push(j);
    }
    return { solution: s, removed };
  }

  function repairRandom(inst, x, next) {
    const s = x.slice();
    const removed = [];
    while (weightOf(inst, s) > inst.capacity) {
      const inside = s.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
      const r = next();
      const pick = Math.floor(r * inside.length);
      const j = inside[pick];
      s[j] = 0;
      removed.push({ item: j, r, k: inside.length, pick, inside });
    }
    return { solution: s, removed };
  }

  function decoderDecode(inst, x) {
    const s = Array(x.length).fill(0);
    const skipped = [];
    let w = 0;
    x.forEach((b, i) => {
      if (!b) return;
      if (w + inst.weights[i] <= inst.capacity) { s[i] = 1; w += inst.weights[i]; } else skipped.push(i);
    });
    return { solution: s, skipped };
  }

  /** Fuente de números aleatorios: dados (opts.draws) o con semilla, redondeados a centésimas. */
  function drawSource(opts) {
    const given = Array.isArray(opts.draws) ? opts.draws : null;
    const rand = R.mulberry32(R.seedState(opts.seed));
    const used = [];
    let k = 0;
    function next() {
      let v;
      if (given) {
        if (k >= given.length) throw new Error('errDraws');
        v = given[k++];
      } else v = Math.floor(rand() * 100) / 100;
      used.push(v);
      return v;
    }
    return { next, used };
  }

  /** Aptitud con un tratamiento dado: { fitness, solution, weight, value, ... } */
  function evaluate(inst, x, variant, opts) {
    opts = opts || {};
    if (variant === 'decoder') {
      const d = decoderDecode(inst, x);
      return Object.assign({ fitness: valueOf(inst, d.solution), weight: weightOf(inst, d.solution), value: valueOf(inst, d.solution) }, d);
    }
    const w = weightOf(inst, x);
    const v = valueOf(inst, x);
    if (w <= inst.capacity) return { fitness: v, solution: x.slice(), weight: w, value: v, excess: 0 };
    if (PENALTIES.indexOf(variant) !== -1) {
      const lambda = opts.lambda == null ? LAMBDA.def : opts.lambda;
      return Object.assign({ solution: x.slice(), weight: w, value: v }, penaltyFitness(inst, x, variant, lambda));
    }
    const rep = variant === 'repair-random' ? repairRandom(inst, x, (opts.source || drawSource(opts)).next) : repairGreedy(inst, x);
    const value = valueOf(inst, rep.solution);
    return Object.assign({ fitness: value, weight: weightOf(inst, rep.solution), value }, rep);
  }

  /** Recorrido exhaustivo de los 2ⁿ cromosomas (n ≤ 12): factibles, óptimo y preimágenes del decodificador. */
  function enumerate(inst) {
    const n = inst.weights.length;
    const total = 1 << n;
    let feasibleCount = 0;
    let optimum = -Infinity;
    for (let m = 0; m < total; m++) {
      let w = 0;
      let v = 0;
      for (let i = 0; i < n; i++) if (m & (1 << i)) { w += inst.weights[i]; v += inst.values[i]; }
      if (w <= inst.capacity) {
        feasibleCount++;
        if (v > optimum) optimum = v;
      }
    }
    return { total, feasible: feasibleCount, optimum };
  }

  /** Cuántos cromosomas da el decodificador como esta misma solución (redundancia). */
  function decoderPreimages(inst, solution) {
    const n = inst.weights.length;
    const key = solution.join('');
    let count = 0;
    for (let m = 0; m < (1 << n); m++) {
      const x = Array.from({ length: n }, (_, i) => ((m >> i) & 1));
      if (decoderDecode(inst, x).solution.join('') === key) count++;
    }
    return count;
  }

  // ---------- Traza paso a paso ----------

  function run(inst, x, opts) {
    opts = opts || {};
    const err = validate(inst, x);
    if (err) throw new Error(err);
    const variant = VARIANTS.indexOf(opts.variant) !== -1 ? opts.variant : VARIANTS[0];
    const lambda = opts.lambda == null ? LAMBDA.def : opts.lambda;
    const n = x.length;
    const W = inst.capacity;
    const S = sum(inst.weights);
    const stats = enumerate(inst);
    const chrom = x.join('');
    const D = drawSource(opts);
    const steps = [];

    // Estado de la vista que se va construyendo
    const st = { revealed: 0, bag: [], removed: [], skipped: [], changed: [], current: x.slice(), formula: null, result: null };
    const bagWeight = () => sum(st.bag.map((i) => inst.weights[i]));
    const bagValue = () => sum(st.bag.map((i) => inst.values[i]));
    function snap(type, stage, key, params, extra) {
      steps.push(Object.assign({
        type, stage, text: { key, params: params || {} },
        revealed: st.revealed, bag: st.bag.slice(), removed: st.removed.slice(), skipped: st.skipped.slice(),
        changed: st.changed.slice(), genes: st.current.slice(), formula: st.formula,
        weight: bagWeight(), value: bagValue(), result: st.result, focus: [],
      }, extra || {}));
    }

    // 1 · Problema
    snap('problem', 1, S <= W ? 'problemAllFit' : 'problem', { n, W, S });

    // 2 · Formalización
    st.formula = 'vars';
    snap('formVars', 2, 'formVars', { n });
    st.formula = 'obj';
    snap('formObj', 2, 'formObj', {});
    st.formula = 'cons';
    snap('formCons', 2, 'formCons', { W });
    st.formula = 'space';
    const pct = stats.feasible / stats.total;
    snap('formSpace', 2, 'formSpace', { total: stats.total, pow: pow2(n), feasible: stats.feasible, pct: Math.round(pct * 1000) / 10, opt: stats.optimum });
    st.formula = null;

    // 3 · Codificación
    snap('encode', 3, 'encode', { n, chrom });

    // 4 · Exploración: decodificación gen a gen
    const isDecoder = variant === 'decoder';
    snap('decodeIntro', 4, isDecoder ? 'decodeIntroDecoder' : 'decodeIntro', {});
    for (let i = 0; i < n; i++) {
      st.revealed = i + 1;
      const pos = i + 1;
      const wi = inst.weights[i];
      const vi = inst.values[i];
      if (!x[i]) { snap('decodeOut', 4, 'decodeOut', { pos }, { focus: [i] }); continue; }
      if (isDecoder && bagWeight() + wi > W) {
        st.skipped.push(i);
        snap('decodeSkip', 4, 'decodeSkip', { pos, w: wi, weight: bagWeight(), W }, { focus: [i] });
        continue;
      }
      st.bag.push(i);
      const over = bagWeight() > W;
      snap('decodeIn', 4, over ? 'decodeInOver' : 'decodeIn', { pos, w: wi, v: vi, weight: bagWeight(), value: bagValue(), W }, { focus: [i] });
    }
    const weight = bagWeight();
    const value = bagValue();
    snap('decodeDone', 4, weight <= W ? 'decodeDoneOk' : 'decodeDoneOver', { weight, value, W });

    // 5 · Validez
    let result;
    if (weight <= W) {
      result = { fitness: value, weight, value, solution: st.bag.reduce((s, i) => { s[i] = 1; return s; }, Array(n).fill(0)), feasible: true };
      if (isDecoder) {
        result.preimages = decoderPreimages(inst, result.solution);
        st.result = result;
        snap('feasible', 5, st.skipped.length ? 'feasibleDecoderSkipped' : 'feasibleDecoder', { value, skipped: st.skipped.length });
        snap('decoderRedundancy', 5, result.preimages === 1 ? 'decoderRedundancyOne' : 'decoderRedundancy', { count: result.preimages, sol: result.solution.join('') });
      } else {
        st.result = result;
        snap('feasible', 5, 'feasible', { value, weight, W });
      }
    } else {
      const e = weight - W;
      snap('infeasible', 5, 'infeasible', { weight, W, e });
      if (PENALTIES.indexOf(variant) !== -1) {
        const p = penaltyFitness(inst, x, variant, lambda);
        result = { fitness: p.fitness, weight, value, excess: e, penalty: p.penalty, solution: x.slice(), feasible: false };
        st.result = result;
        snap('penalty', 5, variant === 'penalty-quadratic' ? 'penaltyQuadratic' : 'penaltyLinear',
          { value, lambda, e, pen: round2(p.penalty), fitness: round2(p.fitness) });
        const beats = p.fitness > stats.optimum;
        snap('penaltyCompare', 5, beats ? 'penaltyBeats' : 'penaltyBelow', { fitness: round2(p.fitness), opt: stats.optimum });
      } else {
        const greedy = variant === 'repair-greedy';
        snap('repairIntro', 5, greedy ? 'repairIntroGreedy' : 'repairIntroRandom', { e });
        const rep = greedy ? repairGreedy(inst, x) : repairRandom(inst, x, D.next);
        rep.removed.forEach((rm) => {
          const j = greedy ? rm : rm.item;
          st.bag = st.bag.filter((i) => i !== j);
          st.removed.push(j);
          st.changed.push(j);
          st.current[j] = 0;
          const base = { item: j + 1, w: inst.weights[j], v: inst.values[j], weight: bagWeight(), W };
          if (greedy) {
            snap('repairRemove', 5, bagWeight() > W ? 'repairRemoveGreedyMore' : 'repairRemoveGreedy',
              Object.assign(base, { ratio: round2(inst.values[j] / inst.weights[j]) }), { focus: [j] });
          } else {
            snap('repairRemove', 5, bagWeight() > W ? 'repairRemoveRandomMore' : 'repairRemoveRandom',
              Object.assign(base, { r: rm.r, k: rm.k, pick: rm.pick, list: rm.inside.map((i) => i + 1).join(', ') }), { focus: [j], draw: rm.r });
          }
        });
        const repValue = valueOf(inst, rep.solution);
        result = { fitness: repValue, weight: weightOf(inst, rep.solution), value: repValue, solution: rep.solution, removed: rep.removed, feasible: true };
        st.result = result;
        snap('repairDone', 5, 'repairDone', { chrom: rep.solution.join(''), weight: result.weight, value: repValue, W, k: rep.removed.length });
      }
    }
    return { steps, result, draws: D.used.slice(), stats, variant, lambda };
  }

  const spec = {
    id: 'knapsack-bits',
    variants: VARIANTS,
    penalties: PENALTIES,
    lambda: LAMBDA,
    limits: LIMITS,
    stages: [1, 2, 3, 4, 5],
    run,
  };

  const api = {
    spec, LIMITS, VARIANTS, LAMBDA, randomInstance, randomChromosome, defaultCapacity, validate,
    weightOf, valueOf, feasible, rho, penaltyFitness, repairGreedy, repairRandom, decoderDecode,
    evaluate, enumerate, decoderPreimages, drawSource, run,
  };
  if (isNode) module.exports = api;
  else {
    const G = (root.GAX = root.GAX || {});
    (G.problems = G.problems || {})['knapsack-bits'] = api;
  }
})(typeof self !== 'undefined' ? self : this);
