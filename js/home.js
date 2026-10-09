/*
 * Pantalla inicial: las representaciones, sus problemas y sus codificaciones, a partir del registro.
 * Las codificaciones disponibles son enlaces (#enc=<id>); el resto aparecen como «próximamente».
 */
(function (root) {
  'use strict';

  function createHome(container, opts) {
    const registry = opts.registry;
    const t = opts.t;          // (key, params) => texto en el idioma actual
    const lang = opts.lang;    // () => 'es' | 'en'

    function node(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }

    function encItem(enc, l) {
      const li = node('li');
      const item = enc.ready ? node('a', 'op-item') : node('div', 'op-item disabled');
      if (enc.ready) item.href = `#enc=${enc.id}&lang=${l}`;
      else item.setAttribute('aria-disabled', 'true');
      const text = node('span', 'op-text');
      text.append(node('span', 'op-name', enc.name[l]), node('span', 'op-summary', enc.summary[l]));
      item.append(text);
      item.append(enc.ready ? node('span', 'op-go', '→') : node('span', 'badge-soon', t('comingSoon')));
      if (enc.ready) item.querySelector('.op-go').setAttribute('aria-hidden', 'true');
      li.append(item);
      return li;
    }

    function render() {
      const l = lang();
      container.replaceChildren(...registry.representations.map((rep) => {
        const card = node('section', 'rep-card');
        card.dataset.rep = rep.id;
        card.setAttribute('aria-labelledby', `rep-${rep.id}`);

        const head = node('div', 'rep-head');
        const h2 = node('h2', null, rep.name[l]);
        h2.id = `rep-${rep.id}`;
        const n = registry.encodingCount(rep);
        head.append(h2, node('span', 'rep-count', n === 1 ? t('encodingsCountOne') : t('encodingsCount', { n })));

        const chromo = node('div', 'chromo');
        chromo.setAttribute('aria-hidden', 'true');
        // Decimales con la coma o el punto del idioma
        rep.sample.forEach((v) => chromo.append(node('span', 'gene-mini', l === 'es' ? v.replace('.', ',') : v)));

        card.append(head, chromo, node('p', 'rep-desc', rep.desc[l]));
        rep.problems.forEach((p) => {
          card.append(node('h3', 'problem-name', p.name[l]));
          const list = node('ul', 'op-list');
          p.encodings.forEach((enc) => list.append(encItem(enc, l)));
          card.append(list);
        });
        return card;
      }));
    }

    return { render };
  }

  (root.GAX = root.GAX || {}).createHome = createHome;
})(typeof self !== 'undefined' ? self : this);
