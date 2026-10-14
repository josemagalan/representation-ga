/*
 * Optimización de una función continua de dos variables con una cadena binaria (estándar o Gray).
 *
 * Instancia: { fn, k }: la función (himmelblau | rastrigin), con su caja [a, b]², y los bits por
 * variable (de 2 a 12).
 * Cromosoma: 2k bits; los k primeros codifican x₁ y los k siguientes x₂, el primero el más
 * significativo. Toda cadena decodifica a un punto de la caja, pero solo a uno de los 2ᵏ × 2ᵏ de la
 * rejilla, separados Δ = (b − a)/(2ᵏ − 1).
 * Variantes:
 *   standard   binaria estándar: z = Σ bⱼ 2ᵏ⁻¹⁻ʲ
 *   gray       código Gray reflejado: primero b₁ = g₁, bⱼ = bⱼ₋₁ ⊕ gⱼ; después, como el estándar
 *
 * run(instance, bits, opts) devuelve { steps, result, stats } con la traza de las cinco etapas.
 * Funciona tanto en el navegador (window.GAX.problems['function-bits']) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const Fn = isNode ? require('../func.js') : root.GAX.func;

  const VARIANTS = ['standard', 'gray'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** Clave de error de i18n, o null. */
  function validate(inst, bits) {
    if (!inst || Fn.FN_IDS.indexOf(inst.fn) === -1) return 'errFunction';
    if (!Number.isInteger(inst.k) || inst.k < Fn.LIMITS.kMin || inst.k > Fn.LIMITS.kMax) return 'errBitsK';
    if (bits) {
      if (!Array.isArray(bits) || bits.length !== 2 * inst.k) return 'errBitsLength';
      if (!bits.every((b) => b === 0 || b === 1)) return 'errChromosomeBits';
    }
    return null;
  }

  function evaluate(inst, bits, variant) {
    const dec = Fn.decodeBits(inst.fn, bits, inst.k, variant === 'gray' ? 'gray' : 'standard');
    return { fitness: Fn.evalAt(inst.fn, dec.point), solution: dec.point, z: dec.z };
  }

  /** «16 + 4 + 2» para los bits 1 de un número binario. */
  function terms(bin) {
    const k = bin.length;
    const t = bin.map((b, j) => (b ? String(Math.pow(2, k - 1 - j)) : null)).filter(Boolean);
    return t.length ? t.join(' + ') : '0';
  }

  /** Mayor salto de Hamming hacia un vecino de la rejilla: { i, z, z2, h }. */
  function worstCliff(z, k, code) {
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

  function run(inst, bits, opts) {
    const err = validate(inst, bits);
    if (err) throw new Error(err);
    const o = opts || {};
    const code = o.variant === 'gray' ? 'gray' : 'standard';
    const gray = code === 'gray';
    const id = inst.fn;
    const k = inst.k;
    const F = Fn.fnOf(id);
    const n = Math.pow(2, k);
    const dlt = Fn.delta(id, k);
    const best = Fn.bestRepresentable(id, k);
    const dec = Fn.decodeBits(id, bits, k, code);
    const fx = Fn.evalAt(id, dec.point);
    const stats = { optimum: F.fmin, minima: F.minima, a: F.a, b: F.b, total: n * n, delta: dlt, best };
    const steps = [];
    const st = { revealed: 0, bin: [null, null], z: [null, null], formula: null, showMinima: false, showBest: false, neighbours: null, result: null };
    function snap(type, stage, key, params, extra) {
      steps.push(Object.assign({
        type, stage, text: { key, params: params || {} },
        genes: bits.slice(), code, k, revealed: st.revealed, bin: st.bin.slice(), z: st.z.slice(),
        formula: st.formula, showMinima: st.showMinima, showBest: st.showBest, neighbours: st.neighbours,
        result: st.result, focus: [], cliff: null,
      }, extra || {}));
    }
    const Fid = cap(id);
    const box = { a: F.a, b: F.b };
    const varBits = (i) => Array.from({ length: k }, (_, j) => i * k + j);

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
    snap('formSpace', 2, 'formSpaceBits', { k, n, pow: `${n} × ${n}`, total: n * n, delta: dlt });
    st.formula = null;
    st.showMinima = false;
    // 3 · Codificación
    snap('encode', 3, gray ? 'encodeGray' : 'encode', { k, nb: 2 * k, g1: bits.slice(0, k).join(''), g2: bits.slice(k).join('') });
    // 4 · Exploración: decodificación variable a variable
    snap('decodeIntro', 4, gray ? 'decodeIntroGray' : 'decodeIntro', { k, a: F.a, b: F.b, n1: n - 1 });
    for (let i = 0; i < 2; i++) {
      const v = dec.vars[i];
      const g = bits.slice(i * k, (i + 1) * k);
      const focus = varBits(i);
      const p = { v: i === 0 ? 'x₁' : 'x₂' };
      if (gray) {
        st.bin[i] = v.bin;
        snap('decodeGray', 4, 'decodeGray', Object.assign({ gray: g.join(''), bin: v.bin.join('') }, p), { focus, active: i });
      }
      st.bin[i] = v.bin;
      st.z[i] = v.z;
      snap('decodeInt', 4, 'decodeInt', Object.assign({ bin: v.bin.join(''), sum: terms(v.bin), z: v.z }, p), { focus, active: i });
      st.revealed = i + 1;
      snap('decodeScale', 4, 'decodeScale', Object.assign({ z: v.z, a: F.a, delta: dlt, x: v.x }, p), { focus, active: i });
    }
    st.showMinima = true;
    const isBest = dec.z[0] === best.z[0] && dec.z[1] === best.z[1];
    snap('decodeDone', 4, isBest ? 'decodeDoneBest' : 'decodeDone', { x1: dec.point[0], x2: dec.point[1], fx, best: best.f, opt: F.fmin });
    // 5 · Validez
    const result = { fitness: fx, solution: dec.point, z: dec.z, feasible: true };
    st.result = result;
    snap('validBits', 5, 'validBits', { total: n * n, nb: 2 * k, a: F.a, b: F.b });
    st.showBest = true;
    snap('precision', 5, `precision${Fid}`, { k, delta: dlt, best: best.f, bx1: best.point[0], bx2: best.point[1], half: Fn.delta(id, k + 1) });
    st.showBest = false;
    st.neighbours = Fn.hammingNeighbours(id, bits, k, code);
    const c = worstCliff(dec.z, k, code);
    const mirror = Fn.levels(k) - dec.z[0];
    snap('hamming', 5, gray ? 'hammingGray' : (c.h === 1 ? 'hammingStandardOne' : 'hammingStandard'),
      { v: c.i === 0 ? 'x₁' : 'x₂', z: c.z, z2: c.z2, h: c.h, jump: Math.pow(2, k - 1) * dlt, zm: mirror },
      { cliff: { i: c.i, z2: c.z2, target: Fn.codeOf(c.z2, k, code) }, focus: varBits(c.i) });
    return { steps, result, stats, draws: [] };
  }

  const api = {
    VARIANTS, LIMITS: Fn.LIMITS, validate, run, evaluate, terms,
    randomInstance: () => ({ fn: 'himmelblau', k: Fn.LIMITS.kDef }),
    randomChromosome: (seed, k) => Fn.randomBits(seed, k || Fn.LIMITS.kDef),
  };
  if (isNode) module.exports = api;
  else {
    const G = (root.GAX = root.GAX || {});
    (G.problems = G.problems || {})['function-bits'] = api;
  }
})(typeof self !== 'undefined' ? self : this);
