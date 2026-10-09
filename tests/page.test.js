'use strict';
// Coherencia entre index.html y el código: todos los scripts existen y se cargan, y todas las claves
// de texto e ids de elementos que usa el código están en la página.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const i18n = require('../js/i18n.js');

const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));

test('cada <script> de index.html existe', () => {
  for (const s of scripts) assert.ok(fs.existsSync(path.join(ROOT, s)), `no existe ${s}`);
});

test('cada fichero de js/ se carga desde index.html', () => {
  const files = walk(path.join(ROOT, 'js')).map((f) => path.relative(ROOT, f).split(path.sep).join('/'));
  for (const f of files) assert.ok(scripts.includes(f), `${f} no está en index.html`);
});

test('D3 se carga antes que el código y app.js el último', () => {
  assert.equal(scripts[0], 'vendor/d3.min.js');
  assert.equal(scripts[scripts.length - 1], 'js/app.js');
});

test('cada data-i18n de la página tiene texto', () => {
  for (const m of html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)) {
    assert.ok(i18n.dict.es[m[1]] != null, `falta la clave ${m[1]}`);
  }
});

test('cada id que usa app.js existe en la página', () => {
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  for (const m of app.matchAll(/\$\('([\w-]+)'\)/g)) assert.match(html, new RegExp(`id="${m[1]}"`), `falta #${m[1]}`);
});

test('el bloque de licencias y créditos está presente', () => {
  for (const f of ['LICENSE', 'LICENSE-CONTENT.md', 'vendor/d3-LICENSE', '.nojekyll']) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
});
