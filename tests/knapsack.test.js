'use strict';
// Mochila 0/1 con representación binaria: la lógica de la herramienta frente a una implementación
// independiente, en miles de instancias aleatorias, y las propiedades que la herramienta enseña.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rng.js');
const K = require('../js/problems/knapsack-bits.js');

// ---------- Implementación independiente (deliberadamente distinta: por máscaras y con ordenación) ----------
const ref = {
  weight: (inst, s) => s.reduce((a, b, i) => a + (b ? inst.weights[i] : 0), 0),
  value: (inst, s) => s.reduce((a, b, i) => a + (b ? inst.values[i] : 0), 0),
  greedy(inst, x) {
    const s = x.slice();
    // Orden de salida: menor v/w primero; empate, menor índice. Se recorre hasta que cabe.
    const order = x.map((b, i) => i).filter((i) => x[i]).sort((a, b) => (inst.values[a] / inst.weights[a] - inst.values[b] / inst.weights[b]) || a - b);
    for (const j of order) {
      if (ref.weight(inst, s) <= inst.capacity) break;
      s[j] = 0;
    }
    return s;
  },
  random(inst, x, draws) {
    const s = x.slice();
    let k = 0;
    while (ref.weight(inst, s) > inst.capacity) {
      const inside = [];
      for (let i = 0; i < s.length; i++) if (s[i]) inside.push(i);
      s[inside[Math.floor(draws[k++] * inside.length)]] = 0;
    }
    return { s, used: k };
  },
  decoder(inst, x) {
    const s = x.map(() => 0);
    let w = 0;
    for (let i = 0; i < x.length; i++) if (x[i] && w + inst.weights[i] <= inst.capacity) { s[i] = 1; w += inst.weights[i]; }
    return s;
  },
  enumerate(inst) {
    const n = inst.weights.length;
    let feasible = 0;
    let best = -1;
    for (let m = 0; m < 2 ** n; m++) {
      const s = Array.from({ length: n }, (_, i) => (m >> i) & 1);
      if (ref.weight(inst, s) <= inst.capacity) { feasible++; best = Math.max(best, ref.value(inst, s)); }
    }
    return { feasible, best };
  },
};

function randomCase(r) {
  const n = R.randInt(r, 5, 12);
  const inst = K.randomInstance(R.randInt(r, 1, 1e6), n);
  const S = inst.weights.reduce((a, b) => a + b, 0);
  inst.capacity = R.randInt(r, 1, S);
  const x = Array.from({ length: n }, () => (r() < 0.6 ? 1 : 0));
  return { inst, x };
}

test('instancias y cromosomas reproducibles con la misma semilla', () => {
  for (let s = 1; s < 50; s++) {
    assert.deepEqual(K.randomInstance(s, 9), K.randomInstance(s, 9));
    assert.deepEqual(K.randomChromosome(s, 9), K.randomChromosome(s, 9));
    const inst = K.randomInstance(s, 9);
    assert.equal(K.validate(inst, K.randomChromosome(s, 9)), null);
    assert.equal(inst.capacity, Math.floor(inst.weights.reduce((a, b) => a + b, 0) / 2));
  }
});

test('validación de los datos introducidos a mano', () => {
  const ok = { weights: [3, 5, 2, 7, 4], values: [4, 6, 3, 8, 2], capacity: 12 };
  assert.equal(K.validate(ok, [1, 1, 0, 1, 1]), null);
  assert.equal(K.validate({ ...ok, weights: [3, 5, 2, 7] , values: [4, 6, 3, 8] }, null), 'errItemsCount');
  assert.equal(K.validate({ ...ok, values: [4, 6, 3, 8] }, null), 'errValuesCount');
  assert.equal(K.validate({ ...ok, weights: [3, 5, 0, 7, 4] }, null), 'errItemNumbers');
  assert.equal(K.validate({ ...ok, values: [4, 6, 3, 8, 100] }, null), 'errItemNumbers');
  assert.equal(K.validate({ ...ok, capacity: 22 }, null), 'errCapacity');
  assert.equal(K.validate({ ...ok, capacity: 0 }, null), 'errCapacity');
  assert.equal(K.validate(ok, [1, 1, 0, 1]), 'errChromosomeLength');
  assert.equal(K.validate(ok, [1, 1, 0, 2, 1]), 'errChromosomeBits');
});

test('recuento exhaustivo de factibles y óptimo, contra la implementación independiente', () => {
  const r = R.mulberry32(11);
  for (let t = 0; t < 300; t++) {
    const { inst } = randomCase(r);
    const a = K.enumerate(inst);
    const b = ref.enumerate(inst);
    assert.equal(a.total, 2 ** inst.weights.length);
    assert.equal(a.feasible, b.feasible);
    assert.equal(a.optimum, b.best);
  }
});

test('los cinco tratamientos, contra la implementación independiente (5000 casos)', () => {
  const r = R.mulberry32(5);
  for (let t = 0; t < 5000; t++) {
    const { inst, x } = randomCase(r);
    const lambda = [0, 0.3, 1, 2.5, 5][t % 5];
    const W = ref.weight(inst, x);
    const V = ref.value(inst, x);
    const e = Math.max(0, W - inst.capacity);
    // Penalizaciones: el cromosoma no cambia
    const lin = K.run(inst, x, { variant: 'penalty-linear', lambda }).result;
    assert.ok(Math.abs(lin.fitness - (e ? V - lambda * e : V)) < 1e-9);
    assert.deepEqual(lin.solution, x);
    const quad = K.run(inst, x, { variant: 'penalty-quadratic', lambda }).result;
    assert.ok(Math.abs(quad.fitness - (e ? V - (lambda * e) ** 2 : V)) < 1e-9);
    // Reparación voraz
    const g = K.run(inst, x, { variant: 'repair-greedy' }).result;
    const gs = ref.greedy(inst, x);
    assert.deepEqual(g.solution, gs);
    assert.equal(g.fitness, ref.value(inst, gs));
    assert.ok(g.weight <= inst.capacity);
    // Reparación aleatoria: mismos números, misma solución
    const rr = K.run(inst, x, { variant: 'repair-random', seed: t + 1 });
    const rs = ref.random(inst, x, rr.draws);
    assert.deepEqual(rr.result.solution, rs.s);
    assert.equal(rr.draws.length, rs.used);
    assert.ok(rr.draws.every((d) => d >= 0 && d < 1 && Math.abs(d * 100 - Math.round(d * 100)) < 1e-9), 'números con dos decimales');
    // Decodificador: siempre factible
    const d = K.run(inst, x, { variant: 'decoder' }).result;
    assert.deepEqual(d.solution, ref.decoder(inst, x));
    assert.ok(ref.weight(inst, d.solution) <= inst.capacity);
    // evaluate (la tabla de tratamientos) coincide con la traza
    for (const v of K.VARIANTS) {
      const run = K.run(inst, x, { variant: v, lambda, seed: 9 }).result;
      const ev = K.evaluate(inst, x, v, { lambda, seed: 9 });
      assert.ok(Math.abs(run.fitness - ev.fitness) < 1e-9, v);
      assert.deepEqual(run.solution, ev.solution, v);
    }
  }
});

test('la traza recorre las cinco etapas en orden y sus sumas cuadran', () => {
  const r = R.mulberry32(21);
  for (let t = 0; t < 500; t++) {
    const { inst, x } = randomCase(r);
    for (const v of K.VARIANTS) {
      const { steps, result } = K.run(inst, x, { variant: v, seed: t + 1 });
      const stages = steps.map((s) => s.stage);
      assert.deepEqual([...new Set(stages)], [1, 2, 3, 4, 5], v);
      for (let k = 1; k < stages.length; k++) assert.ok(stages[k] >= stages[k - 1]);
      for (const s of steps) {
        assert.equal(s.weight, s.bag.reduce((a, i) => a + inst.weights[i], 0));
        assert.equal(s.value, s.bag.reduce((a, i) => a + inst.values[i], 0));
      }
      const last = steps[steps.length - 1];
      assert.ok(last.result, 'el último paso lleva el resultado');
      assert.equal(last.result.fitness, result.fitness);
      if (v !== 'penalty-linear' && v !== 'penalty-quadratic') assert.ok(last.weight <= inst.capacity, v);
      // Un paso de decodificación por gen
      assert.equal(steps.filter((s) => ['decodeOut', 'decodeIn', 'decodeSkip'].includes(s.type)).length, x.length);
    }
  }
});

test('con λ pequeña, una solución infactible puede superar a la mejor factible (y la traza lo dice)', () => {
  const inst = { weights: [3, 5, 2, 7, 4], values: [4, 6, 3, 8, 2], capacity: 12 };
  const x = [1, 1, 0, 1, 1];   // pesa 19, vale 20; la mejor factible vale 15
  assert.equal(K.enumerate(inst).optimum, 15);
  const low = K.run(inst, x, { variant: 'penalty-linear', lambda: 0.5 });
  assert.equal(low.result.fitness, 16.5);
  assert.equal(low.steps[low.steps.length - 1].text.key, 'penaltyBeats');
  const high = K.run(inst, x, { variant: 'penalty-linear', lambda: 1 });
  assert.equal(high.steps[high.steps.length - 1].text.key, 'penaltyBelow');
  const quad = K.run(inst, x, { variant: 'penalty-quadratic', lambda: 0.5 });
  assert.equal(quad.result.fitness, 20 - 12.25);
});

test('redundancia del decodificador: las preimágenes de todas las soluciones suman 2ⁿ', () => {
  const r = R.mulberry32(8);
  for (let t = 0; t < 20; t++) {
    const { inst } = randomCase(r);
    const n = inst.weights.length;
    const seen = new Map();
    for (let m = 0; m < 2 ** n; m++) {
      const x = Array.from({ length: n }, (_, i) => (m >> i) & 1);
      const key = K.decoderDecode(inst, x).solution.join('');
      seen.set(key, (seen.get(key) || 0) + 1);
    }
    let totalPre = 0;
    for (const [key, count] of seen) {
      assert.equal(K.decoderPreimages(inst, key.split('').map(Number)), count);
      totalPre += count;
    }
    assert.equal(totalPre, 2 ** n);
  }
});

test('números aleatorios fijados: la reparación aleatoria usa los dados, en orden', () => {
  const inst = { weights: [3, 5, 2, 7, 4], values: [4, 6, 3, 8, 2], capacity: 12 };
  const x = [1, 1, 0, 1, 1];   // dentro: objetos 1, 2, 4, 5 (índices 0, 1, 3, 4)
  const res = K.run(inst, x, { variant: 'repair-random', draws: [0.6, 0.1] });
  // r = 0,6 → ⌊0,6·4⌋ = 2 → índice 3 (w = 7): pesa 12 ≤ 12
  assert.deepEqual(res.result.solution, [1, 1, 0, 0, 1]);
  assert.deepEqual(res.draws, [0.6]);
  assert.throws(() => K.run(inst, x, { variant: 'repair-random', draws: [] }), /errDraws/);
});
