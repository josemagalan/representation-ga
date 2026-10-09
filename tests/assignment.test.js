'use strict';
// Asignación de tareas a máquinas (R‖Cmax) con vector de enteros y con matriz binaria: óptimo,
// reparación, penalización, redundancia y trazas, frente a implementaciones independientes.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rng.js');
const A = require('../js/assignment.js');
const I = require('../js/problems/assignment-int.js');
const M = require('../js/problems/assignment-matrix.js');

// ---------- Implementaciones independientes ----------

/** Cmax de una matriz leída tal cual, sin pasar por el núcleo. */
function cmaxRef(p, y) {
  const m = p[0].length;
  const L = new Array(m).fill(0);
  for (let i = 0; i < p.length; i++) for (let j = 0; j < m; j++) if (y[i][j]) L[j] += p[i][j];
  return Math.max(...L);
}

/** Óptimo por recursión, sin el odómetro del núcleo. */
function optimumRef(p) {
  const n = p.length;
  const m = p[0].length;
  let best = Infinity;
  const L = new Array(m).fill(0);
  (function go(i) {
    if (i === n) { best = Math.min(best, Math.max(...L)); return; }
    for (let j = 0; j < m; j++) { L[j] += p[i][j]; go(i + 1); L[j] -= p[i][j]; }
  })(0);
  return best;
}

/** Reparación escrita de otra forma: ordena las máquinas por (tiempo, índice). */
function repairRef(p, y) {
  return y.map((row, i) => {
    const ones = row.map((b, j) => (b ? j : -1)).filter((j) => j >= 0);
    if (ones.length === 1) return row.slice();
    const cand = (ones.length ? ones : row.map((_, j) => j)).slice().sort((a, b) => p[i][a] - p[i][b] || a - b);
    return row.map((_, j) => (j === cand[0] ? 1 : 0));
  });
}

const randomMatrix = (r, n, m, q) => Array.from({ length: n }, () => Array.from({ length: m }, () => (r() < q ? 1 : 0)));
const allMatrices = (n, m) => {
  const out = [];
  for (let mask = 0; mask < (1 << (n * m)); mask++) out.push(Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => (mask >> (i * m + j)) & 1)));
  return out;
};

// ---------- Núcleo ----------

test('instancias reproducibles, con tiempos enteros de 1 a 9', () => {
  for (let s = 1; s < 60; s++) {
    const n = 5 + (s % 4);
    const m = 2 + (s % 3);
    const a = A.randomInstance(s, n, m);
    assert.deepEqual(a, A.randomInstance(s, n, m));
    assert.equal(A.validateInstance(a), null);
    assert.ok(a.p.flat().every((v) => Number.isInteger(v) && v >= 1 && v <= 9));
    assert.equal(I.validate(a, A.randomAssignment(s, n, m)), null);
    assert.equal(M.validate(a, M.randomChromosome(s, n, m)), null);
  }
});

test('el óptimo coincide con una enumeración independiente y la asignación devuelta lo alcanza', () => {
  for (let s = 1; s <= 80; s++) {
    const inst = A.randomInstance(s * 11, 5 + (s % 4), 2 + (s % 3));
    const opt = A.optimum(inst);
    assert.equal(opt.makespan, optimumRef(inst.p));
    assert.equal(A.makespan(inst, opt.assignment), opt.makespan);
    assert.ok(opt.count >= 1);
  }
});

test('conversiones: vector → matriz → vector y cargas iguales', () => {
  const r = R.mulberry32(5);
  for (let t = 0; t < 2000; t++) {
    const n = R.randInt(r, 5, 8);
    const m = R.randInt(r, 2, 4);
    const inst = A.randomInstance(t + 1, n, m);
    const a = A.randomAssignment(t + 7, n, m);
    const y = A.toMatrix(a, m);
    assert.ok(A.isFeasibleMatrix(y));
    assert.deepEqual(A.fromMatrix(y), a);
    assert.deepEqual(A.matrixLoads(inst, y), A.loads(inst, a));
    assert.equal(A.violations(y), 0);
    assert.equal(cmaxRef(inst.p, y), A.makespan(inst, a));
  }
});

test('localidad: cambiar un bit de una matriz factible siempre la hace infactible', () => {
  const r = R.mulberry32(8);
  for (let t = 0; t < 300; t++) {
    const n = R.randInt(r, 5, 8);
    const m = R.randInt(r, 2, 4);
    const y = A.toMatrix(A.randomAssignment(t + 2, n, m), m);
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const z = y.map((row) => row.slice());
      z[i][j] = 1 - z[i][j];
      assert.ok(!A.isFeasibleMatrix(z));
      assert.equal(A.violations(z), 1);
    }
  }
});

// ---------- Matriz: reparación y penalización ----------

test('reparación: una sola máquina por tarea, la misma que la implementación independiente, sin tocar las filas válidas', () => {
  const r = R.mulberry32(4);
  for (let t = 0; t < 4000; t++) {
    const n = R.randInt(r, 5, 8);
    const m = R.randInt(r, 2, 4);
    const inst = A.randomInstance(t + 1, n, m);
    const y = randomMatrix(r, n, m, [0.2, 1 / m, 0.6][t % 3]);
    const { matrix, fixes } = M.repair(inst, y);
    assert.ok(A.isFeasibleMatrix(matrix));
    assert.deepEqual(matrix, repairRef(inst.p, y));
    y.forEach((row, i) => { if (A.rowOnes(row).length === 1) assert.deepEqual(matrix[i], row); });
    assert.equal(fixes.length, y.filter((row) => A.rowOnes(row).length !== 1).length);
    // Si había unos, la máquina elegida es una de ellas
    fixes.forEach((f) => { if (f.ones.length) assert.ok(f.ones.includes(f.machine)); });
  }
});

test('redundancia de la reparación: el recuento coincide con la enumeración y suma 2ⁿᵐ', () => {
  for (const [n, m, seed] of [[5, 2, 1], [5, 3, 2], [6, 2, 3], [5, 3, 9]]) {
    const inst = A.randomInstance(seed, n, m);
    const counts = new Map();
    for (const y of allMatrices(n, m)) {
      const key = A.fromMatrix(M.repair(inst, y).matrix).join('');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    let total = 0;
    const a = Array(n).fill(1);
    for (;;) {
      const c = M.repairPreimages(inst, a);
      assert.equal(c, counts.get(a.join('')) || 0, a.join(''));
      total += c;
      let k = n - 1;
      while (k >= 0 && a[k] === m) { a[k] = 1; k--; }
      if (k < 0) break;
      a[k]++;
    }
    assert.equal(total, 2 ** (n * m));
  }
});

test('penalización: Cmax tal cual + λ · v, y con λ ≥ máxᵢ mínⱼ pᵢⱼ nada mejora al óptimo', () => {
  const r = R.mulberry32(21);
  for (let t = 0; t < 3000; t++) {
    const n = R.randInt(r, 5, 8);
    const m = R.randInt(r, 2, 4);
    const inst = A.randomInstance(t + 5, n, m);
    const y = randomMatrix(r, n, m, 0.35);
    const lambda = [0, 0.5, 1, 2.5][t % 4];
    const pf = M.penaltyFitness(inst, y, lambda);
    const v = y.reduce((s, row) => s + Math.abs(row.reduce((a, b) => a + b, 0) - 1), 0);
    assert.equal(pf.v, v);
    assert.ok(Math.abs(pf.fitness - (cmaxRef(inst.p, y) + lambda * v)) < 1e-9);
    const opt = A.optimum(inst).makespan;
    assert.ok(M.penaltyFitness(inst, y, A.lambdaBound(inst)).fitness >= opt);
  }
  // Exhaustivo en instancias pequeñas
  for (const seed of [1, 2, 3]) {
    const inst = A.randomInstance(seed, 5, 2);
    const opt = A.optimum(inst).makespan;
    for (const y of allMatrices(5, 2)) assert.ok(M.penaltyFitness(inst, y, A.lambdaBound(inst)).fitness >= opt);
  }
});

test('con λ pequeña hay matrices infactibles que «mejoran» al óptimo', () => {
  const inst = A.randomInstance(3, 6, 3);
  const opt = A.optimum(inst).makespan;
  const empty = Array.from({ length: 6 }, () => [0, 0, 0]);
  assert.ok(M.penaltyFitness(inst, empty, 0.5).fitness < opt, 'la matriz vacía, con λ = 0,5');
});

// ---------- Trazas ----------

test('vector de enteros: cinco etapas, cargas correctas y siempre factible', () => {
  const r = R.mulberry32(17);
  for (let t = 0; t < 500; t++) {
    const n = R.randInt(r, 5, 8);
    const m = R.randInt(r, 2, 4);
    const inst = A.randomInstance(t + 3, n, m);
    const a = A.randomAssignment(t + 9, n, m);
    const { steps, result, stats } = I.run(inst, a);
    assert.deepEqual([...new Set(steps.map((s) => s.stage))], [1, 2, 3, 4, 5]);
    assert.equal(steps.filter((s) => s.type === 'decodeTask').length, n);
    assert.equal(result.fitness, A.makespan(inst, a));
    assert.ok(result.fitness >= stats.optimum);
    assert.equal(stats.total, m ** n);
    const done = steps.find((s) => s.type === 'decodeDone');
    assert.deepEqual(done.loads, A.loads(inst, a));
    assert.equal(steps[steps.length - 1].type, 'nominal');
  }
});

test('matriz: la traza decodifica tal cual, repara o penaliza, y la aptitud coincide con evaluate', () => {
  const r = R.mulberry32(29);
  for (let t = 0; t < 600; t++) {
    const n = R.randInt(r, 5, 8);
    const m = R.randInt(r, 2, 4);
    const inst = A.randomInstance(t + 3, n, m);
    const y = t % 5 === 0 ? M.randomFeasible(t, n, m) : randomMatrix(r, n, m, 1 / m);
    const copy = y.map((row) => row.slice());
    for (const variant of M.VARIANTS) {
      const lambda = [0.5, 1, 3][t % 3];
      const { steps, result, stats } = M.run(inst, y, { variant, lambda });
      assert.deepEqual(y, copy, 'run no modifica el cromosoma');
      assert.deepEqual([...new Set(steps.map((s) => s.stage))], [1, 2, 3, 4, 5]);
      assert.equal(steps.filter((s) => /^decode(One|None|Many)$/.test(s.type)).length, n);
      assert.deepEqual(steps.find((s) => s.type === 'decodeDone').loads, A.matrixLoads(inst, y));
      const ev = M.evaluate(inst, y, variant, { lambda });
      assert.ok(Math.abs(result.fitness - ev.fitness) < 1e-9);
      assert.deepEqual(result.solution, ev.solution);
      assert.equal(stats.total, 2 ** (n * m));
      assert.equal(stats.feasible, m ** n);
      const last = steps[steps.length - 1];
      if (A.isFeasibleMatrix(y)) assert.equal(last.type, 'locality');
      else if (variant === 'repair') {
        assert.equal(last.type, 'repairRedundancy');
        assert.deepEqual(last.genes, result.solution);
        assert.ok(result.fitness >= stats.optimum);
      } else assert.equal(last.type, 'penaltyCompare');
    }
  }
});

test('validación de los datos a mano', () => {
  const inst = A.randomInstance(1, 6, 3);
  assert.equal(I.validate(inst, [1, 2, 3, 1, 2, 3]), null);
  assert.equal(I.validate(inst, [1, 2, 3, 1, 2]), 'errAssignLength');
  assert.equal(I.validate(inst, [1, 2, 3, 1, 2, 4]), 'errAssignGenes');
  assert.equal(I.validate(inst, [1, 2, 3, 1, 2, 0]), 'errAssignGenes');
  assert.equal(M.validate(inst, [[0, 0, 0], [1, 1, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1], [1, 1, 1]]), null, 'filas infactibles: no es un error');
  assert.equal(M.validate(inst, [[0, 0, 0]]), 'errMatrixShape');
  assert.equal(M.validate(inst, Array.from({ length: 6 }, () => [0, 2, 0])), 'errMatrixBits');
  assert.equal(A.validateInstance(A.randomInstance(1, 9, 3)), 'errTasksCount');
  assert.equal(A.validateInstance(A.randomInstance(1, 6, 5)), 'errMachinesCount');
  assert.equal(A.validateInstance({ p: [[1, 2], [1, 2], [1, 2], [1, 2], [1]] }), 'errTimesShape');
  assert.equal(A.validateInstance({ p: [[1, 2], [1, 2], [1, 2], [1, 2], [1, 100]] }), 'errTimes');
});
