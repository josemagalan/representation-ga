/*
 * Problema del viajante (TSP) con representación permutacional (representación de camino).
 *
 * Instancia: n ciudades en el plano [0, 100] × [0, 100]; distancia euclídea redondeada a décimas
 * (como TSPLIB redondea a enteros): cada tramo, cada suma y el óptimo son exactos con los números
 * que se muestran. Internamente se suma en décimas enteras para no acumular errores de coma flotante.
 * Cromosoma: x = (x₁, …, xₙ), la ciudad que se visita en cada lugar. Si es una permutación de
 * 1…n, describe un circuito válido; si repite ciudades (lo que dejan un cruce o una mutación
 * pensados para otra representación), no lo es y se repara: recorriendo el cromosoma, cada ciudad
 * que aparece por segunda vez se cambia por la menor de las que faltan.
 * Redundancia: cada circuito lo describen 2n permutaciones (n puntos de partida × 2 sentidos).
 * Óptimo exacto con Held y Karp (1962), O(n² 2ⁿ), para n ≤ 10.
 *
 * run(instance, x) devuelve { steps, result, stats } con la traza de las cinco etapas.
 * Funciona tanto en el navegador (window.GAX.problems['tsp-perm']) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../rng.js') : root.GAX.rng;
  const Cities = isNode ? require('../cities.js') : root.GAX.cities;

  const LIMITS = { nMin: 5, nMax: 10 };
  const VARIANTS = ['path'];

  // ---------- Instancias y cromosomas ----------

  function randomInstance(seed, n) {
    const c = Cities.randomCities(seed, n);
    return { coords: Array.from({ length: n }, (_, i) => c[i + 1]) };
  }

  function randomChromosome(seed, n) {
    const r = R.mulberry32((Math.imul(R.seedState(seed), 2246822519) ^ 0x27d4eb2f) >>> 0);
    return R.randomPermutation(r, n);
  }

  /** Cromosoma no válido de ejemplo: una permutación en la que una ciudad se copia sobre otra. */
  function brokenChromosome(seed, n) {
    const r = R.mulberry32((Math.imul(R.seedState(seed), 3266489917) ^ 0x165667b1) >>> 0);
    const x = R.randomPermutation(r, n);
    // La copia no va al lado del original, para que el tramo a la ciudad repetida se vea en el mapa
    const a = R.randInt(r, 0, n - 1);
    const far = Array.from({ length: n }, (_, i) => i).filter((i) => Math.min(Math.abs(i - a), n - Math.abs(i - a)) > 1);
    x[far[R.randInt(r, 0, far.length - 1)]] = x[a];
    return x;
  }

  /** Clave de error de i18n, o null. Se admiten cromosomas con ciudades repetidas (no válidos). */
  function validate(inst, x) {
    const n = inst.coords.length;
    if (n < LIMITS.nMin || n > LIMITS.nMax) return 'errCitiesCount';
    if (!inst.coords.every((p) => Array.isArray(p) && p.length === 2 && p.every((v) => Number.isFinite(v) && v >= 0 && v <= 100))) return 'errCoords';
    if (x) {
      if (x.length !== n) return 'errTourLength';
      if (!x.every((g) => Number.isInteger(g) && g >= 1 && g <= n)) return 'errTourGenes';
    }
    return null;
  }

  // ---------- Evaluación ----------

  /** Distancia entre las ciudades a y b, en décimas enteras (euclídea × 10, redondeada). */
  const distTenths = (inst, a, b) => {
    const p = inst.coords[a - 1];
    const q = inst.coords[b - 1];
    return Math.round(Math.hypot(p[0] - q[0], p[1] - q[1]) * 10);
  };
  /** Distancia euclídea redondeada a décimas. */
  const dist = (inst, a, b) => distTenths(inst, a, b) / 10;

  function tourLength(inst, x) {
    let s = 0;
    for (let k = 0; k < x.length; k++) s += distTenths(inst, x[k], x[(k + 1) % x.length]);
    return s / 10;
  }

  function analyze(x) {
    const n = x.length;
    const count = Array(n + 1).fill(0);
    x.forEach((g) => { count[g]++; });
    const repeated = [];
    const missing = [];
    for (let c = 1; c <= n; c++) {
      if (count[c] > 1) repeated.push(c);
      if (count[c] === 0) missing.push(c);
    }
    return { valid: repeated.length === 0, repeated, missing };
  }

  function repair(x) {
    const n = x.length;
    const missing = analyze(x).missing.slice();
    const seen = new Set();
    const tour = x.slice();
    const fixes = [];
    for (let k = 0; k < n; k++) {
      if (seen.has(tour[k])) {
        const nw = missing.shift();
        fixes.push({ pos: k, old: tour[k], nw });
        tour[k] = nw;
      }
      seen.add(tour[k]);
    }
    return { tour, fixes };
  }

  /** Los 2n cromosomas que describen el mismo circuito: las n rotaciones y las n del sentido contrario. */
  function equivalents(tour) {
    const n = tour.length;
    const rev = tour.slice().reverse();
    const rot = (a, k) => a.slice(k).concat(a.slice(0, k));
    return Array.from({ length: n }, (_, k) => rot(tour, k)).concat(Array.from({ length: n }, (_, k) => rot(rev, k)));
  }

  /** Óptimo exacto (Held y Karp, 1962): { length, tour } con el circuito empezando en la ciudad 1. */
  function optimum(inst) {
    const n = inst.coords.length;
    const full = 1 << (n - 1);   // subconjuntos de las ciudades 2…n (bit j ↔ ciudad j + 2)
    const D = (a, b) => distTenths(inst, a + 1, b + 1);   // en décimas enteras: sumas exactas
    const cost = new Float64Array(full * n).fill(Infinity);
    const prev = new Int8Array(full * n).fill(-1);
    for (let j = 1; j < n; j++) cost[(1 << (j - 1)) * n + j] = D(0, j);
    for (let S = 1; S < full; S++) {
      for (let j = 1; j < n; j++) {
        if (!(S & (1 << (j - 1)))) continue;
        const c = cost[S * n + j];
        if (c === Infinity) continue;
        for (let k = 1; k < n; k++) {
          if (S & (1 << (k - 1))) continue;
          const T = S | (1 << (k - 1));
          const v = c + D(j, k);
          if (v < cost[T * n + k]) { cost[T * n + k] = v; prev[T * n + k] = j; }
        }
      }
    }
    let best = Infinity;
    let last = -1;
    for (let j = 1; j < n; j++) {
      const v = cost[(full - 1) * n + j] + D(j, 0);
      if (v < best) { best = v; last = j; }
    }
    const tour = [];
    let S = full - 1;
    let j = last;
    while (j > 0) {
      tour.push(j + 1);
      const p = prev[S * n + j];
      S &= ~(1 << (j - 1));
      j = p;
    }
    tour.push(1);
    tour.reverse();
    return { length: best / 10, tour };
  }

  const factorial = (k) => (k <= 1 ? 1 : k * factorial(k - 1));
  const round1 = (v) => Math.round(v * 10) / 10;

  // ---------- Traza paso a paso ----------

  function run(inst, x) {
    const err = validate(inst, x);
    if (err) throw new Error(err);
    const n = x.length;
    const opt = optimum(inst);
    const stats = { permutations: factorial(n), tours: factorial(n - 1) / 2, optimum: opt.length, optimalTour: opt.tour };
    const info = analyze(x);
    const steps = [];
    const st = { genes: x.slice(), revealed: 0, closed: false, changed: [], formula: null, showOpt: false, result: null, equivalents: false };
    let len = 0;
    let lenT = 0;   // longitud acumulada en décimas enteras; len = lenT / 10
    function snap(type, stage, key, params, extra) {
      steps.push(Object.assign({
        type, stage, text: { key, params: params || {} },
        genes: st.genes.slice(), revealed: st.revealed, closed: st.closed, changed: st.changed.slice(),
        formula: st.formula, showOpt: st.showOpt, result: st.result, equivalents: st.equivalents, length: len, focus: [],
      }, extra || {}));
    }

    // 1 · Problema
    snap('problem', 1, 'problem', { n });
    // 2 · Formalización
    st.formula = 'vars';
    snap('formVars', 2, 'formVars', { n });
    st.formula = 'obj';
    snap('formObj', 2, 'formObj', {});
    st.formula = 'cons';
    snap('formCons', 2, 'formCons', {});
    st.formula = 'space';
    st.showOpt = true;
    snap('formSpace', 2, 'formSpace', { n, fact: stats.permutations, tours: stats.tours, twoN: 2 * n, opt: round1(opt.length) });
    st.formula = null;
    st.showOpt = false;
    // 3 · Codificación
    snap('encode', 3, 'encode', { chrom: x.join(' ') });
    // 4 · Exploración: decodificación
    snap('decodeIntro', 4, 'decodeIntro', {});
    const seen = new Set();
    for (let k = 0; k < n; k++) {
      st.revealed = k + 1;
      if (k === 0) {
        seen.add(x[0]);
        snap('decodeStart', 4, 'decodeStart', { city: x[0] }, { focus: [0] });
        continue;
      }
      const dT = distTenths(inst, x[k - 1], x[k]);
      lenT += dT;
      len = lenT / 10;
      const d = dT / 10;
      const rep = seen.has(x[k]);
      seen.add(x[k]);
      snap(rep ? 'decodeRepeat' : 'decodeGo', 4, rep ? 'decodeRepeat' : 'decodeGo',
        { k: k + 1, from: x[k - 1], to: x[k], d: round1(d), len: round1(len) }, { focus: [k] });
    }
    const dClose = distTenths(inst, x[n - 1], x[0]) / 10;
    lenT += distTenths(inst, x[n - 1], x[0]);
    len = lenT / 10;
    st.closed = true;
    snap('decodeClose', 4, 'decodeClose', { from: x[n - 1], to: x[0], d: round1(dClose), len: round1(len) }, { focus: [n - 1, 0] });

    // 5 · Validez
    let result;
    if (info.valid) {
      const gap = (len - opt.length) / opt.length;
      st.showOpt = true;
      snap('decodeDone', 4, gap < 1e-9 ? 'decodeDoneOpt' : 'decodeDone', { len: round1(len), opt: round1(opt.length), gap: Math.round(gap * 1000) / 10 });
      st.showOpt = false;
      result = { fitness: len, tour: x.slice(), valid: true };
      st.result = result;
      snap('validPerm', 5, 'validPerm', { len: round1(len) });
      st.equivalents = true;
      snap('redundancy', 5, 'redundancy', { twoN: 2 * n, n });
    } else {
      snap('invalidPerm', 5, 'invalidPerm', { rep: info.repeated.join(', '), miss: info.missing.join(', ') });
      snap('repairIntro', 5, 'repairIntro', {});
      const rp = repair(x);
      rp.fixes.forEach((f) => {
        st.genes[f.pos] = f.nw;
        st.changed.push(f.pos);
        snap('repairFix', 5, 'repairFix', { pos: f.pos + 1, old: f.old, nw: f.nw }, { focus: [f.pos] });
      });
      len = tourLength(inst, rp.tour);
      result = { fitness: len, tour: rp.tour, valid: false, fixes: rp.fixes };
      st.result = result;
      st.equivalents = true;
      snap('repairDone', 5, 'repairDone', { chrom: rp.tour.join(' '), len: round1(len) });
    }
    return { steps, result, stats, draws: [] };
  }

  const api = {
    LIMITS, VARIANTS, randomInstance, randomChromosome, brokenChromosome, validate,
    dist, distTenths, tourLength, analyze, repair, equivalents, optimum, run,
    evaluate: (inst, x) => { const rp = repair(x); return { fitness: tourLength(inst, rp.tour), solution: rp.tour }; },
  };
  if (isNode) module.exports = api;
  else {
    const G = (root.GAX = root.GAX || {});
    (G.problems = G.problems || {})['tsp-perm'] = api;
  }
})(typeof self !== 'undefined' ? self : this);
