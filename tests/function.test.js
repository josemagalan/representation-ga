'use strict';
// Función continua con vector de reales y con cadena binaria (estándar o Gray): decodificación,
// código Gray, mejor punto representable, tratamientos de la caja y trazas, frente a
// implementaciones independientes.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rng.js');
const Fn = require('../js/func.js');
const RealP = require('../js/problems/function-real.js');
const BitsP = require('../js/problems/function-bits.js');

// ---------- Implementaciones independientes ----------

/** Binario natural con parseInt, sin pasar por el núcleo. */
const intRef = (bits) => parseInt(bits.join(''), 2);
/** Gray → entero con la fórmula z = g ⊕ (g >> 1) ⊕ (g >> 2) ⊕ … */
function grayIntRef(bits) {
  let g = intRef(bits);
  let z = 0;
  while (g) { z ^= g; g >>= 1; }
  return z;
}
/** Reflejar con un bucle sobre reales (sin módulo), redondeando al final. */
function reflectRef(v, a, b) {
  let x = v;
  while (x < a - 1e-9 || x > b + 1e-9) x = x < a ? 2 * a - x : 2 * b - x;
  return Math.round(x * 100) / 100;
}
const FNS = ['himmelblau', 'rastrigin'];

// ---------- Binario y Gray ----------

test('decodificación binaria y Gray frente a parseInt y a la fórmula del XOR', () => {
  const r = R.mulberry32(11);
  for (let t = 0; t < 3000; t++) {
    const k = R.randInt(r, 2, 12);
    const fn = FNS[t % 2];
    const bits = Array.from({ length: 2 * k }, () => (r() < 0.5 ? 0 : 1));
    const std = Fn.decodeBits(fn, bits, k, 'standard');
    const gry = Fn.decodeBits(fn, bits, k, 'gray');
    const F = Fn.fnOf(fn);
    [0, 1].forEach((i) => {
      const g = bits.slice(i * k, (i + 1) * k);
      assert.equal(std.z[i], intRef(g));
      assert.equal(gry.z[i], grayIntRef(g));
      assert.ok(Math.abs(std.point[i] - (F.a + (intRef(g) / (Math.pow(2, k) - 1)) * (F.b - F.a))) < 1e-12);
      assert.ok(std.point[i] >= F.a - 1e-12 && std.point[i] <= F.b + 1e-12, 'toda cadena cae en la caja');
    });
  }
});

test('Gray: es una biyección y los vecinos de la rejilla están siempre a un bit', () => {
  for (let k = 2; k <= 12; k++) {
    const seen = new Set();
    for (let z = 0; z < Math.pow(2, k); z++) {
      const g = Fn.codeOf(z, k, 'gray');
      assert.deepEqual(Fn.fromGray(g), Fn.intToBits(z, k));
      assert.deepEqual(Fn.toGray(Fn.fromGray(g)), g);
      seen.add(g.join(''));
      if (z > 0) assert.equal(Fn.stepBits(z - 1, z, k, 'gray'), 1);
    }
    assert.equal(seen.size, Math.pow(2, k));
  }
  // En binario estándar hay saltos de Hamming: de 01111 a 10000, cinco bits
  assert.equal(Fn.stepBits(15, 16, 5, 'standard'), 5);
  assert.equal(Fn.stepBits(15, 16, 5, 'gray'), 1);
});

test('el punto representable más cercano vuelve al mismo cromosoma', () => {
  const r = R.mulberry32(5);
  for (let t = 0; t < 2000; t++) {
    const k = R.randInt(r, 2, 12);
    const fn = FNS[t % 2];
    const code = t % 3 ? 'gray' : 'standard';
    const bits = Array.from({ length: 2 * k }, () => (r() < 0.5 ? 0 : 1));
    const p = Fn.decodeBits(fn, bits, k, code).point;
    assert.deepEqual(Fn.encodePoint(fn, p, k, code), bits);
  }
});

test('vecinos a un bit: 2k cromosomas, cada uno a distancia de Hamming 1', () => {
  const bits = [1, 0, 1, 1, 0, 0, 1, 0];
  for (const code of ['standard', 'gray']) {
    const nb = Fn.hammingNeighbours('himmelblau', bits, 4, code);
    assert.equal(nb.length, 8);
    nb.forEach((d) => {
      const c = bits.slice();
      c[d.bit] = 1 - c[d.bit];
      assert.deepEqual(d.point, Fn.decodeBits('himmelblau', c, 4, code).point);
    });
  }
});

test('el mejor punto representable coincide con la enumeración exhaustiva (k = 2…10)', () => {
  for (const fn of FNS) {
    const F = Fn.fnOf(fn);
    for (let k = 2; k <= 10; k++) {
      const n = Math.pow(2, k);
      let best = Infinity;
      for (let a = 0; a < n; a++) {
        const x = F.a + (a * (F.b - F.a)) / (n - 1);
        for (let b = 0; b < n; b++) best = Math.min(best, F.f(x, F.a + (b * (F.b - F.a)) / (n - 1)));
      }
      const got = Fn.bestRepresentable(fn, k);
      assert.ok(Math.abs(got.f - best) < 1e-9, `${fn}, k = ${k}: ${got.f} ≠ ${best}`);
      assert.ok(Math.abs(Fn.evalAt(fn, got.point) - got.f) < 1e-12);
      assert.ok(got.f > 0, 'el óptimo exacto nunca está en la rejilla');
    }
  }
});

test('los mínimos globales valen 0', () => {
  for (const fn of FNS) Fn.fnOf(fn).minima.forEach((p) => assert.ok(Fn.evalAt(fn, p) < 1e-9));
});

// ---------- Reales: la caja ----------

test('acotar y reflejar dejan el punto en la caja y no tocan los genes de dentro', () => {
  const r = R.mulberry32(9);
  for (let t = 0; t < 5000; t++) {
    const fn = FNS[t % 2];
    const F = Fn.fnOf(fn);
    const x = [0, 1].map(() => Math.round((r() * 100 - 50) * 100) / 100 + 0);
    const c = Fn.clampPoint(fn, x);
    const f = Fn.reflectPoint(fn, x);
    [0, 1].forEach((i) => {
      assert.ok(c[i] >= F.a && c[i] <= F.b);
      assert.ok(f[i] >= F.a && f[i] <= F.b);
      if (x[i] >= F.a && x[i] <= F.b) { assert.equal(c[i], x[i]); assert.equal(f[i], x[i]); }
      else assert.equal(c[i], x[i] < F.a ? F.a : F.b);
      assert.ok(Math.abs(f[i] - reflectRef(x[i], F.a, F.b)) < 1e-9, `${x[i]} → ${f[i]}`);
    });
    assert.deepEqual(Fn.clampPoint(fn, c), c);
    assert.deepEqual(Fn.reflectPoint(fn, f), f);
    assert.equal(Fn.outside(fn, x) === 0, Fn.inBox(fn, x));
  }
});

test('puntos aleatorios: dentro de la caja, o con algún gen fuera, siempre en centésimas', () => {
  for (let s = 1; s < 400; s++) {
    for (const fn of FNS) {
      const p = Fn.randomPoint(fn, s);
      assert.ok(Fn.inBox(fn, p));
      const q = Fn.randomOutside(fn, s);
      assert.ok(!Fn.inBox(fn, q));
      assert.equal(RealP.validate({ fn }, q), null);
      p.concat(q).forEach((v) => assert.equal(Math.round(v * 100) / 100, v));
    }
  }
});

test('penalizar: f(x) + λ · d, sin mover el punto; con el punto dentro, los tres tratamientos coinciden', () => {
  const r = R.mulberry32(3);
  for (let t = 0; t < 1000; t++) {
    const fn = FNS[t % 2];
    const x = t % 2 ? Fn.randomOutside(fn, t + 1) : Fn.randomPoint(fn, t + 1);
    const lambda = R.randInt(r, 0, 100);
    const pen = RealP.evaluate({ fn }, x, 'penalty', { lambda });
    assert.deepEqual(pen.solution, x);
    assert.ok(Math.abs(pen.fitness - (Fn.evalAt(fn, x) + lambda * Fn.outside(fn, x))) < 1e-9);
    if (Fn.inBox(fn, x)) {
      for (const v of RealP.VARIANTS) assert.ok(Math.abs(RealP.evaluate({ fn }, x, v, { lambda }).fitness - Fn.evalAt(fn, x)) < 1e-12);
    }
  }
});

// ---------- Trazas ----------

test('trazas de los reales: cinco etapas en orden y el resultado del tratamiento elegido', () => {
  const r = R.mulberry32(17);
  for (let t = 0; t < 600; t++) {
    const fn = FNS[t % 2];
    const variant = RealP.VARIANTS[t % 3];
    const x = t % 2 ? Fn.randomOutside(fn, t + 1) : Fn.randomPoint(fn, t + 1);
    const lambda = R.randInt(r, 0, 100);
    const res = RealP.run({ fn }, x, { variant, lambda });
    const stages = res.steps.map((s) => s.stage);
    assert.deepEqual([...new Set(stages)], [1, 2, 3, 4, 5]);
    stages.forEach((s, i) => { if (i) assert.ok(s >= stages[i - 1]); });
    const types = res.steps.map((s) => s.type);
    if (Fn.inBox(fn, x)) assert.ok(types.includes('validIn') && !types.includes(variant));
    else assert.ok(types.includes('validOut') && types.includes(variant));
    const ev = RealP.evaluate({ fn }, x, variant, { lambda });
    assert.equal(res.result.fitness, ev.fitness);
    assert.deepEqual(res.result.solution, ev.solution);
    assert.equal(res.result.feasible, Fn.inBox(fn, x));
  }
});

test('trazas de la binaria: decodificación variable a variable y paso de localidad', () => {
  const r = R.mulberry32(23);
  for (let t = 0; t < 600; t++) {
    const fn = FNS[t % 2];
    const k = R.randInt(r, 2, 12);
    const code = t % 2 ? 'gray' : 'standard';
    const bits = Array.from({ length: 2 * k }, () => (r() < 0.5 ? 0 : 1));
    const res = BitsP.run({ fn, k }, bits, { variant: code });
    const types = res.steps.map((s) => s.type);
    assert.equal(types.filter((y) => y === 'decodeScale').length, 2);
    assert.equal(types.filter((y) => y === 'decodeGray').length, code === 'gray' ? 2 : 0);
    const dec = Fn.decodeBits(fn, bits, k, code);
    assert.deepEqual(res.result.solution, dec.point);
    assert.equal(res.result.fitness, Fn.evalAt(fn, dec.point));
    const ham = res.steps[res.steps.length - 1];
    assert.equal(ham.type, 'hamming');
    assert.equal(ham.text.params.h, Fn.stepBits(ham.text.params.z, ham.text.params.z2, k, code));
    if (code === 'gray') assert.equal(ham.text.params.h, 1);
    assert.ok(res.stats.best.f <= res.result.fitness + 1e-12, 'ningún cromosoma mejora el mejor punto representable');
  }
});

test('validación de los datos', () => {
  assert.equal(RealP.validate({ fn: 'nope' }, [0, 0]), 'errFunction');
  assert.equal(RealP.validate({ fn: 'himmelblau' }, [0]), 'errRealLength');
  assert.equal(RealP.validate({ fn: 'himmelblau' }, [0, 51]), 'errRealRange');
  assert.equal(RealP.validate({ fn: 'himmelblau' }, [0, 49]), null);
  assert.equal(BitsP.validate({ fn: 'himmelblau', k: 13 }, null), 'errBitsK');
  assert.equal(BitsP.validate({ fn: 'himmelblau', k: 3 }, [1, 0, 1]), 'errBitsLength');
  assert.equal(BitsP.validate({ fn: 'rastrigin', k: 2 }, [1, 0, 2, 0]), 'errChromosomeBits');
  assert.equal(BitsP.validate({ fn: 'rastrigin', k: 2 }, [1, 0, 1, 0]), null);
});
