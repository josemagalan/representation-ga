/*
 * Controlador de la página: enrutado (inicio / codificación / acerca de), estado, controles,
 * reproductor, idioma y URL.
 *
 * URL: #lang=es                  → pantalla inicial
 *      #enc=knapsack-bits&lang=es&v=…&l=…&r=…&s=…&w=…&val=…&W=…&x=…&step=…
 *                                → página de una codificación
 *        (v: tratamiento; l: λ de la penalización; r: semilla del sorteo de la reparación aleatoria;
 *         s: semilla de la instancia; w, val: pesos y valores; W: capacidad; x: cromosoma; step: paso)
 *      #page=about&lang=es       → acerca de
 * También se acepta ?lang=es en la dirección, como en el portal de la serie.
 */
(function () {
  'use strict';
  const G = window.GAX;
  const { rng: R, i18n, registry, createHome, createLearnPanel, createKnapsackView } = G;

  const $ = (id) => document.getElementById(id);
  const el = {
    homeView: $('homeView'), repGrid: $('repGrid'), encView: $('encView'),
    aboutView: $('aboutView'), aboutBody: $('aboutBody'), siteFoot: $('siteFoot'),
    encEyebrow: $('encEyebrow'), encTitle: $('encTitle'), encSubtitle: $('encSubtitle'),
    nItems: $('nItems'), nItemsOut: $('nItemsOut'), seed: $('seed'),
    capacity: $('capacity'), capacityOut: $('capacityOut'),
    variant: $('variant'), variantDesc: $('variantDesc'),
    lambdaField: $('lambdaField'), lambda: $('lambda'), lambdaOut: $('lambdaOut'), rhoHint: $('rhoHint'),
    btnInstance: $('btnInstance'), btnChromosome: $('btnChromosome'), btnDraw: $('btnDraw'),
    manualForm: $('manualForm'), inW: $('inW'), inV: $('inV'), inCap: $('inCap'), inX: $('inX'), err: $('err'),
    stageStrip: $('stageStrip'), formulaCard: $('formulaCard'), formulaRows: $('formulaRows'), formulaInstance: $('formulaInstance'),
    vizLabel: $('vizLabel'), editHint: $('editHint'),
    btnReset: $('btnReset'), btnPrev: $('btnPrev'), btnPlay: $('btnPlay'), btnNext: $('btnNext'),
    counter: $('stepCounter'), barFill: $('barFill'), speed: $('speed'), speedOut: $('speedOut'),
    narration: $('narration'), legend: $('legend'), treatTable: $('treatTable'),
  };

  const fromQuery = new URLSearchParams(location.search).get('lang');
  const state = {
    lang: i18n.languages.indexOf(fromQuery) !== -1 ? fromQuery
      : (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es',
    view: 'home',
    encId: null,
    seed: 1, n: 8, inst: null, x: null,
    variant: 'penalty-linear', lambda: 1, draw: 1,
    result: null, step: 0, playing: false, timer: null, speed: 1, errKey: null,
  };

  // ---------- Textos y números ----------

  const locale = () => (state.lang === 'es' ? 'es-ES' : 'en-GB');
  const fmt = (v) => (typeof v === 'number' && !Number.isInteger(v)
    ? v.toLocaleString(locale(), { maximumFractionDigits: 2 })
    : (typeof v === 'number' ? v.toLocaleString(locale(), { useGrouping: false }) : v));
  const fmtDraw = (v) => v.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const DRAW_PARAMS = ['r'];
  const FIXED2 = ['ratio'];
  const fill = (s, params) => (params ? s.replace(/\{(\w+)\}/g, (m, p) => {
    if (params[p] == null) return m;
    if (DRAW_PARAMS.indexOf(p) !== -1 && typeof params[p] === 'number') return fmtDraw(params[p]);
    if (FIXED2.indexOf(p) !== -1 && typeof params[p] === 'number') return params[p].toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return fmt(params[p]);
  }) : s);
  const t = (key, params) => fill(i18n.t(state.lang, key), params);

  const P = () => G.problems[state.encId];
  const content = () => G.content[state.encId];
  const meta = () => registry.getEncoding(state.encId);
  const isPenalty = () => state.variant.startsWith('penalty');

  function tEnc(key, params) {
    const c = state.encId && content();
    const table = c && c.narration && (c.narration[state.lang] || c.narration.es);
    return table && table[key] != null ? fill(table[key], params) : t(key, params);
  }

  const home = createHome(el.repGrid, { registry, t, lang: () => state.lang });
  let view = null;
  let learn = null;

  // ---------- Modelo ----------

  function generate(seed, n) {
    state.seed = seed;
    state.n = n;
    state.inst = P().randomInstance(seed, n);
    state.x = P().randomChromosome(seed, n);
  }

  function recompute(stepMode) {
    const prev = state.result && state.result.steps[state.step];
    state.result = P().run(state.inst, state.x, { variant: state.variant, lambda: state.lambda, seed: state.draw });
    const steps = state.result.steps;
    if (stepMode === 'start') state.step = 0;
    else if (stepMode === 'end') state.step = steps.length - 1;
    else if (stepMode === 'keepType' && prev) {
      const k = steps.findIndex((s) => s.type === prev.type);
      state.step = k >= 0 && prev.stage < 4 ? k : Math.min(state.step, steps.length - 1);
    } else state.step = Math.min(state.step, steps.length - 1);
    view.setProblem(state.inst);
    renderAll(false);
  }

  // ---------- Pintado ----------

  const curStep = () => state.result.steps[state.step];

  function renderStageStrip() {
    const s = curStep();
    const items = [1, 2, 3, 4, 5].map((k) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'stage-btn' + (k === s.stage ? ' current' : k < s.stage ? ' done' : '');
      if (k === s.stage) b.setAttribute('aria-current', 'step');
      const num = document.createElement('span');
      num.className = 'stage-num';
      num.textContent = k;
      b.append(num, document.createTextNode(` ${t(`stage${k}`)}`));
      b.addEventListener('click', () => {
        stop();
        goTo(state.result.steps.findIndex((st) => st.stage === k), true);
      });
      li.append(b);
      return li;
    });
    el.stageStrip.replaceChildren(...items);
  }

  function renderFormula() {
    const s = curStep();
    const c = content();
    const order = c.formalization.rows.map((r) => r.id);
    const reached = s.stage > 2 ? order.length : (s.formula ? order.indexOf(s.formula) + 1 : 0);
    el.formulaCard.hidden = s.stage < 2;
    if (!el.formulaRows.childElementCount || el.formulaRows.dataset.lang !== state.lang) {
      el.formulaRows.replaceChildren(...c.formalization.rows.map((r) => {
        const row = document.createElement('div');
        row.className = 'formula-row';
        row.dataset.part = r.id;
        const lab = document.createElement('span');
        lab.className = 'formula-label';
        lab.textContent = r.label[state.lang];
        const m = document.createElement('span');
        m.className = 'formula-math';
        m.innerHTML = r.math;   // MathML fijo del contenido docente
        row.append(lab, m);
        return row;
      }));
      el.formulaRows.dataset.lang = state.lang;
    }
    Array.from(el.formulaRows.children).forEach((row, i) => {
      row.classList.toggle('current', row.dataset.part === s.formula);
      row.classList.toggle('pending', i >= reached);
    });
    const st = state.result.stats;
    el.formulaInstance.hidden = reached < order.length;
    el.formulaInstance.textContent = t('formulaInstance', { n: state.inst.weights.length, W: state.inst.capacity, total: st.total, feasible: st.feasible, opt: st.optimum });
  }

  function renderLegend() {
    const items = [['sw-p1', 'legendIn'], ['sw-gene-one', 'legendGeneOne'], ['sw-gene-zero', 'legendGeneZero'], ['sw-excess', 'legendExcess']];
    if (state.variant.startsWith('repair')) items.push(['sw-mut', 'legendChanged']);
    if (state.variant === 'decoder') items.push(['sw-skipped', 'legendSkipped']);
    el.legend.replaceChildren(...items.map(([cls, key]) => {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = `sw ${cls}`;
      sw.setAttribute('aria-hidden', 'true');
      li.append(sw, document.createTextNode(t(key)));
      return li;
    }));
  }

  function renderTreatTable() {
    const c = content();
    const head = document.createElement('tr');
    ['colTreatment', 'colSolution', 'colWeight', 'colValue', 'colFitness'].forEach((k) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = t(k);
      head.append(th);
    });
    const thead = document.createElement('thead');
    thead.append(head);
    const tbody = document.createElement('tbody');
    P().VARIANTS.forEach((v) => {
      const ev = P().evaluate(state.inst, state.x, v, { lambda: state.lambda, seed: state.draw });
      const tr = document.createElement('tr');
      if (v === state.variant) { tr.className = 'current'; tr.setAttribute('aria-current', 'true'); }
      const name = document.createElement('th');
      name.scope = 'row';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'link-btn';
      btn.textContent = c.variants[v].name[state.lang];
      btn.addEventListener('click', () => { stop(); state.variant = v; syncControls(); recompute('keepType'); });
      name.append(btn);
      const sol = document.createElement('td');
      sol.className = 'mono';
      ev.solution.forEach((b, i) => {
        const span = document.createElement('span');
        span.textContent = b;
        if (b !== state.x[i]) span.className = 'bit-changed';
        sol.append(span);
      });
      const feasible = ev.weight <= state.inst.capacity;
      const cells = [sol, fmt(ev.weight) + (feasible ? '' : ` (${t('infeasibleMark')})`), fmt(ev.value), fmt(Math.round(ev.fitness * 100) / 100)];
      tr.append(name, ...cells.map((x, k) => {
        if (k === 0) return x;
        const td = document.createElement('td');
        td.className = 'num' + (k === 1 && !feasible ? ' over' : '');
        td.textContent = x;
        return td;
      }));
      tbody.append(tr);
    });
    el.treatTable.replaceChildren(thead, tbody);
  }

  function renderNarration() {
    const s = curStep();
    el.narration.textContent = tEnc(s.text.key, s.text.params);
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
    view.show(s, { animate, duration: 320 / state.speed });
    renderStageStrip();
    renderFormula();
    renderNarration();
    renderPlayer();
    el.editHint.hidden = s.stage < 3;
    learn.setStep(s);
    writeHash();
  }

  function renderEncHeader() {
    const m = meta();
    const rep = registry.getRepresentation(m.representation);
    const prob = rep.problems.find((p) => p.id === m.problem);
    el.encEyebrow.textContent = t('repOf', { name: rep.name[state.lang].toLowerCase() });
    el.encTitle.textContent = prob.name[state.lang];
    el.encSubtitle.textContent = `${m.name[state.lang]}: ${m.summary[state.lang]}`;
    el.vizLabel.textContent = t('svgLabel', { name: prob.name[state.lang] });
    document.title = t('encTitleDoc', { name: prob.name[state.lang] });
  }

  function syncControls() {
    const c = content();
    const S = state.inst.weights.reduce((a, b) => a + b, 0);
    el.nItems.value = state.inst.weights.length;
    el.nItemsOut.textContent = state.inst.weights.length;
    el.seed.value = state.seed;
    el.capacity.max = S;
    el.capacity.value = state.inst.capacity;
    el.capacityOut.textContent = state.inst.capacity;
    el.variant.replaceChildren(...P().VARIANTS.map((v) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = c.variants[v].name[state.lang];
      return o;
    }));
    el.variant.value = state.variant;
    el.variantDesc.textContent = c.variants[state.variant].desc[state.lang];
    el.lambdaField.hidden = !isPenalty();
    el.lambda.value = state.lambda;
    el.lambdaOut.textContent = fmt(state.lambda);
    el.rhoHint.hidden = !isPenalty();
    el.rhoHint.textContent = t('rhoHint', { rho: Math.round(P().rho(state.inst) * 100) / 100 });
    el.btnDraw.hidden = state.variant !== 'repair-random';
    el.inW.value = state.inst.weights.join(' ');
    el.inV.value = state.inst.values.join(' ');
    el.inCap.value = state.inst.capacity;
    el.inX.value = state.x.join(' ');
    el.err.textContent = state.errKey ? t(state.errKey) : '';
    renderLegend();
    renderTreatTable();
    if (learn) learn.setVariant(state.variant);
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

  // ---------- Interacción ----------

  function toggleGene(i) {
    stop();
    state.x = state.x.slice();
    state.x[i] = 1 - state.x[i];
    state.errKey = null;
    syncControls();
    recompute(curStep().stage >= 4 ? 'end' : 'keep');
  }

  el.btnReset.addEventListener('click', reset);
  el.btnPrev.addEventListener('click', prev);
  el.btnNext.addEventListener('click', () => { stop(); next(); });
  el.btnPlay.addEventListener('click', togglePlay);
  el.speed.addEventListener('input', () => {
    state.speed = Number(el.speed.value);
    el.speedOut.textContent = `${fmt(state.speed)}×`;
  });

  el.nItems.addEventListener('input', () => {
    stop();
    el.nItemsOut.textContent = el.nItems.value;
    state.errKey = null;
    generate(state.seed, Number(el.nItems.value));
    syncControls();
    recompute('start');
  });
  el.seed.addEventListener('change', () => {
    const s = Math.max(0, Math.min(999999, Math.floor(Number(el.seed.value) || 0)));
    stop();
    state.errKey = null;
    generate(s, state.inst.weights.length);
    syncControls();
    recompute('start');
  });
  el.capacity.addEventListener('input', () => {
    stop();
    state.inst = Object.assign({}, state.inst, { capacity: Number(el.capacity.value) });
    el.capacityOut.textContent = el.capacity.value;
    syncControls();
    recompute('keepType');
  });
  el.variant.addEventListener('change', () => {
    stop();
    state.variant = el.variant.value;
    syncControls();
    recompute('keepType');
  });
  el.lambda.addEventListener('input', () => {
    state.lambda = Math.round(Number(el.lambda.value) * 10) / 10;
    el.lambdaOut.textContent = fmt(state.lambda);
    renderTreatTable();
    recompute('keepType');
  });
  el.btnInstance.addEventListener('click', () => {
    stop();
    state.errKey = null;
    generate(R.newSeed() % 1000000, state.inst.weights.length);
    syncControls();
    recompute('start');
  });
  el.btnChromosome.addEventListener('click', () => {
    stop();
    state.x = P().randomChromosome(R.newSeed(), state.inst.weights.length);
    syncControls();
    recompute('keepType');
  });
  el.btnDraw.addEventListener('click', () => {
    stop();
    state.draw = (R.newSeed() % 999) + 1;
    syncControls();
    recompute('keepType');
  });

  const parseInts = (s) => s.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  el.manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inst = { weights: parseInts(el.inW.value), values: parseInts(el.inV.value), capacity: Number(el.inCap.value.trim()) };
    const x = el.inX.value.replace(/[\s,;]+/g, '').split('').map(Number);
    const err = P().validate(inst, x);
    if (err) { state.errKey = err; el.err.textContent = t(err); return; }
    stop();
    state.errKey = null;
    state.inst = inst;
    state.x = x;
    syncControls();
    recompute('start');
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
    if (state.view === 'about') {
      document.title = `${G.about.text[state.lang].title} · ${t('brand')}`;
      G.about.renderAbout(el.aboutBody, state.lang);
    } else if (state.view === 'enc') {
      renderEncHeader();
      syncControls();
      learn.refresh();
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
  }

  function show(which) {
    stop();
    const changed = state.view !== which;
    state.view = which;
    showOnly(which);
    if (changed) window.scrollTo(0, 0);
  }

  const intList = (s) => (s ? s.split('-').map(Number) : null);

  function showEnc(id, q) {
    const changed = id !== state.encId || state.view !== 'enc';
    show('enc');
    state.encId = id;
    if (!view) view = createKnapsackView({ svg: $('viz'), t, fmt, onToggle: toggleGene });
    if (!learn) learn = createLearnPanel({ content: content(), t, lang: () => state.lang });
    if (!changed && state.result) return;
    // Datos de la URL, si los hay y son válidos; si no, una instancia aleatoria
    const vr = q.get('v');
    state.variant = P().VARIANTS.indexOf(vr) !== -1 ? vr : 'penalty-linear';
    const lam = Number(q.get('l'));
    state.lambda = q.get('l') != null && lam >= P().LAMBDA.min && lam <= P().LAMBDA.max ? Math.round(lam * 10) / 10 : P().LAMBDA.def;
    state.draw = Math.max(1, Math.floor(Number(q.get('r')) || 1));
    const seed = Math.max(0, Math.floor(Number(q.get('s'))) || 0) || (R.newSeed() % 1000000);
    const inst = { weights: intList(q.get('w')), values: intList(q.get('val')), capacity: Number(q.get('W')) };
    const x = intList(q.get('x'));
    state.seed = seed;
    if (inst.weights && inst.values && x && !P().validate(inst, x)) {
      state.inst = inst;
      state.x = x;
    } else {
      const n = Number(q.get('n'));
      generate(seed, n >= P().LIMITS.nMin && n <= P().LIMITS.nMax ? n : 8);
    }
    state.result = null;
    state.step = Math.max(0, Math.floor(Number(q.get('step')) || 0));
    learn.setContent(content(), state.variant);
    syncControls();
    recompute('keep');
  }

  function route() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    const id = q.get('enc');
    if (id && registry.isReady(id) && G.problems && G.problems[id] && G.content[id]) showEnc(id, q);
    else if (q.get('page') === 'about') show('about');
    else show('home');
    applyLanguage();
  }

  // Guarda el estado en la URL sin crear entradas de historial (para proyectar o compartir).
  function writeHash() {
    const params = new URLSearchParams();
    if (state.view === 'about') params.set('page', 'about');
    if (state.view === 'enc' && state.result) {
      params.set('enc', state.encId);
      params.set('lang', state.lang);
      params.set('v', state.variant);
      if (isPenalty()) params.set('l', String(state.lambda));
      if (state.variant === 'repair-random') params.set('r', String(state.draw));
      params.set('s', String(state.seed));
      params.set('w', state.inst.weights.join('-'));
      params.set('val', state.inst.values.join('-'));
      params.set('W', String(state.inst.capacity));
      params.set('x', state.x.join('-'));
      params.set('step', String(state.step));
    } else params.set('lang', state.lang);
    const h = params.toString();
    if (location.hash.replace(/^#/, '') === h) return;
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang;
    applyLanguage();
  }));

  // Enlaces a la pantalla inicial conservando el idioma
  [$('brandLink'), $('backLink'), $('aboutBack')].forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `lang=${state.lang}`;
  }));

  document.addEventListener('keydown', (e) => {
    if (state.view !== 'enc') return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' && tag !== 'button' && tag !== 'summary' && tag !== 'a' && !(e.target.closest && e.target.closest('.gene-btn'))) { e.preventDefault(); togglePlay(); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });

  window.addEventListener('hashchange', route);

  // ---------- Arranque ----------
  route();
})();
