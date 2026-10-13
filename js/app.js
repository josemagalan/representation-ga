/*
 * Controlador de la página: enrutado (inicio / codificación / acerca de), reproductor, etapas,
 * formalización, narración, idioma y URL. Lo propio de cada codificación (controles, tarjetas
 * extra, vista D3 y parámetros de la URL) está en js/ui/<id>.js.
 *
 * URL: #lang=es                          → pantalla inicial
 *      #enc=<id>&lang=es&…&step=…        → página de una codificación (el resto, según js/ui/<id>.js)
 *      …&practice=<tipo>                  → la misma página en modo práctica (js/practice.js)
 *      #cmp=assignment|function&…         → comparar codificaciones (js/compare-view.js)
 *      #page=moodle&lang=es              → bancos de preguntas para Moodle (js/moodle-page.js)
 *      #page=about&lang=es               → acerca de
 * También se acepta ?lang=es en la dirección, como en el portal de la serie.
 */
(function () {
  'use strict';
  const G = window.GAX;
  const { rng: R, i18n, registry, createHome, createLearnPanel, practice: PR } = G;

  const $ = (id) => document.getElementById(id);
  const el = {
    homeView: $('homeView'), repGrid: $('repGrid'), encView: $('encView'),
    aboutView: $('aboutView'), aboutBody: $('aboutBody'), siteFoot: $('siteFoot'), cmpView: $('cmpView'),
    moodleView: $('moodleView'), moodleBody: $('moodleBody'), moodleLink: $('moodleLink'),
    encEyebrow: $('encEyebrow'), encTitle: $('encTitle'), encSubtitle: $('encSubtitle'),
    encControls: $('encControls'), encExtra: $('encExtra'),
    stageStrip: $('stageStrip'), formulaCard: $('formulaCard'), formulaRows: $('formulaRows'), formulaInstance: $('formulaInstance'),
    viz: $('viz'), vizLabel: $('vizLabel'), editHint: $('editHint'),
    btnReset: $('btnReset'), btnPrev: $('btnPrev'), btnPlay: $('btnPlay'), btnNext: $('btnNext'),
    counter: $('stepCounter'), barFill: $('barFill'), speed: $('speed'), speedOut: $('speedOut'),
    narration: $('narration'), legend: $('legend'),
    playerBox: $('playerBox'), narrationBox: $('narrationBox'), btnPractice: $('btnPractice'), practiceCard: $('practiceCard'),
  };

  const fromQuery = new URLSearchParams(location.search).get('lang');
  const state = {
    lang: i18n.languages.indexOf(fromQuery) !== -1 ? fromQuery
      : (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es',
    view: 'home',
    encId: null,
    ui: null,
    result: null, step: 0, playing: false, timer: null, speed: 1,
    practice: null,   // tipo de ejercicio mientras se practica (null: paso a paso)
    ex: null,         // ejercicio de js/practice.js
    prStep: null,     // paso que dibuja la vista mientras se practica
    prRoute: null,    // circuito que va marcando el estudiante (viajante)
  };

  // ---------- Textos y números ----------

  const locale = () => (state.lang === 'es' ? 'es-ES' : 'en-GB');
  const fmt = (v) => (typeof v === 'number' ? v.toLocaleString(locale(), { maximumFractionDigits: 2 }) : v);
  const fmtFixed = (v, d) => v.toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });
  const DRAW_PARAMS = ['r'];
  const FIXED2 = ['ratio'];
  const FIXED1 = ['d', 'len', 'opt'];
  const SIG2 = ['share'];   // porcentajes que pueden ser minúsculos (factibles de la matriz)
  const fill = (s, params) => (params ? s.replace(/\{(\w+)\}/g, (m, p) => {
    const v = params[p];
    if (v == null) return m;
    const own = state.ui && state.view === 'enc' && state.ui.formatParam ? state.ui.formatParam(p, v) : null;
    if (own != null) return own;
    if (typeof v === 'number') {
      if (DRAW_PARAMS.indexOf(p) !== -1 || FIXED2.indexOf(p) !== -1) return fmtFixed(v, 2);
      if (FIXED1.indexOf(p) !== -1 && state.encId === 'tsp-perm') return fmtFixed(v, 1);
      if (SIG2.indexOf(p) !== -1) return v.toLocaleString(locale(), { maximumSignificantDigits: 2 });
    }
    return fmt(v);
  }) : s);
  const t = (key, params) => fill(i18n.t(state.lang, key), params);

  const content = () => G.content[state.encId];
  const meta = () => registry.getEncoding(state.encId);

  function tEnc(key, params) {
    const c = state.encId && content();
    const table = c && c.narration && (c.narration[state.lang] || c.narration.es);
    return table && table[key] != null ? fill(table[key], params) : t(key, params);
  }

  const home = createHome(el.repGrid, { registry, t, lang: () => state.lang });
  const moodlePage = G.moodlePage.createMoodlePage();
  const cmpPage = G.createComparePage({ root: el.cmpView, t, lang: () => state.lang, onChange: () => writeHash() });
  let learn = null;

  // ---------- Modelo ----------

  const baseStep = () => state.result && state.result.steps[state.step];
  /** Paso que se dibuja: el del paso a paso o, practicando, el del ejercicio. */
  const curStep = () => (state.practice && state.prStep ? state.prStep : baseStep());

  function recompute(stepMode) {
    const prev = baseStep();
    state.result = state.ui.run();
    if (state.practice) buildExercise();
    const steps = state.result.steps;
    if (stepMode === 'start') state.step = 0;
    else if (stepMode === 'end') state.step = steps.length - 1;
    else if (stepMode === 'keepType' && prev) {
      const k = steps.findIndex((s) => s.type === prev.type);
      state.step = k >= 0 && prev.stage < 4 ? k : Math.min(state.step, steps.length - 1);
    } else state.step = Math.min(state.step, steps.length - 1);
    learn.setVariant(state.ui.variant());
    renderLegend();
    renderAll(false);
  }

  // ---------- Practicar ----------

  const samePage = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /** Ejercicio sobre la página actual (con el tratamiento o el cromosoma que pida el tipo). */
  function buildExercise() {
    let ex = PR.exercise(state.encId, state.practice, state.ui.getPage());
    if (!samePage(ex.page, state.ui.getPage())) {
      state.ui.setPage(ex.page);
      state.result = state.ui.run();
      ex = PR.exercise(state.encId, state.practice, state.ui.getPage());
    }
    state.ex = ex;
    state.prRoute = null;
    state.prStep = practiceStep();
    panel.render(ex, PR.typesFor(state.encId));
  }

  function practiceStep() {
    const ex = state.ex;
    const steps = state.result.steps;
    const base = steps.find((s) => s.type === ex.view.type) || steps[steps.length - 1];
    return Object.assign({}, base, {
      practice: true, hideGenes: !!ex.view.hideGenes,
      focus: [], cells: [], changed: [], skipped: [], removed: [], cliff: null, neighbours: null, active: null,
      treated: null, result: null, pickCities: !!ex.view.route, userRoute: ex.view.route ? (state.prRoute || []) : null,
    });
  }

  function solutionIndex() {
    const steps = state.result.steps;
    const sol = state.ex.solution;
    if (sol.last) return steps.length - 1;
    const k = steps.findIndex((s) => sol.types.indexOf(s.type) !== -1);
    return k >= 0 ? k : steps.length - 1;
  }

  function setPracticeView(on) {
    el.playerBox.hidden = on;
    el.narrationBox.hidden = on;
    el.encExtra.hidden = on;          // las tablas de la página darían la respuesta
    el.practiceCard.hidden = !on;
    el.btnPractice.textContent = t(on ? 'exitPractice' : 'practiceMode');
    el.btnPractice.setAttribute('aria-pressed', String(on));
  }

  function enterPractice(type) {
    stop();
    state.practice = type;
    setPracticeView(true);
    recompute('keep');
  }

  function exitPractice(toSolution) {
    const idx = toSolution && state.ex ? solutionIndex() : null;
    state.practice = null;
    state.ex = null;
    state.prStep = null;
    setPracticeView(false);
    if (idx != null) state.step = idx;
    renderAll(false);
    if (toSolution) el.viz.scrollIntoView({ block: 'nearest' });
  }

  const panel = G.createPracticePanel({
    root: el.practiceCard, t, lang: () => state.lang,
    onType(type) { state.practice = type; recompute('keep'); },
    onNew() {
      state.ui.setPage(PR.newPage(state.encId, state.practice, R.newSeed() % 1000000, state.ui.getPage()));
      recompute('start');
    },
    onSolution: () => exitPractice(true),
    onRoute(route) {
      state.prRoute = route;
      if (state.practice && state.prStep && state.ex.view.route) {
        state.prStep = Object.assign({}, state.prStep, { userRoute: route || [] });
        state.ui.view.show(state.prStep, { animate: false });
      }
    },
  });

  el.btnPractice.addEventListener('click', () => {
    if (state.practice) exitPractice(false);
    else enterPractice(PR.typesFor(state.encId)[0]);
  });

  // ---------- Pintado ----------

  function renderStageStrip() {
    const s = curStep();
    el.stageStrip.replaceChildren(...[1, 2, 3, 4, 5].map((k) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'stage-btn' + (k === s.stage ? ' current' : k < s.stage ? ' done' : '');
      if (k === s.stage) b.setAttribute('aria-current', 'step');
      const num = document.createElement('span');
      num.className = 'stage-num';
      num.textContent = k;
      b.append(num, document.createTextNode(` ${t(`stage${k}`)}`));
      b.disabled = !!state.practice;
      b.addEventListener('click', () => { if (state.practice) return; stop(); goTo(state.result.steps.findIndex((st) => st.stage === k), true); });
      li.append(b);
      return li;
    }));
  }

  function renderFormula() {
    const s = curStep();
    const c = content();
    const order = c.formalization.rows.map((r) => r.id);
    const reached = s.stage > 2 ? order.length : (s.formula ? order.indexOf(s.formula) + 1 : 0);
    el.formulaCard.hidden = s.stage < 2;
    const arg = state.ui.formulaArg ? state.ui.formulaArg() : '';
    const key = `${state.encId}:${state.lang}:${arg}`;
    if (el.formulaRows.dataset.key !== key) {
      el.formulaRows.replaceChildren(...c.formalization.rows.map((r) => {
        const row = document.createElement('div');
        row.className = 'formula-row';
        row.dataset.part = r.id;
        const lab = document.createElement('span');
        lab.className = 'formula-label';
        lab.textContent = r.label[state.lang];
        const m = document.createElement('span');
        m.className = 'formula-math';
        // MathML fijo del contenido docente (o que depende de la instancia, p. ej. de la función)
        m.innerHTML = typeof r.math === 'function' ? r.math(state.lang, arg) : ((state.lang === 'en' && r.mathEn) || r.math);
        row.append(lab, m);
        return row;
      }));
      el.formulaRows.dataset.key = key;
    }
    Array.from(el.formulaRows.children).forEach((row, i) => {
      row.classList.toggle('current', row.dataset.part === s.formula);
      row.classList.toggle('pending', i >= reached);
    });
    el.formulaInstance.hidden = reached < order.length;
    el.formulaInstance.textContent = state.ui.formulaInstance ? state.ui.formulaInstance(state.result) : '';
  }

  function renderLegend() {
    el.legend.replaceChildren(...state.ui.legend().map(([cls, key]) => {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = `sw ${cls}`;
      sw.setAttribute('aria-hidden', 'true');
      li.append(sw, document.createTextNode(t(key)));
      return li;
    }));
  }

  function renderPlayer() {
    const n = state.result.steps.length;
    el.counter.textContent = t('stepCounter', { i: state.step + 1, n });
    el.barFill.style.width = `${(100 * (state.step + 1)) / n}%`;
    el.btnPrev.disabled = state.step === 0;
    el.btnReset.disabled = state.step === 0;
    el.btnNext.disabled = state.step >= n - 1;
    el.btnPlay.classList.toggle('playing', state.playing);
    const key = state.playing ? 'pause' : 'play';
    el.btnPlay.title = t(key);
    el.btnPlay.setAttribute('aria-label', t(key));
  }

  function renderAll(animate) {
    const s = curStep();
    state.ui.view.show(s, { animate, duration: 320 / state.speed });
    renderStageStrip();
    renderFormula();
    if (state.practice) {
      el.editHint.hidden = false;
      el.editHint.textContent = t('practiceHint');
    } else {
      el.narration.textContent = tEnc(s.text.key, s.text.params);
      renderPlayer();
      el.editHint.hidden = s.stage < 3;
      el.editHint.textContent = t(state.ui.editHintKey || 'editHint');
    }
    learn.setStep(s);
    writeHash();
  }

  function renderEncHeader() {
    const m = meta();
    const rep = registry.getRepresentation(m.representation);
    const prob = rep.problems.find((p) => p.id === m.problem);
    el.encEyebrow.textContent = t('repOf', { name: rep.name[state.lang].toLowerCase() });
    el.encTitle.textContent = prob.name[state.lang];
    el.encSubtitle.textContent = `${m.name[state.lang]}. ${m.summary[state.lang]}`;
    el.vizLabel.textContent = t('svgLabel', { name: prob.name[state.lang] });
    document.title = t('encTitleDoc', { name: prob.name[state.lang] });
  }

  // ---------- Reproductor ----------

  function goTo(i, animate) {
    const n = state.result.steps.length;
    state.step = Math.max(0, Math.min(n - 1, i));
    renderAll(animate);
  }
  function next() { if (state.step < state.result.steps.length - 1) goTo(state.step + 1, true); else stop(); }
  function prev() { stop(); goTo(state.step - 1, false); }
  function reset() { stop(); goTo(0, false); }
  function play() {
    if (state.step >= state.result.steps.length - 1) goTo(0, false);
    state.playing = true;
    renderPlayer();
    const tick = () => {
      if (!state.playing) return;
      next();
      if (state.playing) state.timer = setTimeout(tick, 1700 / state.speed);
    };
    state.timer = setTimeout(tick, 900 / state.speed);
  }
  function stop() {
    state.playing = false;
    clearTimeout(state.timer);
    if (state.result && state.view === 'enc') renderPlayer();
  }
  function togglePlay() { if (state.playing) stop(); else play(); }

  el.btnReset.addEventListener('click', reset);
  el.btnPrev.addEventListener('click', prev);
  el.btnNext.addEventListener('click', () => { stop(); next(); });
  el.btnPlay.addEventListener('click', togglePlay);
  el.speed.addEventListener('input', () => {
    state.speed = Number(el.speed.value);
    el.speedOut.textContent = `${fmt(state.speed)}×`;
  });

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
    el.speedOut.textContent = `${fmt(state.speed)}×`;
    el.btnPractice.textContent = t(state.practice ? 'exitPractice' : 'practiceMode');
    $('moodleLink').href = `#page=moodle&lang=${state.lang}`;
    if (state.view === 'moodle') {
      moodlePage.render(el.moodleBody, state.lang);
    } else if (state.view === 'cmp') {
      cmpPage.render();
    } else if (state.view === 'about') {
      document.title = `${G.about.text[state.lang].title} · ${t('brand')}`;
      G.about.renderAbout(el.aboutBody, state.lang);
    } else if (state.view === 'enc') {
      renderEncHeader();
      state.ui.onLanguage();
      if (state.practice) panel.refresh();
      learn.refresh();
      renderLegend();
      renderAll(false);
    } else {
      document.title = t('homeTitleDoc');
      home.render();
    }
    writeHash();
  }

  // ---------- Enrutado ----------

  function showOnly(which) {
    el.homeView.hidden = which !== 'home';
    el.encView.hidden = which !== 'enc';
    el.aboutView.hidden = which !== 'about';
    el.cmpView.hidden = which !== 'cmp';
    el.moodleView.hidden = which !== 'moodle';
  }

  function show(which) {
    stop();
    const changed = state.view !== which;
    state.view = which;
    showOnly(which);
    if (changed) window.scrollTo(0, 0);
  }

  function showEnc(id, q) {
    const same = id === state.encId && state.view === 'enc' && state.result;
    show('enc');
    if (same) return;
    state.encId = id;
    state.result = null;
    const pr = q.get('practice');
    state.practice = PR.typesFor(id).indexOf(pr) !== -1 ? pr : null;
    state.ex = null;
    state.prStep = null;
    setPracticeView(!!state.practice);
    state.ui = G.encodingUI[id]({
      P: G.problems[id], content: content(), t, fmt, R,
      lang: () => state.lang,
      controlsEl: el.encControls, extraEl: el.encExtra, svg: el.viz,
      onChange: (mode) => recompute(mode),
      stop,
      currentStep: baseStep,
      onCity: (c) => { if (state.practice) panel.addCity(c); },
    });
    if (!learn) learn = createLearnPanel({ content: content(), t, lang: () => state.lang });
    learn.setContent(content(), state.ui.variant());
    state.ui.init(q);
    state.step = Math.max(0, Math.floor(Number(q.get('step')) || 0));
    recompute('keep');
    window.scrollTo(0, 0);
  }

  function route() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    const id = q.get('enc');
    const cmp = q.get('cmp');
    if (cmp && G.compare.PROBLEMS[cmp]) {
      show('cmp');
      cmpPage.show(q);
    } else if (id && registry.isReady(id) && G.problems && G.problems[id] && G.content[id] && G.encodingUI && G.encodingUI[id]) showEnc(id, q);
    else if (q.get('page') === 'about') show('about');
    else if (q.get('page') === 'moodle') show('moodle');
    else show('home');
    applyLanguage();
  }

  // Guarda el estado en la URL sin crear entradas de historial (para proyectar o compartir).
  function writeHash() {
    const params = new URLSearchParams();
    if (state.view === 'about') params.set('page', 'about');
    if (state.view === 'moodle') params.set('page', 'moodle');
    if (state.view === 'cmp') cmpPage.hash().forEach(([k, v]) => params.set(k, v));
    if (state.view === 'enc' && state.result) {
      params.set('enc', state.encId);
      params.set('lang', state.lang);
      state.ui.hash().forEach(([k, v]) => params.set(k, v));
      params.set('step', String(state.step));
      if (state.practice) params.set('practice', state.practice);
    } else if (state.view !== 'cmp') params.set('lang', state.lang);
    const h = params.toString();
    if (location.hash.replace(/^#/, '') === h) return;
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang;
    applyLanguage();
  }));

  // Enlaces a la pantalla inicial conservando el idioma
  [$('brandLink'), $('backLink'), $('aboutBack'), $('moodleBack')].forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `lang=${state.lang}`;
  }));

  document.addEventListener('keydown', (e) => {
    if (state.view !== 'enc' || state.practice) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    // En una zona desplazable con el foco (código, figura o tabla que no cabe), las flechas e Inicio desplazan
    const scroller = tag === 'pre' || (e.target.dataset && e.target.dataset.a11yScroll);
    if (scroller && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' && tag !== 'button' && tag !== 'summary' && tag !== 'a' && !(e.target.closest && e.target.closest('.gene-btn'))) { e.preventDefault(); togglePlay(); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });

  window.addEventListener('hashchange', route);

  // Solo lectura, para comprobar la página desde fuera (pruebas en el navegador)
  G.app = { exercise: () => state.ex, step: () => curStep(), practice: () => state.practice };

  // ---------- Arranque ----------
  route();
  G.a11y.watch(document, () => t('scrollRegion'));
})();
