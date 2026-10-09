'use strict';
// El generador con semilla es reproducible y sus utilidades devuelven lo que prometen.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rng.js');

test('misma semilla, misma secuencia', () => {
  const a = R.mulberry32(42); const b = R.mulberry32(42);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test('los números están en [0, 1)', () => {
  const r = R.mulberry32(7);
  for (let i = 0; i < 10000; i++) { const x = r(); assert.ok(x >= 0 && x < 1); }
});

test('randomPermutation devuelve una permutación de 1..n', () => {
  const r = R.mulberry32(1);
  for (let n = 1; n <= 12; n++) {
    assert.deepEqual(R.randomPermutation(r, n).slice().sort((x, y) => x - y), Array.from({ length: n }, (_, i) => i + 1));
  }
});

test('randInt respeta los límites', () => {
  const r = R.mulberry32(3);
  for (let i = 0; i < 5000; i++) { const k = R.randInt(r, 2, 5); assert.ok(Number.isInteger(k) && k >= 2 && k <= 5); }
});
