'use strict';
// Bancos de Moodle: se generan los 21 tipos en los tres niveles; el XML está bien formado; cada
// casilla cloze es válida y guarda la respuesta del ejercicio que reproduce su enlace (la página se
// reconstruye aquí desde la URL, como la reconstruye la herramienta); y en los ejercicios adaptados al
// texto, la respuesta sale también resolviendo el enunciado.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/moodle.js');
const PR = require('../js/practice.js');
const A = require('../js/assignment.js');
const Fn = require('../js/func.js');
const KN = require('../js/problems/knapsack-bits.js');
const TS = require('../js/problems/tsp-perm.js');
const AM = require('../js/problems/assignment-matrix.js');

const ALL = M.KINDS.map((k) => k.id);
const bank = {};
['es', 'en'].forEach((lang) => {
  bank[lang] = M.generate({ lang, kinds: ALL, levels: M.LEVELS, count: 6, seed: 4242 });
  bank[lang].xml = M.toXml(bank[lang]);
});

// ---------- Lectura de la pregunta (independiente de los campos internos) ----------
const clozes = (html) => [...html.matchAll(/\{1:(SHORTANSWER|NUMERICAL|MULTICHOICE):([^}]*)\}/g)].map((m) => {
  if (m[1] === 'MULTICHOICE') {
    const opts = m[2].split('~');
    return { type: m[1], options: opts.map((o) => o.replace(/^=/, '')), right: opts.filter((o) => o.startsWith('=')).map((o) => o.slice(1)) };
  }
  const mm = m[2].match(/^=(-?[\d.]+(?:e-?\d+)?)(?::([\d.]+))?$/);
  assert.ok(mm, `cloze mal escrito: ${m[0]}`);
  return { type: m[1], v: Number(mm[1]), tol: mm[2] ? Number(mm[2]) : 0 };
});

/** Página desde la URL, con las mismas reglas que js/ui/<id>.js (init). */
function pageFromLink(link) {
  const q = new URLSearchParams(link.split('#')[1]);
  const enc = q.get('enc');
  const list = (s) => s.split('-').map(Number);
  if (enc === 'knapsack-bits') {
    const v = q.get('v');
    return { inst: { weights: list(q.get('w')), values: list(q.get('val')), capacity: Number(q.get('W')) }, x: list(q.get('x')),
      variant: v, lambda: v.startsWith('penalty') ? Number(q.get('l')) : 1, draw: v === 'repair-random' ? Number(q.get('r')) : 1, seed: Number(q.get('s')) };
  }
  if (enc === 'tsp-perm') return { inst: TS.randomInstance(Number(q.get('s')), Number(q.get('n'))), x: list(q.get('x')), seed: Number(q.get('s')) };
  if (enc.startsWith('assignment')) {
    const inst = { p: q.get('p').split('-').map((r) => r.split('.').map(Number)) };
    const pg = { inst, x: enc === 'assignment-int' ? list(q.get('x')) : q.get('x').split('-').map((r) => r.split('').map(Number)), seed: Number(q.get('s')) };
    if (enc === 'assignment-matrix') { pg.variant = q.get('v'); pg.lambda = pg.variant === 'penalty' ? Number(q.get('l')) : 1; }
    return pg;
  }
  if (enc === 'function-real') return { fn: q.get('fn'), x: q.get('x').split('_').map(Number), variant: q.get('v'), lambda: q.get('v') === 'penalty' ? Number(q.get('l')) : 10 };
  return { fn: q.get('fn'), k: Number(q.get('k')), variant: q.get('v'), x: q.get('x').split('').map(Number) };
}

/** Respuestas de un ejercicio en el orden de las casillas, como las escribiría cloze. */
function expectedBoxes(ex, lang) {
  const out = [];
  ex.groups.forEach((gr) => {
    // La matriz se escribe como en la herramienta: filas = máquinas, columnas = tareas
    const order = gr.grid ? [].concat(...Array.from({ length: gr.grid.m }, (_, j) => Array.from({ length: gr.grid.n }, (_, i) => gr.items[i * gr.grid.m + j]))) : gr.items;
    order.forEach((it) => {
    const a = it.answer;
    if (gr.kind === 'bit' || gr.kind === 'int' || gr.kind === 'num') out.push({ v: a });
    else if (gr.kind === 'check') out.push({ choice: a ? 'yes' : 'no' });
    else out.push({ choice: a });
    });
  });
  return out;
}

// ---------- Pruebas ----------

test('se generan los 21 tipos en los tres niveles, en los dos idiomas', () => {
  assert.equal(M.KINDS.length, 21);
  ['es', 'en'].forEach((lang) => {
    assert.equal(bank[lang].missing.length, 0, JSON.stringify(bank[lang].missing));
    assert.equal(bank[lang].questions.length, 21 * 3 * 6);
  });
});

test('XML bien formado, con una categoría por codificación, tipo y nivel', () => {
  ['es', 'en'].forEach((lang) => {
    const xml = bank[lang].xml;
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    const body = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[^>]*\?>/, '');
    assert.ok(!/&(?!amp;|lt;|gt;|quot;|#\d+;)/.test(body), 'entidad sin escapar');
    const stack = [];
    for (const m of body.matchAll(/<(\/?)([a-z]+)[^>]*?(\/?)>/g)) {
      if (m[3]) continue;
      if (m[1]) assert.equal(stack.pop(), m[2]);
      else stack.push(m[2]);
    }
    assert.equal(stack.length, 0);
    const cats = [...xml.matchAll(/<category><text>\$course\$\/top\/([^<]+)<\/text><\/category>/g)].map((m) => m[1]);
    assert.equal(new Set(cats).size, 63);
    assert.equal((xml.match(/<question type="cloze">/g) || []).length, 21 * 3 * 6);
  });
});

test('cada casilla es válida y guarda la respuesta del ejercicio que reproduce el enlace', () => {
  ['es', 'en'].forEach((lang) => {
    bank[lang].questions.forEach((q) => {
      const boxes = clozes(q.text);
      assert.equal(boxes.length, q.boxes);
      boxes.filter((b) => b.type === 'MULTICHOICE').forEach((b) => assert.equal(b.right.length, 1, q.name));
      // Los dos enlaces llevan a la misma página
      const pg = pageFromLink(q.link);
      assert.deepEqual(pageFromLink(q.practiceLink), pg);
      assert.match(q.practiceLink, new RegExp(`practice=${q.type}$`));
      const ex = PR.exercise(q.enc, q.type, pg);
      assert.deepEqual(ex.page, pg, `${q.name}: la página del enlace no es la del ejercicio`);
      const want = expectedBoxes(M.adapt(ex, lang), lang);
      boxes.forEach((b, i) => {
        if (b.type === 'MULTICHOICE') {
          const gr = M.adapt(ex, lang);
          assert.ok(want[i].choice != null, q.name);
          // la opción marcada es la etiqueta de la respuesta correcta
          const label = b.right[0];
          const yes = lang === 'es' ? 'Sí' : 'Yes';
          const no = 'No';
          if (want[i].choice === 'yes') assert.equal(label, yes);
          else if (want[i].choice === 'no') assert.equal(label, no);
          else assert.ok(label === want[i].choice || label.endsWith(want[i].choice) || /^(0 o 1|0 or 1|ninguna|none|varias|several)$/.test(label), `${q.name}: ${label} ≠ ${want[i].choice}`);
          assert.ok(gr);
        } else {
          assert.ok(Math.abs(b.v - want[i].v) <= 1e-9 * Math.max(1, Math.abs(want[i].v)), `${q.name}: casilla ${i}: ${b.v} ≠ ${want[i].v}`);
        }
      });
    });
  });
});

test('ejercicios adaptados al texto: la respuesta sale de resolver el enunciado', () => {
  const qs = bank.es.questions;
  // Viajante, codificar: encadenar los tramos desde la ciudad 1 hacia la menor vecina
  qs.filter((q) => q.kind === 'tsp-perm:encode').forEach((q) => {
    const edges = q.text.match(/tramos \(sin sentido ni orden\): ([^.]+)\./)[1].split(', ').map((e) => e.split('–').map(Number));
    const nb = {};
    edges.forEach(([a, b]) => { (nb[a] = nb[a] || []).push(b); (nb[b] = nb[b] || []).push(a); });
    const tour = [1, Math.min(...nb[1])];
    while (tour.length < edges.length) tour.push(nb[tour[tour.length - 1]].find((c) => c !== tour[tour.length - 2]));
    assert.deepEqual(clozes(q.text).map((b) => b.v), tour);
  });
  // Viajante, decodificar: la ciudad siguiente a cada una
  qs.filter((q) => q.kind === 'tsp-perm:decode').forEach((q) => {
    const x = q.text.match(/Cromosoma: ([\d ]+)\./)[1].split(' ').map(Number);
    const next = x.map((_, c) => x[(x.indexOf(c + 1) + 1) % x.length]);
    assert.deepEqual(clozes(q.text).map((b) => b.v), next);
  });
  // Asignación, codificar: del plan por máquinas al vector
  qs.filter((q) => q.kind === 'assignment-int:encode').forEach((q) => {
    const plan = q.text.match(/Plan de trabajo: ([^<]+)\.<\/p>/)[1].split('; ');
    const a = [];
    plan.forEach((part) => {
      const [mach, tasks] = part.split(': ');
      const j = Number(mach.slice(1));
      if (!/ninguna/.test(tasks)) tasks.split(', ').forEach((t) => { a[Number(t.slice(1)) - 1] = String(j); });
    });
    assert.deepEqual(clozes(q.text).map((b) => b.right[0].slice(1)), a);
  });
});

test('los niveles respetan sus tamaños y filtros', () => {
  const qs = bank.es.questions;
  qs.forEach((q) => {
    const pg = q.page;
    if (q.enc === 'knapsack-bits') assert.ok(pg.x.length >= M.KN[q.level][0] && pg.x.length <= M.KN[q.level][1]);
    if (q.enc === 'tsp-perm') assert.equal(pg.x.length, q.type === 'fitness' && q.level === 'hard' ? 7 : M.TSPN[q.level]);
    if (q.enc.startsWith('assignment')) assert.deepEqual(Object.values(A.sizes(pg.inst)), M.ASZ[q.enc === 'assignment-int' ? 'int' : 'matrix'][q.level]);
    if (q.enc === 'assignment-matrix' && q.type !== 'encode') {
      const bad = pg.x.filter((row) => A.rowOnes(row).length !== 1).length;
      assert.ok(bad >= M.BAD[q.level][0] && bad <= M.BAD[q.level][1], q.name);
    }
    if (q.kind === 'knapsack-bits:encode') {
      const free = clozes(q.text).filter((b) => b.type === 'MULTICHOICE' && /0 o 1/.test(b.right[0])).length;
      assert.ok(free >= M.FREE[q.level][0] && free <= M.FREE[q.level][1], q.name);
    }
    if (q.kind === 'knapsack-bits:fitness' && q.level !== 'easy') assert.ok(KN.weightOf(pg.inst, pg.x) > pg.inst.capacity);
    if (q.kind === 'tsp-perm:validity' && q.level === 'hard') assert.equal(TS.analyze(pg.x).repeated.length, 2);
    if (q.enc === 'function-bits') assert.ok(q.level === 'easy' ? pg.k === 3 : (q.level === 'medium' ? pg.k >= 4 && pg.k <= 5 : pg.k >= 6 && pg.k <= 8));
    if (q.kind === 'function-real:validity') assert.ok(!Fn.inBox(pg.fn, pg.x));
    if (q.kind === 'assignment-matrix:fitness') assert.ok(!A.isFeasibleMatrix(pg.x) && pg.variant === 'penalty' && AM.VARIANTS.includes(pg.variant));
  });
});

test('el enlace paso a paso apunta al paso de la solución; la semilla del banco cambia', () => {
  bank.es.questions.forEach((q) => {
    const step = Number(new URLSearchParams(q.link.split('#')[1]).get('step'));
    assert.equal(step, q.step);
    assert.ok(step >= 0);
  });
  const a = M.generate({ lang: 'es', kinds: ['tsp-perm:fitness'], levels: ['easy'], count: 3 });
  const b = M.generate({ lang: 'es', kinds: ['tsp-perm:fitness'], levels: ['easy'], count: 3 });
  assert.notEqual(a.seed, b.seed);
  assert.match(M.previewHtml(bank.es.questions[0]), /<(input|select) /);
  assert.ok(!/\{1:/.test(M.previewHtml(bank.es.questions[0])));
});

test('la página de Moodle tiene los mismos textos en ES y EN', () => {
  const { text } = require('../js/moodle-page.js');
  assert.deepEqual(Object.keys(text.es).sort(), Object.keys(text.en).sort());
  assert.equal(text.es.how.length, text.en.how.length);
  assert.deepEqual(Object.keys(M.texts.es).sort(), Object.keys(M.texts.en).sort());
});
