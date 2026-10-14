'use strict';
/*
 * Estado en la URL, comprobado en un navegador real (Chromium con Playwright). No está en CI, como la
 * auditoría de accesibilidad: necesita Playwright, que no es dependencia del proyecto.
 *
 *   node tests/browser/url-state.js
 *
 * Variables opcionales: PLAYWRIGHT_MODULE (ruta al paquete playwright si no está instalado donde Node
 * lo encuentra) y CHROMIUM_PATH (ejecutable de Chromium).
 *
 * Comprueba:
 *  - los enlaces estándar ↔ Gray de «Las tres codificaciones» cambian de código (misma codificación);
 *  - editar el hash a mano en la misma codificación se aplica (paso, práctica);
 *  - la semilla 0 sobrevive a una recarga y da siempre las mismas ciudades;
 *  - el vector de reales conserva k en la URL al recargar.
 */
const path = require('node:path');
const assert = require('node:assert/strict');

let pw;
try { pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); } catch (err) {
  console.log('Playwright no está disponible: se omite la prueba en el navegador.');
  process.exit(0);
}

const PAGE = 'file://' + path.join(__dirname, '..', '..', 'index.html');
const param = (page, k) => page.evaluate((key) => new URLSearchParams(location.hash.slice(1)).get(key), k);

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check('enlace estándar → Gray en la misma codificación', async (page) => {
  await page.goto(`${PAGE}#enc=function-bits&lang=es&fn=himmelblau&v=standard&k=5&x=1111000101`);
  await page.waitForSelector('#threeTable a');
  assert.equal(await page.inputValue('#variant'), 'standard');
  const link = page.locator('#threeTable tbody tr').nth(2).locator('a');   // fila Gray
  await link.click();
  await page.waitForFunction(() => document.querySelector('#variant').value === 'gray');
  assert.equal(await param(page, 'v'), 'gray');
  // El mismo punto en Gray: 11110 (30) → 10001; 00101 (5) → 00111
  assert.equal(await param(page, 'x'), '1000100111');
});

check('hash editado a mano en la misma codificación', async (page) => {
  await page.goto(`${PAGE}#enc=knapsack-bits&lang=es&s=12345&n=8&step=0`);
  await page.waitForFunction(() => window.GAX.app.step());
  const first = await page.evaluate(() => window.GAX.app.step().type);
  const h = await page.evaluate(() => location.hash.replace(/step=\d+/, 'step=6'));
  await page.evaluate((x) => { location.hash = x; }, h);
  await page.waitForFunction((t) => window.GAX.app.step().type !== t, first);
  await page.evaluate((x) => { location.hash = x + '&practice=decode'; }, h.replace(/&practice=\w+/, ''));
  await page.waitForFunction(() => window.GAX.app.practice() === 'decode');
});

check('la semilla 0 sobrevive a la recarga (viajante)', async (page) => {
  await page.goto(`${PAGE}#enc=tsp-perm&lang=es&s=0&n=7`);
  await page.waitForSelector('#seed');
  assert.equal(await page.inputValue('#seed'), '0');
  const cities = () => page.evaluate(() => [...document.querySelectorAll('#viz circle')].map((c) => `${c.getAttribute('cx')},${c.getAttribute('cy')}`).join(' '));
  const before = await cities();
  await page.reload();
  await page.waitForSelector('#seed');
  assert.equal(await page.inputValue('#seed'), '0');
  assert.equal(await param(page, 's'), '0');
  assert.equal(await cities(), before);
});

check('el vector de reales conserva k al recargar', async (page) => {
  await page.goto(`${PAGE}#enc=function-real&lang=es&fn=himmelblau&v=clamp&k=8&x=1_2`);
  await page.waitForSelector('#threeTable');
  assert.equal(await param(page, 'k'), '8');
  await page.reload();
  await page.waitForSelector('#threeTable');
  assert.equal(await param(page, 'k'), '8');
  assert.match(await page.textContent('#threeTable'), /2\s*·\s*8|16/);
});

(async () => {
  const browser = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let failed = 0;
  for (const [name, fn] of checks) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    try {
      await fn(page);
      assert.deepEqual(errors, []);
      console.log(`ok - ${name}`);
    } catch (err) {
      failed++;
      console.log(`not ok - ${name}\n  ${String(err.message).split('\n').join('\n  ')}`);
    }
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} de ${checks.length} fallan` : `${checks.length} de ${checks.length} bien`);
  process.exit(failed ? 1 : 0);
})();
