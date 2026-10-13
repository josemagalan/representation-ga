'use strict';
// Modo práctica: para cada uno de los 21 ejercicios, la respuesta que guarda el ejercicio coincide con
// una implementación independiente (escrita aquí a partir de los datos que ve el estudiante) y con lo
// que muestra el paso a paso con el mismo ejemplo; el corrector acepta la respuesta correcta y solo
// ella (en el viajante, los 2n cromosomas equivalentes) y respeta las tolerancias.
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rng.js');
const A = require('../js/assignment.js');
const Fn = require('../js/func.js');
const PR = require('../js/practice.js');
const KN = require('../js/problems/knapsack-bits.js');
const TS = require('../js/problems/tsp-perm.js');
const AI = require('../js/problems/assignment-int.js');
const AM = require('../js/problems/assignment-matrix.js');
const FR = require('../js/problems/function-real.js');
const FB = require('../js/problems/function-bits.js');
const RUN = { 'knapsack-bits': KN, 'tsp-perm': TS, 'assignment-int': AI, 'assignment-matrix': AM, 'function-real': FR, 'function-bits': FB };

const TRIALS = 1000;

// ---------- Páginas aleatorias (lo que puede haber en la URL) ----------
function randomPage(id, r, seed) {
  if (id === 'knapsack-bits') {
    const n = R.randInt(r, KN.LIMITS.nMin, KN.LIMITS.nMax);
    const inst = KN.randomInstance(seed, n);
    inst.capacity = R.randInt(r, 1, inst.weights.reduce((a, b) => a + b, 0));
    return { inst, x: KN.randomChromosome(seed, n), variant: KN.VARIANTS[R.randInt(r, 0, 4)], lambda: R.randInt(r, 0, 50) / 10, draw: R.randInt(r, 1, 999) };
  }
  if (id === 'tsp-perm') {
    const n = R.randInt(r, TS.LIMITS.nMin, TS.LIMITS.nMax);
    return { inst: TS.randomInstance(seed, n), x: r() < 0.5 ? TS.brokenChromosome(seed, n) : TS.randomChromosome(seed, n) };
  }
  if (id === 'assignment-int' || id === 'assignment-matrix') {
    const n = R.randInt(r, A.LIMITS.nMin, A.LIMITS.nMax);
    const m = R.randInt(r, A.LIMITS.mMin, A.LIMITS.mMax);
    const inst = A.randomInstance(seed, n, m);
    if (id === 'assignment-int') return { inst, x: A.randomAssignment(seed, n, m) };
    return { inst, x: r() < 0.3 ? AM.randomFeasible(seed, n, m) : AM.randomChromosome(seed, n, m), variant: AM.VARIANTS[R.randInt(r, 0, 1)], lambda: R.randInt(r, 0, 20) / 2 };
  }
  const fn = Fn.FN_IDS[R.randInt(r, 0, 1)];
  if (id === 'function-real') {
    return { fn, x: r() < 0.5 ? Fn.randomOutside(fn, seed) : Fn.randomPoint(fn, seed), variant: FR.VARIANTS[R.randInt(r, 0, 2)], lambda: R.randInt(r, 0, 100) };
  }
  const k = R.randInt(r, Fn.LIMITS.kMin, Fn.LIMITS.kMax);
  return { fn, k, variant: FB.VARIANTS[R.randInt(r, 0, 1)], x: Fn.randomBits(seed, k) };
}

/** La traza del paso a paso para la página del ejercicio (la misma llamada que hace la interfaz). */
function runPage(id, pg) {
  if (id === 'knapsack-bits') return KN.run(pg.inst, pg.x, { variant: pg.variant, lambda: pg.lambda, seed: pg.draw });
  if (id === 'tsp-perm') return TS.run(pg.inst, pg.x);
  if (id === 'assignment-int') return AI.run(pg.inst, pg.x);
  if (id === 'assignment-matrix') return AM.run(pg.inst, pg.x.map((row) => row.slice()), { variant: pg.variant, lambda: pg.lambda });
  if (id === 'function-real') return FR.run({ fn: pg.fn }, pg.x, { variant: pg.variant, lambda: pg.lambda });
  return FB.run({ fn: pg.fn, k: pg.k }, pg.x, { variant: pg.variant });
}

const ans = (ex, id) => ex.groups.find((g) => g.id === id).items.map((it) => it.answer);
const givenParams = (ex, key) => ex.givens.find((g) => g.key === key).params;

// ---------- Implementaciones independientes ----------
const indep = {
  knapsackDecoder(inst, x) {
    let w = 0;
    return x.map((b, i) => { if (b && w + inst.weights[i] <= inst.capacity) { w += inst.weights[i]; return 1; } return 0; });
  },
  knapsackGreedy(inst, x) {
    const s = x.slice();
    const W = () => s.reduce((a, b, i) => a + b * inst.weights[i], 0);
    while (W() > inst.capacity) {
      const order = s.map((b, i) => i).filter((i) => s[i]).sort((i, j) => inst.values[i] / inst.weights[i] - inst.values[j] / inst.weights[j] || i - j);
      s[order[0]] = 0;
    }
    return s;
  },
  knapsackRandom(inst, x, draws) {
    const s = x.slice();
    let k = 0;
    const W = () => s.reduce((a, b, i) => a + b * inst.weights[i], 0);
    while (W() > inst.capacity) {
      const inside = s.map((b, i) => i).filter((i) => s[i]);
      s[inside[Math.floor(draws[k++] * inside.length)]] = 0;
    }
    return s;
  },
  tspRepair(x) {
    const n = x.length;
    const missing = [];
    for (let c = 1; c <= n; c++) if (x.indexOf(c) === -1) missing.push(c);
    const seen = new Set();
    return x.map((c) => { if (seen.has(c)) c = missing.shift(); seen.add(c); return c; });
  },
  tspLeg(inst, a, b) {
    const p = inst.coords[a - 1];
    const q = inst.coords[b - 1];
    return Math.round(Math.sqrt((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2) * 10);
  },
  matrixRepair(inst, y) {
    return y.map((row, i) => {
      const ones = row.map((b, j) => (b ? j : -1)).filter((j) => j >= 0);
      if (ones.length === 1) return row.slice();
      const cands = ones.length ? ones : row.map((_, j) => j);
      let best = cands[0];
      cands.forEach((j) => { if (inst.p[i][j] < inst.p[i][best]) best = j; });
      return row.map((_, j) => (j === best ? 1 : 0));
    });
  },
  matrixLoads(inst, y) {
    const L = Array(inst.p[0].length).fill(0);
    y.forEach((row, i) => row.forEach((b, j) => { if (b) L[j] += inst.p[i][j]; }));
    return L;
  },
  clamp(F, v) { return Math.min(F.b, Math.max(F.a, v)); },
  reflect(F, v) {
    let y = Math.round(v * 100);
    const a = Math.round(F.a * 100);
    const b = Math.round(F.b * 100);
    while (y < a || y > b) y = y < a ? 2 * a - y : 2 * b - y;
    return y / 100;
  },
  toBits(z, k, gray) {
    const c = gray ? z ^ (z >> 1) : z;
    return Array.from({ length: k }, (_, j) => (c >> (k - 1 - j)) & 1);
  },
  fromBits(bits, gray) {
    let z = parseInt(bits.join(''), 2);
    if (gray) { let b = z; for (let s = 1; s < 16; s <<= 1) b ^= b >> s; z = b; }
    return z;
  },
};

// ---------- Comprobaciones comunes ----------
function common(id, type, page) {
  const ex = PR.exercise(id, type, page);
  const res = runPage(id, ex.page);
  // la página del ejercicio es un punto fijo: volver a generarlo da el mismo ejercicio
  assert.deepEqual(PR.exercise(id, type, ex.page), ex, `${id}/${type}: no es estable`);
  // el paso que se enseña y el de «Ver la solución» existen en la traza
  assert.ok(res.steps.some((s) => s.type === ex.view.type), `${id}/${type}: falta el paso ${ex.view.type}`);
  if (!ex.solution.last) assert.ok(res.steps.some((s) => ex.solution.types.indexOf(s.type) !== -1), `${id}/${type}: falta el paso de la solución`);
  // la respuesta guardada tiene un formato válido y se corrige como toda bien
  const right = PR.answerOf(ex);
  assert.equal(PR.validate(ex, right), null, `${id}/${type}: respuesta no válida`);
  const gr = PR.grade(ex, right);
  assert.equal(gr.ok, gr.total);
  assert.ok(gr.total >= 1);
  // cambiar un elemento cualquiera lo marca a él (y, en el viajante, a sus aristas) como error
  const gi = ex.groups.findIndex((g) => g.kind !== 'tour');
  if (gi >= 0) {
    const gp = ex.groups[gi];
    const wrong = JSON.parse(JSON.stringify(right));
    const v = wrong[gp.id][0];
    if (gp.kind === 'bit' || gp.kind === 'check') wrong[gp.id][0] = 1 - v;
    else if (gp.kind === 'yesno') wrong[gp.id][0] = v === 'yes' ? 'no' : 'yes';
    else if (gp.kind === 'choice') wrong[gp.id][0] = gp.options.find((o) => o !== v);
    else if (gp.kind === 'num') wrong[gp.id][0] = v + 2 * (gp.tol ? PR.TOL[gp.tol](v) : 0) + 1;
    else wrong[gp.id][0] = v + 1;
    if (PR.validate(ex, wrong) === null) {
      const g2 = PR.grade(ex, wrong);
      assert.equal(g2.ok, g2.total - 1, `${id}/${type}: un error cuenta como uno`);
      assert.equal(g2.groups[gi].items[0].ok, false);
    }
  }
  return { ex, res };
}

const CHECK = {
  'knapsack-bits': {
    encode(ex, res, page) {
      const sol = indep.knapsackDecoder(page.inst, page.x);
      const n = page.x.length;
      // Fuerza bruta: qué valores toma cada gen entre los cromosomas que dan esta solución
      const seen = Array.from({ length: n }, () => new Set());
      let count = 0;
      for (let mask = 0; mask < (1 << n); mask++) {
        const y = Array.from({ length: n }, (_, i) => (mask >> i) & 1);
        if (indep.knapsackDecoder(page.inst, y).join('') !== sol.join('')) continue;
        count++;
        y.forEach((b, i) => seen[i].add(b));
      }
      assert.deepEqual(ans(ex, 'genes'), seen.map((s) => (s.size === 2 ? 'any' : String([...s][0]))));
      assert.deepEqual(ans(ex, 'count'), [count]);
      assert.equal(res.result.preimages, count);
      assert.equal(ex.page.variant, 'decoder');
    },
    decode(ex, res, page) {
      const sol = page.variant === 'decoder' ? indep.knapsackDecoder(page.inst, page.x) : page.x;
      assert.deepEqual(ans(ex, 'inside'), sol);
      assert.deepEqual(ans(ex, 'weight'), [sol.reduce((a, b, i) => a + b * page.inst.weights[i], 0)]);
      assert.deepEqual(ans(ex, 'value'), [sol.reduce((a, b, i) => a + b * page.inst.values[i], 0)]);
      const done = res.steps.find((s) => s.type === 'decodeDone');
      assert.equal(done.weight, ans(ex, 'weight')[0]);
    },
    validity(ex, res, page) {
      const w = page.x.reduce((a, b, i) => a + b * page.inst.weights[i], 0);
      assert.deepEqual(ans(ex, 'feasible'), [w <= page.inst.capacity ? 'yes' : 'no']);
      if (page.variant.startsWith('penalty')) {
        assert.deepEqual(ans(ex, 'excess'), [Math.max(0, w - page.inst.capacity)]);
        return;
      }
      let expected;
      if (page.variant === 'decoder') expected = indep.knapsackDecoder(page.inst, page.x);
      else if (page.variant === 'repair-greedy') expected = indep.knapsackGreedy(page.inst, page.x);
      else {
        // con los números que se dan (y solo con ellos) se repara igual que en el paso a paso
        const draws = givenParams(ex, 'prKnapDraws').draws;
        draws.forEach((d) => assert.ok(Math.abs(d * 100 - Math.round(d * 100)) < 1e-9 && d >= 0 && d < 1));
        expected = indep.knapsackRandom(page.inst, page.x, draws);
        assert.ok(res.draws.length <= draws.length);
        assert.deepEqual(res.draws, draws.slice(0, res.draws.length));
      }
      assert.deepEqual(ans(ex, 'treated'), expected);
      assert.deepEqual(res.result.solution, expected);
    },
    fitness(ex, res, page) {
      const w = page.x.reduce((a, b, i) => a + b * page.inst.weights[i], 0);
      const v = page.x.reduce((a, b, i) => a + b * page.inst.values[i], 0);
      const e = Math.max(0, w - page.inst.capacity);
      const quad = page.variant === 'penalty-quadratic';
      const pen = quad ? (page.lambda * e) ** 2 : page.lambda * e;
      assert.deepEqual(ans(ex, 'value'), [v]);
      assert.deepEqual(ans(ex, 'excess'), [e]);
      assert.ok(Math.abs(ans(ex, 'penalty')[0] - pen) < 1e-9);
      assert.ok(Math.abs(ans(ex, 'fitness')[0] - (v - pen)) < 1e-9);
      assert.ok(Math.abs(res.result.fitness - (v - pen)) < 1e-9);
      assert.equal(ex.page.variant, quad ? 'penalty-quadratic' : 'penalty-linear');
    },
  },
  'tsp-perm': {
    encode(ex, res, page) {
      const tour = indep.tspRepair(page.x);
      // Las 2n rotaciones y simetrías del circuito se aceptan; cualquier otra permutación, no
      const n = tour.length;
      const equiv = new Set();
      for (let k = 0; k < n; k++) {
        const rot = tour.slice(k).concat(tour.slice(0, k));
        equiv.add(rot.join(' '));
        equiv.add(rot.slice().reverse().join(' '));
      }
      assert.equal(equiv.size, 2 * n);
      equiv.forEach((c) => {
        const g = PR.grade(ex, { tour: c.split(' ').map(Number) });
        assert.equal(g.ok, n, c);
      });
      const r = R.mulberry32(n * 7 + tour[0]);
      for (let t = 0; t < 20; t++) {
        const p = R.randomPermutation(r, n);
        const g = PR.grade(ex, { tour: p });
        assert.equal(g.ok === n, equiv.has(p.join(' ')));
      }
      assert.ok(res.steps.some((s) => s.type === 'redundancy'));
    },
    decode(ex, res, page) {
      assert.equal(PR.grade(ex, { tour: page.x.slice().reverse() }).ok, page.x.length);
    },
    validity(ex, res, page) {
      const valid = new Set(page.x).size === page.x.length;
      assert.deepEqual(ans(ex, 'valid'), [valid ? 'yes' : 'no']);
      assert.deepEqual(ans(ex, 'repaired'), indep.tspRepair(page.x));
      assert.deepEqual(res.result.tour, indep.tspRepair(page.x));
    },
    fitness(ex, res, page) {
      const tour = indep.tspRepair(page.x);
      const legs = tour.map((c, k) => indep.tspLeg(page.inst, c, tour[(k + 1) % tour.length]));
      assert.deepEqual(ans(ex, 'legs'), legs.map((v) => v / 10));
      const total = legs.reduce((a, b) => a + b, 0) / 10;
      assert.ok(Math.abs(ans(ex, 'length')[0] - total) < 1e-9);
      assert.ok(Math.abs(res.result.fitness - total) < 1e-9);
      // la tabla que se da tiene exactamente esas distancias
      const table = ex.givens.find((g) => g.table).table;
      tour.forEach((c, k) => assert.equal(table.rows[c - 1][tour[(k + 1) % tour.length]], legs[k] / 10));
    },
  },
  'assignment-int': {
    encode(ex, res, page) { assert.deepEqual(ans(ex, 'vector'), page.x.map(String)); },
    decode(ex, res, page) {
      const L = Array(page.inst.p[0].length).fill(0);
      page.x.forEach((j, i) => { L[j - 1] += page.inst.p[i][j - 1]; });
      assert.deepEqual(ans(ex, 'loads'), L);
      assert.deepEqual(res.steps.find((s) => s.type === 'decodeDone').loads, L);
    },
    fitness(ex, res, page) {
      const L = Array(page.inst.p[0].length).fill(0);
      page.x.forEach((j, i) => { L[j - 1] += page.inst.p[i][j - 1]; });
      const c = Math.max(...L);
      assert.deepEqual(ans(ex, 'cmax'), [c]);
      assert.deepEqual(ans(ex, 'critical'), L.map((v) => (v === c ? 1 : 0)));
      assert.equal(res.result.fitness, c);
    },
  },
  'assignment-matrix': {
    encode(ex, res, page) {
      const y = ex.page.x;
      assert.ok(y.every((row) => row.reduce((a, b) => a + b, 0) === 1));
      const a = givenParams(ex, 'prAssignVectorGiven').vec.split(' ').map(Number);
      assert.deepEqual(y.map((row) => row.indexOf(1) + 1), a);
      assert.deepEqual(ans(ex, 'matrix'), [].concat(...y));
    },
    decode(ex, res, page) {
      const expected = page.x.map((row) => {
        const k = row.reduce((a, b) => a + b, 0);
        return k === 1 ? String(row.indexOf(1) + 1) : (k ? 'many' : 'none');
      });
      assert.deepEqual(ans(ex, 'vector'), expected);
    },
    validity(ex, res, page) {
      assert.deepEqual(ans(ex, 'invalid'), page.x.map((row) => (row.reduce((a, b) => a + b, 0) === 1 ? 0 : 1)));
      const rep = indep.matrixRepair(page.inst, page.x);
      assert.deepEqual(ans(ex, 'repaired'), [].concat(...rep));
      assert.deepEqual(res.result.solution, rep);
    },
    fitness(ex, res, page) {
      const L = indep.matrixLoads(page.inst, page.x);
      const v = page.x.reduce((s, row) => s + Math.abs(row.reduce((a, b) => a + b, 0) - 1), 0);
      const c = Math.max(0, ...L);
      assert.deepEqual(ans(ex, 'cmax'), [c]);
      assert.deepEqual(ans(ex, 'v'), [v]);
      assert.ok(Math.abs(ans(ex, 'fitness')[0] - (c + page.lambda * v)) < 1e-9);
      assert.ok(Math.abs(res.result.fitness - (c + page.lambda * v)) < 1e-9);
    },
  },
  'function-real': {
    validity(ex, res, page) {
      const F = Fn.fnOf(page.fn);
      const inside = page.x.every((v) => v >= F.a && v <= F.b);
      assert.deepEqual(ans(ex, 'inside'), [inside ? 'yes' : 'no']);
      const fix = page.variant === 'reflect' ? indep.reflect : (F2, v) => Math.round(indep.clamp(F2, v) * 100) / 100;
      const pt = page.x.map((v) => fix(F, v));
      ans(ex, 'point').forEach((v, i) => assert.ok(Math.abs(v - pt[i]) < 1e-9, `${v} ≠ ${pt[i]}`));
      res.result.solution.forEach((v, i) => assert.ok(Math.abs(v - pt[i]) < 1e-9));
    },
    fitness(ex, res, page) {
      const F = Fn.fnOf(page.fn);
      if (page.variant === 'penalty') {
        const d = page.x.reduce((s, v) => s + Math.max(0, F.a - v, v - F.b), 0);
        assert.ok(Math.abs(ans(ex, 'f')[0] - F.f(page.x[0], page.x[1])) < 1e-9);
        assert.ok(Math.abs(ans(ex, 'd')[0] - d) < 1e-6);
        assert.ok(Math.abs(ans(ex, 'fitness')[0] - (F.f(page.x[0], page.x[1]) + page.lambda * d)) < 1e-6);
      } else {
        const fix = page.variant === 'reflect' ? indep.reflect : (F2, v) => Math.round(indep.clamp(F2, v) * 100) / 100;
        const pt = page.x.map((v) => fix(F, v));
        assert.ok(Math.abs(ans(ex, 'fitness')[0] - F.f(pt[0], pt[1])) < 1e-9);
      }
      assert.ok(Math.abs(res.result.fitness - ans(ex, 'fitness')[0]) < 1e-9);
    },
  },
  'function-bits': {
    encode(ex, res, page) {
      // con el punto que se da (cuatro decimales), z y los bits salen únicos
      const F = Fn.fnOf(page.fn);
      const p = givenParams(ex, 'prBitsPointGiven');
      const delta = (F.b - F.a) / (2 ** page.k - 1);
      const shown = [p.x1, p.x2].map((v) => Math.round(v * 1e4) / 1e4);
      const z = shown.map((v) => Math.round((v - F.a) / delta));
      const bits = z.flatMap((zz) => indep.toBits(zz, page.k, page.variant === 'gray'));
      assert.deepEqual(ans(ex, 'bits1').concat(ans(ex, 'bits2')), bits);
      assert.deepEqual(bits, page.x);
    },
    decode(ex, res, page) {
      const F = Fn.fnOf(page.fn);
      const gray = page.variant === 'gray';
      const z = [indep.fromBits(page.x.slice(0, page.k), gray), indep.fromBits(page.x.slice(page.k), gray)];
      assert.deepEqual(ans(ex, 'z'), z);
      const x = z.map((zz) => F.a + zz * (F.b - F.a) / (2 ** page.k - 1));
      ans(ex, 'point').forEach((v, i) => assert.ok(Math.abs(v - x[i]) < 1e-9));
    },
    locality(ex, res, page) {
      const gray = page.variant === 'gray';
      const step = res.steps.find((s) => s.type === 'hamming');
      const c = ex.cliff;
      assert.equal(step.cliff.i, c.i);
      assert.equal(step.cliff.z2, c.z2);
      const target = page.x.slice();
      indep.toBits(c.z2, page.k, gray).forEach((b, j) => { target[c.i * page.k + j] = b; });
      assert.deepEqual(ans(ex, 'neighbour1').concat(ans(ex, 'neighbour2')), target);
      assert.deepEqual(ans(ex, 'changed'), [target.filter((b, j) => b !== page.x[j]).length]);
      if (gray) assert.equal(ans(ex, 'changed')[0], 1);
    },
    fitness(ex, res, page) {
      const F = Fn.fnOf(page.fn);
      const gray = page.variant === 'gray';
      const z = [indep.fromBits(page.x.slice(0, page.k), gray), indep.fromBits(page.x.slice(page.k), gray)];
      const x = z.map((zz) => F.a + zz * (F.b - F.a) / (2 ** page.k - 1));
      assert.ok(Math.abs(ans(ex, 'f')[0] - F.f(x[0], x[1])) < 1e-9);
      assert.ok(Math.abs(res.result.fitness - F.f(x[0], x[1])) < 1e-9);
    },
  },
};

test('21 ejercicios: los tipos de cada codificación, como en la spec', () => {
  assert.deepEqual(Object.fromEntries(Object.keys(PR.TYPES).map((id) => [id, PR.typesFor(id).length])),
    { 'knapsack-bits': 4, 'tsp-perm': 4, 'assignment-int': 3, 'assignment-matrix': 4, 'function-real': 2, 'function-bits': 4 });
  assert.equal(Object.values(PR.TYPES).reduce((s, l) => s + l.length, 0), 21);
  assert.throws(() => PR.exercise('assignment-int', 'validity', {}));
});

for (const id of Object.keys(PR.TYPES)) {
  for (const type of PR.typesFor(id)) {
    test(`${id} · ${type}: respuesta única, igual a la implementación independiente y al paso a paso`, () => {
      const r = R.mulberry32(id.length * 1000 + type.length);
      for (let t = 0; t < TRIALS; t++) {
        const page = randomPage(id, r, t + 1);
        const { ex, res } = common(id, type, page);
        CHECK[id][type](ex, res, page);
      }
    });
    test(`${id} · ${type}: «Nuevo ejercicio» da una página válida del mismo tamaño`, () => {
      const r = R.mulberry32(99);
      for (let t = 0; t < 40; t++) {
        const page = randomPage(id, r, t + 1);
        const nx = PR.newPage(id, type, 1000 + t, page);
        const ex = PR.exercise(id, type, nx);
        runPage(id, ex.page);
        if (id === 'knapsack-bits') assert.equal(nx.x.length, page.x.length);
        if (id === 'tsp-perm') assert.equal(nx.x.length, page.x.length);
        if (id.startsWith('assignment')) assert.deepEqual(A.sizes(nx.inst), A.sizes(page.inst));
        if (id === 'function-bits') assert.equal(nx.x.length, 2 * page.k);
      }
    });
  }
}

test('validación de la respuesta: casillas vacías, números y circuitos', () => {
  const page = { inst: TS.randomInstance(3, 6), x: [1, 2, 3, 4, 5, 6] };
  const ex = PR.exercise('tsp-perm', 'encode', page);
  assert.equal(PR.validate(ex, { tour: [1, 2, 3] }), 'prErrTour');
  assert.equal(PR.validate(ex, { tour: [1, 2, 3, 4, 5, 9] }), 'prErrTour');
  assert.equal(PR.validate(ex, { tour: [1, 2, 3, 4, 5, 1.5] }), 'prErrInteger');
  // una ciudad repetida es un formato válido, pero no puede salir todo bien
  assert.equal(PR.validate(ex, { tour: [1, 2, 3, 4, 5, 5] }), null);
  assert.ok(PR.grade(ex, { tour: [1, 2, 3, 4, 5, 5] }).ok < 6);
  const kx = PR.exercise('knapsack-bits', 'fitness', { inst: { weights: [3, 4, 5, 2, 6], values: [1, 2, 3, 4, 5], capacity: 9 }, x: [1, 1, 1, 0, 0], variant: 'penalty-quadratic', lambda: 1.5, draw: 1 });
  assert.equal(PR.validate(kx, { value: [6], excess: [3], penalty: [''], fitness: [1] }), 'prErrEmpty');
  assert.equal(PR.validate(kx, { value: [6.5], excess: [3], penalty: [1], fitness: [1] }), 'prErrInteger');
  assert.equal(PR.validate(kx, { value: [6], excess: [3], penalty: [NaN], fitness: [1] }), 'prErrEmpty');
  // (1,5 · 3)² = 20,25 y 6 − 20,25 = −14,25, exactos en centésimas
  assert.deepEqual(PR.answerOf(kx), { value: [6], excess: [3], penalty: [20.25], fitness: [-14.25] });
  assert.equal(PR.grade(kx, { value: [6], excess: [3], penalty: [20.25], fitness: [-14.26] }).ok, 3);
});

test('tolerancias de la función: ±0,01 o el 0,1 %, lo que sea mayor', () => {
  const ex = PR.exercise('function-real', 'fitness', { fn: 'himmelblau', x: [0, 0], variant: 'clamp', lambda: 10 });
  const f = ans(ex, 'fitness')[0];   // f(0, 0) = 121 + 49 = 170 → tolerancia 0,17
  assert.equal(f, 170);
  const g = (v) => PR.grade(ex, { point: [0, 0], fitness: [v] }).groups[1].items[0].ok;
  assert.ok(g(170.16) && g(169.84));
  assert.ok(!g(170.2) && !g(169.8));
  const ex2 = PR.exercise('function-real', 'fitness', { fn: 'himmelblau', x: [3, 2], variant: 'clamp', lambda: 10 });
  const g2 = (v) => PR.grade(ex2, { point: [3, 2], fitness: [v] }).groups[1].items[0].ok;
  assert.ok(g2(0.01) && !g2(0.02));
});
