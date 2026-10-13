/*
 * Controles y tarjetas propias de la mochila 0/1: número de objetos, semilla, capacidad,
 * tratamiento de la infactibilidad y λ, datos a mano y la tabla de los cinco tratamientos.
 */
(function (root) {
  'use strict';

  function createKnapsackUI(ctx) {
    const { P, content, t, fmt, R } = ctx;
    const C = root.GAX.createControls(t);
    const s = { seed: 1, inst: null, x: null, variant: 'penalty-linear', lambda: P.LAMBDA.def, draw: 1 };
    const isPenalty = () => s.variant.startsWith('penalty');
    const sumW = () => s.inst.weights.reduce((a, b) => a + b, 0);

    function generate(seed, n) {
      s.seed = seed;
      s.inst = P.randomInstance(seed, n);
      s.x = P.randomChromosome(seed, n);
    }
    const changed = (mode) => { ctx.stop(); manual.clearError(); sync(); ctx.onChange(mode); };

    // ---------- Controles ----------
    const nItems = C.range({ id: 'nItems', labelKey: 'nItems', min: P.LIMITS.nMin, max: P.LIMITS.nMax, value: 8,
      onInput: (v) => { generate(s.seed, v); changed('start'); } });
    const seed = C.number({ id: 'seed', labelKey: 'seed', min: 0, max: 999999,
      onChange: (v) => { generate(Math.max(0, Math.min(999999, Math.floor(v) || 0)), s.inst.weights.length); changed('start'); } });
    const cap = C.range({ id: 'capacity', labelKey: 'capacity', min: 1, max: 40, value: 20,
      onInput: (v) => { s.inst = Object.assign({}, s.inst, { capacity: v }); changed('keepType'); } });
    const variant = C.select({ id: 'variant', labelKey: 'treatment', onChange: (v) => { s.variant = v; changed('keepType'); } });
    const lambda = C.range({ id: 'lambda', labelKey: 'lambda', min: P.LAMBDA.min, max: P.LAMBDA.max, step: P.LAMBDA.step, value: s.lambda,
      format: (v) => fmt(v), onInput: (v) => { s.lambda = Math.round(v * 10) / 10; changed('keepType'); } });
    const btnDraw = C.button({ id: 'btnDraw', labelKey: 'drawAgain', onClick: () => { s.draw = (R.newSeed() % 999) + 1; changed('keepType'); } });
    const desc = C.hint('variantDesc');
    const rho = C.hint('rhoHint');
    const manual = C.manual({
      summaryKey: 'manualData', hintKey: 'manualHint',
      fields: [{ id: 'inW', labelKey: 'manualWeights' }, { id: 'inV', labelKey: 'manualValues' }, { id: 'inCap', labelKey: 'manualCapacity' }, { id: 'inX', labelKey: 'manualChromosome' }],
      onSubmit(v) {
        const ints = (str) => str.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
        const inst = { weights: ints(v.inW), values: ints(v.inV), capacity: Number(v.inCap.trim()) };
        const x = v.inX.replace(/[\s,;]+/g, '').split('').map(Number);
        const err = P.validate(inst, x);
        if (err) return err;
        s.inst = inst;
        s.x = x;
        ctx.stop(); sync(); ctx.onChange('start');
        return null;
      },
    });
    ctx.controlsEl.replaceChildren(
      C.row(nItems.field, seed.field, cap.field, variant.field, lambda.field,
        C.buttons(
          C.button({ id: 'btnInstance', labelKey: 'randomInstance', primary: true, onClick: () => { generate(R.newSeed() % 1000000, s.inst.weights.length); changed('start'); } }),
          C.button({ id: 'btnChromosome', labelKey: 'randomChromosome', onClick: () => { s.x = P.randomChromosome(R.newSeed(), s.inst.weights.length); changed('keepType'); } }),
          btnDraw)),
      desc, rho, manual.el);

    // ---------- Tabla de los cinco tratamientos ----------
    const card = C.card('compareTitle', 'compareNote');
    const scroll = C.el('div', 'table-scroll');
    const table = C.el('table', 'cmp-table treat-table', { id: 'treatTable' });
    scroll.append(table);
    card.append(scroll);
    ctx.extraEl.replaceChildren(card);

    function renderTable() {
      const l = ctx.lang();
      const head = C.el('tr');
      ['colTreatment', 'colSolution', 'colWeight', 'colValue', 'colFitness'].forEach((k) => {
        const th = C.el('th', null, { scope: 'col' });
        th.textContent = t(k);
        head.append(th);
      });
      const thead = C.el('thead');
      thead.append(head);
      const tbody = C.el('tbody');
      P.VARIANTS.forEach((v) => {
        const ev = P.evaluate(s.inst, s.x, v, { lambda: s.lambda, seed: s.draw });
        const tr = C.el('tr', v === s.variant ? 'current' : null, v === s.variant ? { 'aria-current': 'true' } : {});
        const name = C.el('th', null, { scope: 'row' });
        const btn = C.el('button', 'link-btn', { type: 'button' });
        btn.textContent = content.variants[v].name[l];
        btn.addEventListener('click', () => { s.variant = v; changed('keepType'); });
        name.append(btn);
        const sol = C.el('td', 'mono');
        ev.solution.forEach((b, i) => { const sp = C.el('span', b !== s.x[i] ? 'bit-changed' : null); sp.textContent = b; sol.append(sp); });
        const feasible = ev.weight <= s.inst.capacity;
        const cells = [fmt(ev.weight) + (feasible ? '' : ` (${t('infeasibleMark')})`), fmt(ev.value), fmt(Math.round(ev.fitness * 100) / 100)];
        tr.append(name, sol, ...cells.map((txt, k) => { const td = C.el('td', `num${k === 0 && !feasible ? ' over' : ''}`); td.textContent = txt; return td; }));
        tbody.append(tr);
      });
      table.replaceChildren(thead, tbody);
    }

    function sync() {
      const l = ctx.lang();
      nItems.set(s.inst.weights.length);
      seed.set(s.seed);
      cap.setMax(sumW());
      cap.set(s.inst.capacity);
      variant.setOptions(P.VARIANTS.map((v) => ({ value: v, label: content.variants[v].name[l] })), s.variant);
      desc.textContent = content.variants[s.variant].desc[l];
      lambda.field.hidden = !isPenalty();
      lambda.set(s.lambda);
      rho.hidden = !isPenalty();
      rho.textContent = t('rhoHint', { rho: Math.round(P.rho(s.inst) * 100) / 100 });
      btnDraw.hidden = s.variant !== 'repair-random';
      manual.set({ inW: s.inst.weights.join(' '), inV: s.inst.values.join(' '), inCap: s.inst.capacity, inX: s.x.join(' ') });
      renderTable();
    }

    // ---------- Vista ----------
    const view = root.GAX.createKnapsackView({
      svg: ctx.svg, t, fmt,
      onToggle(i) {
        ctx.stop();
        s.x = s.x.slice();
        s.x[i] = 1 - s.x[i];
        const st = ctx.currentStep();
        changed(st && st.stage >= 4 ? 'end' : 'keep');
      },
    });

    const intList = (str) => (str ? str.split('-').map(Number) : null);

    return {
      view,
      init(q) {
        const vr = q.get('v');
        s.variant = P.VARIANTS.indexOf(vr) !== -1 ? vr : 'penalty-linear';
        const lam = Number(q.get('l'));
        s.lambda = q.get('l') != null && lam >= P.LAMBDA.min && lam <= P.LAMBDA.max ? Math.round(lam * 10) / 10 : P.LAMBDA.def;
        s.draw = Math.max(1, Math.floor(Number(q.get('r')) || 1));
        s.seed = Math.max(0, Math.floor(Number(q.get('s'))) || 0) || (R.newSeed() % 1000000);
        const inst = { weights: intList(q.get('w')), values: intList(q.get('val')), capacity: Number(q.get('W')) };
        const x = intList(q.get('x'));
        if (inst.weights && inst.values && x && !P.validate(inst, x)) { s.inst = inst; s.x = x; } else {
          const n = Number(q.get('n'));
          generate(s.seed, n >= P.LIMITS.nMin && n <= P.LIMITS.nMax ? n : 8);
        }
        sync();
      },
      run() {
        view.setProblem(s.inst);
        return P.run(s.inst, s.x, { variant: s.variant, lambda: s.lambda, seed: s.draw });
      },
      hash() {
        const h = [['v', s.variant]];
        if (isPenalty()) h.push(['l', String(s.lambda)]);
        if (s.variant === 'repair-random') h.push(['r', String(s.draw)]);
        h.push(['s', String(s.seed)], ['w', s.inst.weights.join('-')], ['val', s.inst.values.join('-')], ['W', String(s.inst.capacity)], ['x', s.x.join('-')]);
        return h;
      },
      legend() {
        const items = [['sw-p1', 'legendIn'], ['sw-gene-one', 'legendGeneOne'], ['sw-gene-zero', 'legendGeneZero'], ['sw-excess', 'legendExcess']];
        if (s.variant.startsWith('repair')) items.push(['sw-mut', 'legendChanged']);
        if (s.variant === 'decoder') items.push(['sw-skipped', 'legendSkipped']);
        return items;
      },
      variant: () => s.variant,
      /** Estado de la página para el modo práctica (js/practice.js) y su vuelta. */
      getPage: () => ({ inst: s.inst, x: s.x.slice(), variant: s.variant, lambda: s.lambda, draw: s.draw, seed: s.seed }),
      setPage(p) {
        s.inst = p.inst;
        s.x = p.x.slice();
        s.variant = p.variant;
        s.lambda = p.lambda;
        s.draw = p.draw;
        if (p.seed != null) s.seed = p.seed;
        manual.clearError();
        sync();
      },
      formulaInstance: (res) => t('formulaInstance', { n: s.inst.weights.length, W: s.inst.capacity, total: res.stats.total, feasible: res.stats.feasible, opt: res.stats.optimum }),
      onLanguage() { lambda.refresh(); manual.refresh(); sync(); },
    };
  }

  const G = (root.GAX = root.GAX || {});
  (G.encodingUI = G.encodingUI || {})['knapsack-bits'] = createKnapsackUI;
})(typeof self !== 'undefined' ? self : this);
