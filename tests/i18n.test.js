'use strict';
// Los textos de la interfaz y de «Acerca de» existen en los dos idiomas, con los mismos parámetros.
const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../js/i18n.js');
global.self = global;
require('../js/about.js');
const about = global.GAX.about;

const params = (s) => (s.match(/\{(\w+)\}/g) || []).sort().join(',');

function sameShape(a, b, where) {
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort(), `${where}: claves distintas`);
  for (const k of Object.keys(a)) {
    if (typeof a[k] === 'string') {
      assert.ok(a[k].trim() && b[k].trim(), `${where}.${k} vacío`);
      assert.equal(params(a[k]), params(b[k]), `${where}.${k}: parámetros distintos`);
    } else sameShape(a[k], b[k], `${where}.${k}`);
  }
}

test('mismas claves y parámetros en ES y EN (interfaz)', () => sameShape(i18n.dict.es, i18n.dict.en, 'i18n'));
test('mismas claves en ES y EN («Acerca de» y pie)', () => sameShape(about.text.es, about.text.en, 'about'));

test('t sustituye parámetros y recurre al español si falta una clave', () => {
  assert.equal(i18n.t('en', 'encodingsCount', { n: 3 }), '3 encodings');
  assert.equal(i18n.t('fr', 'comingSoon'), 'Próximamente');
  assert.equal(i18n.t('es', 'noSuchKey'), 'noSuchKey');
});

test('las herramientas hermanas enlazan a la serie con el idioma', () => {
  for (const k of ['selection', 'crossover', 'mutation']) {
    assert.match(about.sisterUrl('en', k), new RegExp(`^https://josemagalan\\.github\\.io/${k}-ga/#lang=en$`));
  }
});
