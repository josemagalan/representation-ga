'use strict';
// Regresiones de la revisión del 14 oct 2026: semillas leídas de la URL (el 0 es una semilla válida y
// distinta del 1), narración de los empates de makespan y textos corregidos (terminología única,
// erratas del español y afirmaciones inexactas). La parte de la URL que necesita navegador
// (enlace estándar ↔ Gray, k en el vector de reales) está en tests/browser/url-state.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const R = require('../js/rng.js');
const A = require('../js/assignment.js');
const Fn = require('../js/func.js');
const K = require('../js/problems/knapsack-bits.js');
const T = require('../js/problems/tsp-perm.js');
const I = require('../js/problems/assignment-int.js');
const contentInt = require('../js/content/assignment-int.js');

const ROOT = path.join(__dirname, '..');

// ---------- Semillas ----------

test('parseSeed: el 0 es una semilla; lo que falta o no es un entero de 0 a 999999 da null', () => {
  assert.equal(R.parseSeed('0'), 0);
  assert.equal(R.parseSeed('613897'), 613897);
  assert.equal(R.parseSeed('999999'), 999999);
  for (const bad of [null, undefined, '', '  ', 'abc', '-1', '1.5', '1000000', 'NaN', '1e9']) {
    assert.equal(R.parseSeed(bad), null, String(bad));
  }
});

test('seedState: las semillas de 1 en adelante no cambian (las instancias ya publicadas siguen igual); el 0 ya no es el 1', () => {
  for (let s = 1; s <= 2000; s++) assert.equal(R.seedState(s), s);
  assert.equal(R.seedState(999999), 999999);
  assert.notEqual(R.seedState(0), 0);
  assert.notEqual(R.seedState(0), R.seedState(1));
});

test('las semillas 0 y 1 dan instancias y cromosomas distintos en los cuatro problemas', () => {
  assert.notDeepEqual(K.randomInstance(0, 8), K.randomInstance(1, 8));
  assert.notDeepEqual(K.randomChromosome(0, 8), K.randomChromosome(1, 8));
  assert.notDeepEqual(A.randomInstance(0, 6, 3), A.randomInstance(1, 6, 3));
  assert.notDeepEqual(A.randomAssignment(0, 6, 3), A.randomAssignment(1, 6, 3));
  assert.notDeepEqual(T.randomInstance(0, 7), T.randomInstance(1, 7));
  assert.notDeepEqual(T.randomChromosome(0, 7), T.randomChromosome(1, 7));
  assert.notDeepEqual(Fn.randomPoint('himmelblau', 0), Fn.randomPoint('himmelblau', 1));
  assert.notDeepEqual(Fn.randomBits(0, 5), Fn.randomBits(1, 5));
});

test('la semilla 0 da siempre la misma instancia (reproducible al recargar)', () => {
  assert.deepEqual(K.randomInstance(0, 8), K.randomInstance(0, 8));
  assert.deepEqual(T.randomInstance(0, 7), T.randomInstance(0, 7));
  assert.deepEqual(A.randomInstance(0, 6, 3), A.randomInstance(0, 6, 3));
});

test('ninguna vista sustituye la semilla 0 de la URL por una aleatoria', () => {
  const files = ['js/ui/knapsack-bits.js', 'js/ui/tsp-perm.js', 'js/ui/assignment.js', 'js/compare-view.js'];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.match(src, /R\.parseSeed\(q\.get\('s'\)\)/, `${f} no lee la semilla con parseSeed`);
    assert.doesNotMatch(src, /Number\(q\.get\('s'\)\)\)\s*\|\|/, `${f} vuelve a tratar el 0 como «sin semilla»`);
  }
});

// ---------- Empates de makespan ----------

function fill(s, params) {
  return s.replace(/\{(\w+)\}/g, (m, p) => (params[p] == null ? m : String(params[p])));
}

test('con empate, la narración dice «máquinas 1 y 2» (no «máquina 1, 2»), en los dos idiomas', () => {
  const inst = { p: [[1, 1], [1, 1], [1, 1], [1, 1], [2, 2]] };
  for (const [a, opt] of [[[1, 1, 1, 2, 2], true], [[1, 1, 1, 1, 1], false]]) {
    const res = I.run(inst, a);
    const done = res.steps.find((s) => s.type === 'decodeDone');
    const L = done.loads;
    const tie = L.filter((v) => v === Math.max(...L)).length > 1;
    if (!tie) continue;
    assert.match(done.text.key, /Tie$/);
    for (const lang of ['es', 'en']) {
      const tpl = contentInt.narration[lang][done.text.key];
      assert.ok(tpl, `falta ${done.text.key} (${lang})`);
      const out = fill(tpl, done.text.params);
      assert.doesNotMatch(out, /\{\w+\}/, out);
      assert.match(out, lang === 'es' ? /máquinas 1 y 2/ : /machines 1 and 2/, out);
    }
    if (opt) assert.equal(done.text.key, 'decodeDoneOptTie');
  }
});

test('sin empate, la narración sigue hablando de una sola máquina', () => {
  const inst = { p: [[3, 1], [3, 1], [3, 1], [3, 1], [3, 5]] };
  const done = I.run(inst, [1, 2, 2, 2, 2]).steps.find((s) => s.type === 'decodeDone');   // cargas 3 y 8
  assert.doesNotMatch(done.text.key, /Tie$/);
  assert.equal(done.text.params.crit, '2');
});

// ---------- Textos ----------

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
const sources = walk(path.join(ROOT, 'js')).map((f) => [path.relative(ROOT, f), fs.readFileSync(f, 'utf8')]);

test('textos corregidos: ninguna de las erratas o inexactitudes encontradas vuelve a aparecer', () => {
  const banned = [
    ['precipicio', 'el término es «salto de Hamming», definido en la explicación'],
    ['binario natural', 'se dice «binaria estándar»'],
    ['│', 'U+2502 en lugar de la barra vertical «|»'],
    ['Ningún tratamiento hace falta', '«No hace falta ningún tratamiento»'],
    ['tal como está escrita, O(n²)', 'falta el verbo'],
    ['es una parábola', 'en dos variables es un paraboloide'],
    ['casi media caja', 'el bit más significativo mueve el punto algo más de media caja'],
    ['almost half the width', 'the most significant bit moves the point just over half the width'],
    ['mueve el punto media caja', 'es algo más de media caja'],
    ['Pulsa dos genes', 'con el ratón, «Haz clic»'],
    ['Pulsa las ciudades', 'con el ratón, «Haz clic»'],
  ];
  for (const [file, src] of sources) {
    for (const [s, why] of banned) assert.ok(!src.includes(s), `${file}: «${s}» (${why})`);
  }
});

test('el workflow de CI no empieza con BOM', () => {
  const buf = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'tests.yml'));
  assert.notDeepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});

// ---------- Mochila: empate entre la aptitud penalizada y la mejor factible (15 oct) ----------
// Antes, si la aptitud de una infactible igualaba a la mejor factible, la narración decía «queda por
// debajo» (avisado al escribir el capítulo 4 del libro, con λ = 1 y penalización cuadrática).

const lastKey = (r) => r.steps[r.steps.length - 1].text.key;

test('mochila: si la aptitud penalizada iguala a la mejor factible, la narración dice que empata', () => {
  // Cuadrática, λ = 1: pesa 12 (e = 2), vale 24; 24 − (1 · 2)² = 20, que es el óptimo.
  const q = { weights: [5, 5, 2, 9, 9], values: [10, 10, 4, 1, 1], capacity: 10 };
  assert.equal(K.enumerate(q).optimum, 20);
  const tie = K.run(q, [1, 1, 1, 0, 0], { variant: 'penalty-quadratic', lambda: 1 });
  assert.equal(tie.result.fitness, 20);
  assert.equal(lastKey(tie), 'penaltyTie');
  assert.equal(lastKey(K.run(q, [1, 1, 1, 0, 0], { variant: 'penalty-quadratic', lambda: 0.9 })), 'penaltyBeats');
  assert.equal(lastKey(K.run(q, [1, 1, 1, 0, 0], { variant: 'penalty-quadratic', lambda: 1.1 })), 'penaltyBelow');
  // Lineal, λ = 1, en la instancia del test de λ pequeña: pesa 15 (e = 3), vale 18; 18 − 3 = 15.
  const l = { weights: [3, 5, 2, 7, 4], values: [4, 6, 3, 8, 2], capacity: 12 };
  assert.equal(lastKey(K.run(l, [1, 1, 0, 1, 0], { variant: 'penalty-linear', lambda: 1 })), 'penaltyTie');
});

test('mochila: el empate se decide con la aptitud que se muestra, no con el error de coma flotante', () => {
  // λ = 1,1 y e = 50: 1,1 · 50 = 55,00000000000001, así que 115 − λ · e = 59,99999…, que se muestra como 60.
  const inst = { weights: [50, 50, 60, 60, 60], values: [60, 55, 1, 1, 1], capacity: 50 };
  assert.equal(K.enumerate(inst).optimum, 60);
  const r = K.run(inst, [1, 1, 0, 0, 0], { variant: 'penalty-linear', lambda: 1.1 });
  assert.ok(r.result.fitness < 60);
  const step = r.steps[r.steps.length - 1];
  assert.equal(step.text.key, 'penaltyTie');
  assert.equal(step.text.params.fitness, 60);
});

test('mochila: la narración del empate existe en los dos idiomas y usa los mismos huecos', () => {
  const nar = require('../js/content/knapsack-bits.js').narration;
  for (const lang of ['es', 'en']) {
    assert.match(nar[lang].penaltyTie, /\{fitness\}/);
    assert.match(nar[lang].penaltyTie, /\{opt\}/);
  }
});
