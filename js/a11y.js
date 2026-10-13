/*
 * Accesibilidad que depende de cómo queda la página una vez dibujada:
 * - Una zona con desplazamiento horizontal (figura, tabla, fórmula en pantalla estrecha) solo se
 *   puede recorrer con el teclado si recibe el foco. Se le da tabindex="0", role="group" y un
 *   nombre únicamente cuando de verdad desborda; si cabe, no añade una parada de tabulación inútil.
 * - La figura principal (#viz) es una imagen (role="img") mientras no tiene nada con lo que
 *   interactuar; si contiene genes, ciudades o el punto como botones, pasa a ser un grupo
 *   (role="group"), porque una imagen no puede contener controles.
 * Funciona en el navegador (window.GAX.a11y); en Node solo expone las funciones puras.
 */
(function (root) {
  'use strict';

  const SCROLLERS = '.viz-scroll, .table-scroll, .cmp-scroll, .formula-math, .moodle-preview, pre.code';

  // ¿Desborda en horizontal? (1 px de margen por el redondeo de las fuentes)
  const overflows = (sw, cw) => sw > cw + 1;

  // Papel de la figura: imagen si no hay nada enfocable dentro, grupo si lo hay.
  const vizRole = (hasFocusable) => (hasFocusable ? 'group' : 'img');

  function update(doc, label) {
    doc.querySelectorAll(SCROLLERS).forEach((n) => {
      if (n.matches('pre.code')) return; // el bloque de código ya es enfocable siempre
      if (overflows(n.scrollWidth, n.clientWidth)) {
        if (n.getAttribute('tabindex') !== '0') n.setAttribute('tabindex', '0');
        if (!n.hasAttribute('role')) n.setAttribute('role', 'group');
        if (n.getAttribute('aria-label') !== label) n.setAttribute('aria-label', label);
        n.dataset.a11yScroll = '1';
      } else if (n.dataset.a11yScroll) {
        n.removeAttribute('tabindex');
        if (n.getAttribute('role') === 'group') n.removeAttribute('role');
        n.removeAttribute('aria-label');
        delete n.dataset.a11yScroll;
      }
    });
    const viz = doc.getElementById('viz');
    if (viz) {
      const role = vizRole(!!viz.querySelector('[tabindex]'));
      if (viz.getAttribute('role') !== role) viz.setAttribute('role', role);
    }
  }

  // Observa los cambios de la página y del tamaño de la ventana; `label()` da el nombre de las zonas
  // desplazables en el idioma actual.
  function watch(doc, label) {
    let pending = false;
    const run = () => {
      pending = false;
      update(doc, label());
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      (root.requestAnimationFrame || setTimeout)(run);
    };
    new root.MutationObserver(schedule).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'viewBox'] });
    root.addEventListener('resize', schedule);
    schedule();
    return schedule;
  }

  const api = { SCROLLERS, overflows, vizRole, update, watch };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).a11y = api;
})(typeof self !== 'undefined' ? self : this);
