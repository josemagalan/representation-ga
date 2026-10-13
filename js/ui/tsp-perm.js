/*
 * Controles y tarjetas propias del viajante: número de ciudades, semilla, cromosoma aleatorio o
 * no válido, cromosoma a mano y la tabla de los 2n cromosomas equivalentes.
 */
(function (root) {
  'use strict';

  function createTspUI(ctx) {
    const { P, t, fmt, R } = ctx;
    const C = root.GAX.createControls(t);
    const s = { seed: 1, n: 7, inst: null, x: null, opt: null };

    function generate(seed, n) {
      s.seed = seed;
      s.n = n;
      s.inst = P.randomInstance(seed, n);
      s.opt = P.optimum(s.inst);
      s.x = P.randomChromosome(seed, n);
    }
    const changed = (mode) => { ctx.stop(); view.clearPick(); manual.clearError(); sync(); ctx.onChange(mode); };

    // ---------- Controles ----------
    const nCities = C.range({ id: 'nCities', labelKey: 'nCities', min: P.LIMITS.nMin, max: P.LIMITS.nMax, value: 7,
      onInput: (v) => { generate(s.seed, v); changed('start'); } });
    const seed = C.number({ id: 'seed', labelKey: 'seed', min: 0, max: 999999,
      onChange: (v) => { generate(Math.max(0, Math.min(999999, Math.floor(v) || 0)), s.n); changed('start'); } });
    const manual = C.manual({
      summaryKey: 'manualTour', hintKey: 'manualTourHint',
      fields: [{ id: 'inTour', labelKey: 'manualChromosome' }],
      onSubmit(v) {
        const x = v.inTour.trim().split(/[\s,;-]+/).filter(Boolean).map(Number);
        const err = P.validate(s.inst, x);
        if (err) return err;
        s.x = x;
        ctx.stop(); view.clearPick(); sync(); ctx.onChange('start');
        return null;
      },
    });
    ctx.controlsEl.replaceChildren(
      C.row(nCities.field, seed.field,
        C.buttons(
          C.button({ id: 'btnInstance', labelKey: 'randomCities', primary: true, onClick: () => { generate(R.newSeed() % 1000000, s.n); changed('start'); } }),
          C.button({ id: 'btnChromosome', labelKey: 'randomChromosome', onClick: () => { s.x = P.randomChromosome(R.newSeed(), s.n); changed('keepType'); } }),
          C.button({ id: 'btnBroken', labelKey: 'brokenChromosome', onClick: () => { s.x = P.brokenChromosome(R.newSeed(), s.n); changed('keepType'); } }))),
      manual.el);

    // ---------- Tabla de cromosomas equivalentes ----------
    const card = C.card('equivTitle');
    const note = C.el('p', 'hint');
    card.append(note);
    const scroll = C.el('div', 'table-scroll');
    const table = C.el('table', 'cmp-table equiv-table', { id: 'equivTable' });
    scroll.append(table);
    card.append(scroll);
    ctx.extraEl.replaceChildren(card);

    function renderTable() {
      const tour = P.repair(s.x).tour;
      const eq = P.equivalents(tour);
      const cur = s.x.join(' ');
      const rows = [['equivForward', eq.slice(0, s.n)], ['equivBackward', eq.slice(s.n)]];
      const tbody = C.el('tbody');
      rows.forEach(([key, list]) => {
        const tr = C.el('tr');
        const th = C.el('th', null, { scope: 'row' });
        th.textContent = t(key);
        tr.append(th);
        list.forEach((ch) => {
          const td = C.el('td', `mono${ch.join(' ') === cur ? ' current-cell' : ''}`);
          td.textContent = ch.join(' ');
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.replaceChildren(tbody);
      note.textContent = t('equivNote', { twoN: 2 * s.n, len: fmt(Math.round(P.tourLength(s.inst, tour) * 10) / 10) });
    }

    function sync() {
      nCities.set(s.n);
      seed.set(s.seed);
      manual.set({ inTour: s.x.join(' ') });
      renderTable();
    }

    // ---------- Vista ----------
    const view = root.GAX.createTspView({
      svg: ctx.svg, t, fmt,
      onCity: (c) => { if (ctx.onCity) ctx.onCity(c); },
      optimumLength: () => s.opt.length,
      onSwap(a, b) {
        s.x = s.x.slice();
        [s.x[a], s.x[b]] = [s.x[b], s.x[a]];
        const st = ctx.currentStep();
        changed(st && st.stage >= 4 ? 'end' : 'keep');
      },
    });

    const intList = (str) => (str ? str.split('-').map(Number) : null);

    return {
      view,
      init(q) {
        const sd = Math.max(0, Math.floor(Number(q.get('s'))) || 0) || (R.newSeed() % 1000000);
        const n = Number(q.get('n'));
        generate(sd, n >= P.LIMITS.nMin && n <= P.LIMITS.nMax ? n : 7);
        const x = intList(q.get('x'));
        if (x && !P.validate(s.inst, x)) s.x = x;
        sync();
      },
      run() {
        view.setProblem(s.inst, s.opt.tour);
        return P.run(s.inst, s.x);
      },
      hash: () => [['s', String(s.seed)], ['n', String(s.n)], ['x', s.x.join('-')]],
      legend() {
        return [['sw-city-dot', 'legendCity'], ['sw-city-start', 'legendStart'], ['sw-line sw-tour', 'legendTour'],
          ['sw-line sw-tour-opt', 'legendOptimal'], ['sw-line sw-tour-repeat', 'legendRepeat'], ['sw-city-missing', 'legendMissing']];
      },
      variant: () => 'path',
      getPage: () => ({ inst: s.inst, x: s.x.slice(), seed: s.seed }),
      setPage(p) {
        if (p.inst !== s.inst) { s.inst = p.inst; s.opt = P.optimum(s.inst); }
        s.x = p.x.slice();
        s.n = s.x.length;
        if (p.seed != null) s.seed = p.seed;
        view.clearPick();
        manual.clearError();
        sync();
      },
      editHintKey: 'editHintPerm',
      formulaInstance: (res) => t('formulaInstanceTsp', { n: s.n, fact: res.stats.permutations, tours: res.stats.tours, opt: fmt(Math.round(res.stats.optimum * 10) / 10) }),
      onLanguage() { manual.refresh(); sync(); },
    };
  }

  const G = (root.GAX = root.GAX || {});
  (G.encodingUI = G.encodingUI || {})['tsp-perm'] = createTspUI;
})(typeof self !== 'undefined' ? self : this);
