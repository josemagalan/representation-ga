'use strict';
// Comparar codificaciones: las métricas del ejemplo coinciden con un recuento por fuerza bruta
// escrito aquí, la redundancia media de la matriz es exactamente 2ⁿᵐ / mⁿ y en Gray el vecino de la
// rejilla está siempre a un bit.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rng.js');
const A = require('../js/assignment.js');
const Fn = require('../js/func.js');
const AM = require('../js/problems/assignment-matrix.js');
const C = require('../js/compare.js');

const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ---------- Implementaciones independientes ----------
function cmax(inst, a) {
  const L = Array(inst.p[0].length).fill(0);
  a.forEach((j, i) => { L[j - 1] += inst.p[i][j - 1]; });
  return Math.max(...L);
}
function repairRow(inst, i, row) {
  const ones = row.map((b, j) => (b ? j : -1)).filter((j) => j >= 0);
  if (ones.length === 1) return ones[0] + 1;
  const cands = ones.length ? ones : row.map((_, j) => j);
  let best = cands[0];
  cands.forEach((j) => { if (inst.p[i][j] < inst.p[i][best]) best = j; });
  return best + 1;
}
const decode = (inst, y) => y.map((row, i) => repairRow(inst, i, row));

function bruteAssignment(inst, a, matrix) {
  const n = a.length;
  const m = inst.p[0].length;
  const c0 = cmax(inst, a);
  const nbs = [];
  if (!matrix) {
    for (let i = 0; i < n; i++) for (let j = 1; j <= m; j++) if (j !== a[i]) { const b = a.slice(); b[i] = j; nbs.push({ b, feas: true }); }
  } else {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const y = a.map((aj) => Array.from({ length: m }, (_, k) => (k === aj - 1 ? 1 : 0)));
        y[i][j] = 1 - y[i][j];
        nbs.push({ b: decode(inst, y), feas: y.every((row) => row.reduce((s, v) => s + v, 0) === 1) });
      }
    }
  }
  const N = nbs.length;
  const moved = nbs.map(({ b }) => b.filter((j, i) => j !== a[i]).length);
  return {
    neighbours: N,
    feasibleNb: nbs.filter((x) => x.feas).length / N,
    neutral: moved.filter((d) => d === 0).length / N,
    moved: moved.reduce((s, d) => s + d, 0) / N,
    dCmax: nbs.reduce((s, { b }) => s + Math.abs(cmax(inst, b) - c0), 0) / N,
  };
}

test('asignación: localidad del ejemplo igual a la fuerza bruta', () => {
  const r = R.mulberry32(5);
  for (let t = 0; t < 1500; t++) {
    const n = R.randInt(r, A.LIMITS.nMin, A.LIMITS.nMax);
    const m = R.randInt(r, A.LIMITS.mMin, A.LIMITS.mMax);
    const inst = A.randomInstance(t + 1, n, m);
    const a = A.randomAssignment(t + 7, n, m);
    const res = C.assignment(inst, a);
    const [vi, vm] = res.rows;
    assert.deepEqual(vi.local, bruteAssignment(inst, a, false));
    const bm = bruteAssignment(inst, a, true);
    Object.keys(bm).forEach((k) => assert.ok(close(vm.local[k], bm[k]), `${k}: ${vm.local[k]} ≠ ${bm[k]}`));
    // vector: siempre factible, nunca neutro, una tarea cambia; matriz desde factible: ningún vecino factible
    assert.equal(vi.local.neighbours, n * (m - 1));
    assert.equal(vi.local.moved, 1);
    assert.equal(vm.local.neighbours, n * m);
    assert.equal(vm.local.feasibleNb, 0);
    assert.ok(vm.local.moved <= 1);
    assert.equal(vi.space.redundancy, 1);
    assert.equal(vm.space.feasible, Math.pow(m, n) / Math.pow(2, n * m));
    assert.deepEqual(vm.chrom, A.toMatrix(a, m));
  }
});

test('asignación: la redundancia de la matriz cuenta las matrices que se reparan a la solución; su media es 2ⁿᵐ / mⁿ', () => {
  for (const [n, m] of [[5, 2], [6, 2], [5, 3]]) {
    const inst = A.randomInstance(n * 10 + m, n, m);
    const counts = new Map();
    const nm = n * m;
    for (let mask = 0; mask < (1 << nm); mask++) {
      const y = Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => (mask >> (i * m + j)) & 1));
      const key = decode(inst, y).join('');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    let sum = 0;
    let sols = 0;
    const a = Array(n).fill(1);
    for (;;) {
      const res = C.assignment(inst, a);
      assert.equal(res.rows[1].space.redundancy, counts.get(a.join('')) || 0);
      assert.equal(res.rows[1].space.redundancyMean, Math.pow(2, nm) / Math.pow(m, n));
      sum += res.rows[1].space.redundancy;
      sols++;
      let k = n - 1;
      while (k >= 0 && a[k] === m) { a[k] = 1; k--; }
      if (k < 0) break;
      a[k]++;
    }
    assert.equal(sum / sols, Math.pow(2, nm) / Math.pow(m, n));
  }
});

test('asignación: medias sobre soluciones al azar, reproducibles con la semilla', () => {
  const m1 = C.assignmentMean(6, 3, 200, 9);
  assert.deepEqual(m1, C.assignmentMean(6, 3, 200, 9));
  assert.equal(m1['assignment-int'].moved, 1);
  assert.equal(m1['assignment-int'].feasibleNb, 1);
  assert.equal(m1['assignment-int'].neutral, 0);
  assert.equal(m1['assignment-matrix'].feasibleNb, 0);
  assert.equal(m1['assignment-matrix'].neighbours, 18);
  assert.ok(m1['assignment-matrix'].neutral > 0 && m1['assignment-matrix'].neutral < 1);
});

// ---------- Función ----------
function bruteBits(fnId, k, p, gray) {
  const F = Fn.fnOf(fnId);
  const N = 2 ** k - 1;
  const zOf = (v) => Math.max(0, Math.min(N, Math.round(((v - F.a) / (F.b - F.a)) * N)));
  const enc = (z) => { const c = gray ? z ^ (z >> 1) : z; return Array.from({ length: k }, (_, j) => (c >> (k - 1 - j)) & 1); };
  const dec = (bits) => { let z = parseInt(bits.join(''), 2); if (gray) { let b = z; for (let s = 1; s < 32; s <<= 1) b ^= b >> s; z = b; } return z; };
  const x = (z) => F.a + z * (F.b - F.a) / N;
  const z = [zOf(p[0]), zOf(p[1])];
  const base = [x(z[0]), x(z[1])];
  const bits = enc(z[0]).concat(enc(z[1]));
  let jump = 0;
  let maxJump = 0;
  let grid = 0;
  let dF = 0;
  for (let j = 0; j < 2 * k; j++) {
    const c = bits.slice();
    c[j] = 1 - c[j];
    const z2 = [dec(c.slice(0, k)), dec(c.slice(k))];
    const q = [x(z2[0]), x(z2[1])];
    const d = Math.hypot(q[0] - base[0], q[1] - base[1]);
    jump += d;
    maxJump = Math.max(maxJump, d);
    if (Math.abs(z2[0] - z[0]) + Math.abs(z2[1] - z[1]) === 1) grid++;
    dF += Math.abs(F.f(q[0], q[1]) - F.f(base[0], base[1]));
  }
  let cliff = 0;
  [0, 1].forEach((i) => [1, -1].forEach((dir) => {
    const z2 = z[i] + dir;
    if (z2 < 0 || z2 > N) return;
    const h = enc(z[i]).reduce((s, b, j) => s + (b !== enc(z2)[j] ? 1 : 0), 0);
    cliff = Math.max(cliff, h);
  }));
  return { neighbours: 2 * k, jump: jump / (2 * k), maxJump, gridNb: grid / (2 * k), cliff, dF: dF / (2 * k) };
}

test('función: localidad de la binaria (estándar y Gray) igual a la fuerza bruta', () => {
  const r = R.mulberry32(11);
  for (let t = 0; t < 1500; t++) {
    const fnId = Fn.FN_IDS[t % 2];
    const k = R.randInt(r, Fn.LIMITS.kMin, Fn.LIMITS.kMax);
    const p = Fn.randomPoint(fnId, t + 3);
    const res = C.fn(fnId, k, p);
    [['function-standard', false], ['function-gray', true]].forEach(([id, gray]) => {
      const row = res.rows.find((x) => x.id === id);
      const b = bruteBits(fnId, k, res.point, gray);
      Object.keys(b).forEach((key) => assert.ok(close(row.local[key], b[key], 1e-7), `${id} k=${k} ${key}: ${row.local[key]} ≠ ${b[key]}`));
      // el cromosoma decodifica al punto de la rejilla más cercano
      const dec = Fn.decodeBits(fnId, row.chrom, k, gray ? 'gray' : 'standard').point;
      assert.ok(close(dec[0], res.grid[0]) && close(dec[1], res.grid[1]));
    });
    // Gray: el vecino de la rejilla siempre a un bit
    assert.equal(res.rows[2].local.cliff, 1);
    const real = res.rows[0].local;
    assert.equal(real.neighbours, 4);
    assert.equal(real.gridNb, 1);
    assert.equal(real.cliff, 1);
    assert.ok(close(real.jump, 0.01, 1e-9) && close(real.maxJump, 0.01, 1e-9));
  }
});

test('función: precipicio de Hamming de la estándar en el centro (k bits) y medias reproducibles', () => {
  for (let k = 2; k <= 12; k++) {
    // z = 2ᵏ⁻¹ − 1 → 2ᵏ⁻¹: cambian los k bits
    const F = Fn.fnOf('himmelblau');
    const x = F.a + (2 ** (k - 1) - 1) * (F.b - F.a) / (2 ** k - 1);
    const res = C.fn('himmelblau', k, [x, x]);
    assert.equal(res.rows[1].local.cliff, k);
    assert.equal(res.rows[2].local.cliff, 1);
  }
  const m1 = C.fnMean('rastrigin', 6, 300, 4);
  assert.deepEqual(m1, C.fnMean('rastrigin', 6, 300, 4));
  assert.equal(m1['function-gray'].cliff, 1);
  assert.ok(m1['function-standard'].cliff > 1);
  assert.ok(m1['function-standard'].jump > m1['function-real'].jump);
});

test('qué codificación va con qué problema y qué página', () => {
  assert.equal(C.problemOf('assignment-matrix'), 'assignment');
  assert.equal(C.problemOf('function-bits'), 'function');
  assert.equal(C.problemOf('knapsack-bits'), null);
  assert.deepEqual(C.PAGE['function-gray'], { enc: 'function-bits', variant: 'gray' });
});
