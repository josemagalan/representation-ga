/*
 * Controlador de la página: enrutado, idioma y URL.
 *
 * URL: #lang=es                  → pantalla inicial
 *      #enc=<id>&lang=es         → página de una codificación (a partir del piloto de la mochila)
 *      #page=about&lang=es       → acerca de
 * También se acepta ?lang=es en la dirección, como en el portal de la serie.
 */
(function () {
  'use strict';
  const G = window.GAX;
  const { i18n, registry, createHome } = G;

  const $ = (id) => document.getElementById(id);
  const el = {
    homeView: $('homeView'), repGrid: $('repGrid'),
    aboutView: $('aboutView'), aboutBody: $('aboutBody'), siteFoot: $('siteFoot'),
  };

  const fromQuery = new URLSearchParams(location.search).get('lang');
  const state = {
    lang: i18n.languages.indexOf(fromQuery) !== -1 ? fromQuery
      : (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es',
    view: 'home',
  };

  const t = (key, params) => i18n.t(state.lang, key, params);
  const home = createHome(el.repGrid, { registry, t, lang: () => state.lang });

  // ---------- Idioma ----------

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    $('portalLink').href = 'https://josemagalan.github.io/genetic-algorithms-lab/?lang=' + state.lang;
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => node.setAttribute('aria-label', t(node.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
      node.setAttribute('aria-label', t(node.dataset.i18nTitle));
    });
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    G.about.renderFooter(el.siteFoot, state.lang);
    $('sisterSelection').href = G.about.sisterUrl(state.lang, 'selection');
    $('sisterCrossover').href = G.about.sisterUrl(state.lang, 'crossover');
    $('sisterMutation').href = G.about.sisterUrl(state.lang, 'mutation');
    if (state.view === 'about') {
      document.title = `${G.about.text[state.lang].title} · ${t('brand')}`;
      G.about.renderAbout(el.aboutBody, state.lang);
    } else {
      document.title = t('homeTitleDoc');
      home.render();
    }
    writeHash();
  }

  // ---------- Enrutado ----------

  function showOnly(which) {
    el.homeView.hidden = which !== 'home';
    el.aboutView.hidden = which !== 'about';
  }

  function show(view) {
    const changed = state.view !== view;
    state.view = view;
    showOnly(view);
    if (changed) window.scrollTo(0, 0);
  }

  function route() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    if (q.get('page') === 'about') show('about');
    else show('home');   // las codificaciones aún no disponibles vuelven a la pantalla inicial
    applyLanguage();
  }

  // Guarda el estado en la URL sin crear entradas de historial (para proyectar o compartir).
  function writeHash() {
    const params = new URLSearchParams();
    if (state.view === 'about') params.set('page', 'about');
    params.set('lang', state.lang);
    const h = params.toString();
    if (location.hash.replace(/^#/, '') === h) return;
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang;
    applyLanguage();
  }));

  // Enlaces a la pantalla inicial conservando el idioma
  [$('brandLink'), $('aboutBack')].forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `lang=${state.lang}`;
  }));

  window.addEventListener('hashchange', route);

  // ---------- Arranque ----------
  route();
})();
