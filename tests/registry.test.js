'use strict';
// Comprueba el catálogo: ids únicos, textos en los dos idiomas y, para cada codificación disponible,
// sus dos ficheros (lógica del problema y contenido docente).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registry = require('../js/registry.js');
const { languages } = require('../js/i18n.js');
const ROOT = path.join(__dirname, '..');

const bilingual = (obj, what) => {
  for (const l of languages) assert.ok(obj && typeof obj[l] === 'string' && obj[l].trim(), `${what}: falta el texto en «${l}»`);
};

test('cuatro representaciones, en el orden de la serie', () => {
  assert.deepEqual(registry.representations.map((r) => r.id), ['binary', 'integer', 'permutation', 'real']);
});

test('las seis codificaciones previstas en la hoja de ruta', () => {
  assert.deepEqual(registry.allEncodings().map((e) => e.id).sort(),
    ['assignment-int', 'assignment-matrix', 'function-bits', 'function-real', 'knapsack-bits', 'tsp-perm']);
});

test('ids únicos en representaciones, problemas y codificaciones', () => {
  const ids = registry.representations.flatMap((r) => [r.id, ...r.problems.flatMap((p) => [p.id, ...p.encodings.map((e) => e.id)])]);
  assert.equal(new Set(ids).size, ids.length);
});

test('todos los textos están en español y en inglés', () => {
  for (const r of registry.representations) {
    bilingual(r.name, `${r.id}.name`);
    bilingual(r.desc, `${r.id}.desc`);
    assert.ok(Array.isArray(r.sample) && r.sample.length > 0, `${r.id}.sample`);
    for (const p of r.problems) {
      bilingual(p.name, `${p.id}.name`);
      for (const e of p.encodings) {
        bilingual(e.name, `${e.id}.name`);
        bilingual(e.summary, `${e.id}.summary`);
      }
    }
  }
});

test('cada codificación disponible tiene sus dos ficheros', () => {
  for (const e of registry.allEncodings().filter((x) => x.ready)) {
    for (const dir of ['problems', 'content']) {
      assert.ok(fs.existsSync(path.join(ROOT, 'js', dir, `${e.id}.js`)), `falta js/${dir}/${e.id}.js`);
    }
  }
});

test('búsquedas del registro', () => {
  const e = registry.getEncoding('assignment-matrix');
  assert.equal(e.representation, 'integer');
  assert.equal(e.problem, 'assignment');
  assert.equal(registry.getEncoding('nope'), null);
  assert.equal(registry.isReady('nope'), false);
  assert.equal(registry.getRepresentation('real').id, 'real');
  assert.equal(registry.encodingCount(registry.getRepresentation('integer')), 2);
});
