/*
 * Núcleo común de la optimización de una función continua de dos variables, que comparten las
 * codificaciones real y binaria (estándar o Gray).
 *
 * Funciones (a minimizar, mínimo global 0):
 *   himmelblau  f(x, y) = (x² + y − 11)² + (x + y² − 7)²             en [−5, 5]², cuatro mínimos globales
 *   rastrigin   f(x, y) = 20 + (x² − 10 cos 2πx) + (y² − 10 cos 2πy)  en [−5,12, 5,12]², mínimo en el origen
 * Binaria: k bits por variable, el primero el más significativo; z = Σ bⱼ 2ᵏ⁻¹⁻ʲ y x = a + z (b − a)/(2ᵏ − 1).
 * Gray reflejado: g₁ = b₁, gⱼ = bⱼ₋₁ ⊕ bⱼ; y al revés, b₁ = g₁, bⱼ = bⱼ₋₁ ⊕ gⱼ.
 * Reales: genes redondeados a centésimas; acotar y reflejar se calculan en centésimas enteras (exacto).
 *
 * Funciona tanto en el navegador (window.GAX.func) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rng.js') : root.GAX.rng;

  const FUNCTIONS = {
    himmelblau: {
      id: 'himmelblau', a: -5, b: 5, fmin: 0,
      f: (x, y) => (x * x + y - 11) * (x * x + y - 11) + (x + y * y - 7) * (x + y * y - 7),
      minima: [[3, 2], [-2.805118, 3.131312], [-3.77931, -3.283186], [3.584428, -1.848126]],
    },
    rastrigin: {
      id: 'rastrigin', a: -5.12, b: 5.12, fmin: 0,
      f: (x, y) => 20 + (x * x - 10 * Math.cos(2 * Math.PI * x)) + (y * y - 10 * Math.cos(2 * Math.PI * y)),
      minima: [[0, 0]],
    },
  };
  const FN_IDS = Object.keys(FUNCTIONS);
  const LIMITS = { kMin: 2, kMax: 12, kDef: 5, realMax: 50, margin: 0.2 };

  const fnOf = (id) => FUNCTIONS[id] || FUNCTIONS.himmelblau;
  const evalAt = (id, p) => fnOf(id).f(p[0], p[1]);
  const round2 = (v) => Math.round(v * 100) / 100 + 0;   // + 0: sin −0
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const power = (base, exp) => `${base}${String(exp).split('').map((d) => SUP[d]).join('')}`;

  // ---------- Binaria y Gray ----------

  const toGray = (bits) => bits.map((b, j) => (j === 0 ? b : bits[j - 1] ^ b));
  function fromGray(g) {
    const out = [];
    g.forEach((v, j) => out.push(j === 0 ? v : out[j - 1] ^ v));
    return out;
  }
  const bitsToInt = (bits) => bits.reduce((z, b) => z * 2 + b, 0);
  const intToBits = (z, k) => Array.from({ length: k }, (_, j) => Math.floor(z / Math.pow(2, k - 1 - j)) % 2);
  const levels = (k) => Math.pow(2, k) - 1;
  const delta = (id, k) => (fnOf(id).b - fnOf(id).a) / levels(k);
  /** x = a + z (b − a)/(2ᵏ − 1), en este orden de operaciones (el mismo que el código descargable). */
  const scale = (id, z, k) => fnOf(id).a + z * (fnOf(id).b - fnOf(id).a) / levels(k);
  const codeOf = (z, k, code) => (code === 'gray' ? toGray(intToBits(z, k)) : intToBits(z, k));

  /** Decodifica una variable: { bin, z, x } a partir de sus k bits. */
  function decodeVar(id, bits, code) {
    const bin = code === 'gray' ? fromGray(bits) : bits.slice();
    const z = bitsToInt(bin);
    return { bin, z, x: scale(id, z, bits.length) };
  }

  /** Decodifica el cromosoma completo (2k bits). */
  function decodeBits(id, chrom, k, code) {
    const v = [decodeVar(id, chrom.slice(0, k), code), decodeVar(id, chrom.slice(k, 2 * k), code)];
    return { vars: v, point: [v[0].x, v[1].x], z: [v[0].z, v[1].z] };
  }

  /** Índice de la rejilla más cercano a x (acotado a 0…2ᵏ − 1). */
  function nearestIndex(id, x, k) {
    const F = fnOf(id);
    const z = Math.round(((x - F.a) / (F.b - F.a)) * levels(k));
    return Math.max(0, Math.min(levels(k), z));
  }
  /** Cromosoma del punto representable más cercano a p. */
  const encodePoint = (id, p, k, code) => codeOf(nearestIndex(id, p[0], k), k, code).concat(codeOf(nearestIndex(id, p[1], k), k, code));

  /** Bits que hay que cambiar para pasar de z a z + 1 (o a z − 1). */
  const hamming = (u, v) => u.reduce((s, b, j) => s + (b !== v[j] ? 1 : 0), 0);
  const stepBits = (z, z2, k, code) => hamming(codeOf(z, k, code), codeOf(z2, k, code));

  /** Los 2k cromosomas a distancia de Hamming 1 y el punto al que decodifica cada uno. */
  function hammingNeighbours(id, chrom, k, code) {
    return chrom.map((_, j) => {
      const c = chrom.slice();
      c[j] = 1 - c[j];
      return { bit: j, point: decodeBits(id, c, k, code).point };
    });
  }

  // ---------- Mejor punto representable ----------

  const bestCache = {};
  /**
   * { f, z: [z₁, z₂], point }: el mejor punto de la rejilla de 2ᵏ × 2ᵏ (el primero en orden de z₁, z₂).
   * Enumeración completa hasta k = 8; con más bits, ventana de ±4 posiciones alrededor de cada
   * mínimo global (Δ < 0,05: el mejor punto está pegado a un mínimo global).
   */
  function bestRepresentable(id, k) {
    const key = `${id}:${k}`;
    if (bestCache[key]) return bestCache[key];
    const F = fnOf(id);
    const N = levels(k);
    const xs = Array.from({ length: N + 1 }, (_, z) => scale(id, z, k));
    let best = { f: Infinity, z: null };
    const consider = (z1, z2) => {
      const v = F.f(xs[z1], xs[z2]);
      if (v < best.f || (v === best.f && (z1 < best.z[0] || (z1 === best.z[0] && z2 < best.z[1])))) best = { f: v, z: [z1, z2] };
    };
    if (k <= 8) {
      for (let z1 = 0; z1 <= N; z1++) for (let z2 = 0; z2 <= N; z2++) consider(z1, z2);
    } else {
      const W = 4;
      F.minima.forEach(([m1, m2]) => {
        const c1 = nearestIndex(id, m1, k);
        const c2 = nearestIndex(id, m2, k);
        for (let z1 = Math.max(0, c1 - W); z1 <= Math.min(N, c1 + W); z1++) {
          for (let z2 = Math.max(0, c2 - W); z2 <= Math.min(N, c2 + W); z2++) consider(z1, z2);
        }
      });
    }
    best.point = [xs[best.z[0]], xs[best.z[1]]];
    bestCache[key] = best;
    return best;
  }

  // ---------- Reales: límites de la caja ----------

  const inBox = (id, p) => p.every((v) => v >= fnOf(id).a && v <= fnOf(id).b);
  /** Distancia total a la caja: d = Σᵢ máx(0, a − xᵢ, xᵢ − b). */
  const outside = (id, p) => p.reduce((s, v) => s + Math.max(0, fnOf(id).a - v, v - fnOf(id).b), 0);
  const cents = (v) => Math.round(v * 100);
  /** Acotar: cada gen fuera se lleva al límite más cercano. */
  const clampPoint = (id, p) => p.map((v) => Math.min(cents(fnOf(id).b), Math.max(cents(fnOf(id).a), cents(v))) / 100);
  /** Reflejar: el gen se refleja en el límite que ha cruzado, tantas veces como haga falta. */
  function reflectPoint(id, p) {
    const A = cents(fnOf(id).a);
    const L = cents(fnOf(id).b) - A;
    return p.map((v) => {
      let y = (((cents(v) - A) % (2 * L)) + 2 * L) % (2 * L);
      if (y > L) y = 2 * L - y;
      return (A + y) / 100;
    });
  }

  /** Punto aleatorio dentro de la caja, en centésimas. */
  function randomPoint(id, seed) {
    const F = fnOf(id);
    const r = R.mulberry32((Math.imul((seed >>> 0) || 1, 2654435761) ^ 0x2545f491) >>> 0);
    return [0, 1].map(() => Math.max(F.a, Math.min(F.b, round2(F.a + r() * (F.b - F.a)))));
  }
  /** Punto aleatorio con algún gen fuera de la caja, en la franja visible del mapa. */
  function randomOutside(id, seed) {
    const F = fnOf(id);
    const L = F.b - F.a;
    const r = R.mulberry32((Math.imul((seed >>> 0) || 1, 2246822519) ^ 0x68e31da4) >>> 0);
    const p = randomPoint(id, seed);
    const which = Math.floor(r() * 3);          // 0: x₁ fuera, 1: x₂ fuera, 2: los dos
    [0, 1].forEach((i) => {
      if (which !== 2 && which !== i) return;
      const u = 0.05 + 0.9 * r();
      p[i] = r() < 0.5 ? round2(F.b + u * LIMITS.margin * L) : round2(F.a - u * LIMITS.margin * L);
    });
    return p;
  }

  function randomBits(seed, k) {
    const r = R.mulberry32((Math.imul((seed >>> 0) || 1, 3266489917) ^ 0x1b873593) >>> 0);
    return Array.from({ length: 2 * k }, () => (r() < 0.5 ? 0 : 1));
  }

  const api = {
    FUNCTIONS, FN_IDS, LIMITS, fnOf, evalAt, round2, power,
    toGray, fromGray, bitsToInt, intToBits, levels, delta, scale, codeOf, decodeVar, decodeBits,
    nearestIndex, encodePoint, hamming, stepBits, hammingNeighbours, bestRepresentable,
    inBox, outside, clampPoint, reflectPoint, randomPoint, randomOutside, randomBits,
  };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).func = api;
})(typeof self !== 'undefined' ? self : this);
