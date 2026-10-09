'use strict';
// Viajante con representación permutacional: óptimo, reparación, redundancia y traza, frente a
// implementaciones independientes.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rng.js');
const T = require('../js/problems/tsp-perm.js');

function bruteOptimum(inst) {
  const n = inst.coords.length;
  const rest = Array.from({ length: n - 1 }, (_, i) => i + 2);
  let best = Infinity;
  const perm = (a, k) => {
    if (k === a.length) { best = Math.min(best, T.tourLength(inst, [1, ...a])); return; }
    for (let i = k; i < a.length; i++) {
      [a[k], a[i]] = [a[i], a[k]];
      perm(a, k + 1);
      [a[k], a[i]] = [a[i], a[k]];
    }
  };
  perm(rest, 0);
  return best;
}

function randomGenes(r, n) {
  return r() < 0.5 ? R.randomPermutation(r, n) : Array.from({ length: n }, () => R.randInt(r, 1, n));
}

test('instancias reproducibles y dentro del plano [0, 100]²', () => {
  for (let s = 1; s < 40; s++) {
    const n = 5 + (s % 6);
    const a = T.randomInstance(s, n);
    assert.deepEqual(a, T.randomInstance(s, n));
    assert.equal(T.validate(a, T.randomChromosome(s, n)), null);
    assert.ok(a.coords.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100));
    const br = T.brokenChromosome(s, n);
    assert.ok(!T.analyze(br).valid, 'el cromosoma «no válido» repite alguna ciudad');
    br.forEach((c, k) => assert.notEqual(c, br[(k + 1) % n], 'la ciudad repetida no queda al lado de la original'));
  }
});

test('Held y Karp da el mismo óptimo que la búsqueda exhaustiva', () => {
  for (let s = 1; s <= 40; s++) {
    const inst = T.randomInstance(s * 7, 5 + (s % 4));   // n = 5…8
    const opt = T.optimum(inst);
    assert.ok(Math.abs(opt.length - bruteOptimum(inst)) < 1e-9);
    assert.ok(Math.abs(T.tourLength(inst, opt.tour) - opt.length) < 1e-9, 'el circuito devuelto mide lo que dice');
    assert.equal(opt.tour[0], 1);
    assert.ok(T.analyze(opt.tour).valid);
  }
});

test('reparación: siempre una permutación, conserva las primeras apariciones y no toca las permutaciones', () => {
  const r = R.mulberry32(4);
  for (let t = 0; t < 3000; t++) {
    const n = R.randInt(r, 5, 10);
    const x = randomGenes(r, n);
    const { tour, fixes } = T.repair(x);
    assert.deepEqual(tour.slice().sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i + 1));
    const seen = new Set();
    x.forEach((c, k) => {
      if (!seen.has(c)) assert.equal(tour[k], c, 'la primera aparición se queda');
      seen.add(c);
    });
    assert.equal(fixes.length, n - new Set(x).size);
    if (T.analyze(x).valid) assert.deepEqual(tour, x);
  }
});

test('redundancia: 2n cromosomas distintos, todos el mismo circuito y la misma longitud', () => {
  const r = R.mulberry32(9);
  for (let t = 0; t < 300; t++) {
    const n = R.randInt(r, 5, 10);
    const inst = T.randomInstance(t + 1, n);
    const x = R.randomPermutation(r, n);
    const eq = T.equivalents(x);
    assert.equal(eq.length, 2 * n);
    assert.equal(new Set(eq.map((e) => e.join(' '))).size, 2 * n);
    assert.equal(eq[0].join(' '), x.join(' '));
    const L = T.tourLength(inst, x);
    eq.forEach((e) => assert.ok(Math.abs(T.tourLength(inst, e) - L) < 1e-9));
    // Mismo conjunto de aristas no dirigidas
    const edges = (p) => p.map((c, k) => [c, p[(k + 1) % n]].sort((a, b) => a - b).join('-')).sort().join(' ');
    eq.forEach((e) => assert.equal(edges(e), edges(x)));
  }
});

test('la traza recorre las cinco etapas, suma bien las distancias y repara cuando hace falta', () => {
  const r = R.mulberry32(17);
  for (let t = 0; t < 400; t++) {
    const n = R.randInt(r, 5, 10);
    const inst = T.randomInstance(t + 3, n);
    const x = randomGenes(r, n);
    const { steps, result, stats } = T.run(inst, x);
    assert.deepEqual([...new Set(steps.map((s) => s.stage))], [1, 2, 3, 4, 5]);
    const legs = steps.filter((s) => s.type === 'decodeGo' || s.type === 'decodeRepeat');
    assert.equal(legs.length, n - 1);
    assert.equal(steps.filter((s) => s.type === 'decodeRepeat').length, n - new Set(x).size);
    const close = steps.find((s) => s.type === 'decodeClose');
    assert.ok(Math.abs(close.length - T.tourLength(inst, x)) < 1e-9, 'longitud del cromosoma tal cual');
    assert.ok(Math.abs(result.fitness - T.tourLength(inst, T.repair(x).tour)) < 1e-9);
    assert.ok(result.fitness >= stats.optimum - 1e-9, 'nada mejora el óptimo');
    const fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800][n];
    assert.equal(stats.permutations, fact);
    assert.equal(stats.tours, fact / n / 2);
    const last = steps[steps.length - 1];
    assert.equal(last.type, T.analyze(x).valid ? 'redundancy' : 'repairDone');
    assert.deepEqual(last.genes, result.tour);
  }
});

test('distancias en décimas: lo que se muestra cuadra exactamente', () => {
  // Implementación independiente: euclídea redondeada a décimas, sumada en décimas enteras.
  const tenths = (inst, a, b) => {
    const [x1, y1] = inst.coords[a - 1];
    const [x2, y2] = inst.coords[b - 1];
    return Math.round(Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) * 10);
  };
  const r = R.mulberry32(23);
  for (let t = 0; t < 400; t++) {
    const n = R.randInt(r, 5, 10);
    const inst = T.randomInstance(t + 11, n);
    const x = randomGenes(r, n);
    let ref = 0;
    for (let k = 0; k < n; k++) ref += tenths(inst, x[k], x[(k + 1) % n]);
    assert.equal(Math.round(T.tourLength(inst, x) * 10), ref);
    // Sumando los tramos que enseña la narración se obtiene exactamente la longitud que enseña.
    const { steps, stats } = T.run(inst, x);
    let shown = 0;
    steps.filter((s) => ['decodeGo', 'decodeRepeat', 'decodeClose'].includes(s.type)).forEach((s) => {
      shown += Math.round(s.text.params.d * 10);
      assert.equal(Math.round(s.text.params.len * 10), shown, `paso ${s.type}`);
    });
    assert.equal(shown, ref);
    // El óptimo también está en décimas exactas.
    assert.ok(Math.abs(stats.optimum * 10 - Math.round(stats.optimum * 10)) < 1e-9);
  }
});

test('validación del cromosoma introducido a mano', () => {
  const inst = T.randomInstance(1, 6);
  assert.equal(T.validate(inst, [1, 2, 3, 4, 5, 6]), null);
  assert.equal(T.validate(inst, [1, 1, 3, 4, 5, 6]), null, 'las repeticiones se admiten: es un cromosoma no válido, no un error');
  assert.equal(T.validate(inst, [1, 2, 3, 4, 5]), 'errTourLength');
  assert.equal(T.validate(inst, [1, 2, 3, 4, 5, 7]), 'errTourGenes');
  assert.equal(T.validate(inst, [1, 2, 3, 4, 5, 0]), 'errTourGenes');
  assert.equal(T.validate(T.randomInstance(1, 11), null), 'errCitiesCount');
});
