/*
 * Controles y tarjetas de la asignación de tareas a máquinas, comunes a las dos codificaciones:
 * número de tareas y de máquinas, semilla, cromosoma aleatorio, datos a mano, tratamiento y λ
 * (solo la matriz) y la tarjeta «Las dos codificaciones», con la asignación actual escrita en las dos
 * y un enlace a la otra página con la misma instancia.
 * js/ui/assignment-int.js y js/ui/assignment-matrix.js solo eligen el modo.
 */
(function (root) {
  'use strict';

  function createAssignmentUI(ctx, mode) {
    const { P, content, t, fmt, R } = ctx;
    const A = root.GAX.assignment;
    const C = root.GAX.createControls(t);
    const isMatrix = mode === 'matrix';
    const other = isMatrix ? 'assignment-int' : 'assignment-matrix';
    const s = { seed: 1, n: 6, m: 3, inst: null, x: null, opt: null, variant: 'repair', lambda: isMatrix ? P.LAMBDA.def : 1 };

    const newChromosome = (seed) => (isMatrix ? P.randomChromosome(seed, s.n, s.m) : A.randomAssignment(seed, s.n, s.m));
    function generate(seed, n, m) {
      s.seed = seed;
      s.n = n;
      s.m = m;
      s.inst = A.randomInstance(seed, n, m);
      s.x = newChromosome(seed);
      s.opt = A.optimum(s.inst);
    }
    const changed = (mode2) => { ctx.stop(); manual.clearError(); sync(); ctx.onChange(mode2); };
    const chromText = (x) => (isMatrix ? x.map((row) => row.join('')).join(' ') : x.join(' '));

    // ---------- Controles ----------
    const nTasks = C.range({ id: 'nTasks', labelKey: 'nTasks', min: A.LIMITS.nMin, max: A.LIMITS.nMax, value: 6,
      onInput: (v) => { generate(s.seed, v, s.m); changed('start'); } });
    const nMachines = C.range({ id: 'nMachines', labelKey: 'nMachines', min: A.LIMITS.mMin, max: A.LIMITS.mMax, value: 3,
      onInput: (v) => { generate(s.seed, s.n, v); changed('start'); } });
    const seed = C.number({ id: 'seed', labelKey: 'seed', min: 0, max: 999999,
      onChange: (v) => { generate(Math.max(0, Math.min(999999, Math.floor(v) || 0)), s.n, s.m); changed('start'); } });
    const buttons = [
      C.button({ id: 'btnInstance', labelKey: 'randomInstance', primary: true, onClick: () => { generate(R.newSeed() % 1000000, s.n, s.m); changed('start'); } }),
      C.button({ id: 'btnChromosome', labelKey: 'randomChromosome', onClick: () => { s.x = newChromosome(R.newSeed()); changed('keepType'); } }),
    ];
    if (isMatrix) buttons.push(C.button({ id: 'btnFeasible', labelKey: 'randomFeasible', onClick: () => { s.x = P.randomFeasible(R.newSeed(), s.n, s.m); changed('keepType'); } }));
    const row = [nTasks.field, nMachines.field, seed.field];
    let variant = null;
    let lambda = null;
    let desc = null;
    let bound = null;
    if (isMatrix) {
      variant = C.select({ id: 'variant', labelKey: 'treatment', onChange: (v) => { s.variant = v; changed('keepType'); } });
      lambda = C.range({ id: 'lambda', labelKey: 'lambda', min: P.LAMBDA.min, max: P.LAMBDA.max, step: P.LAMBDA.step, value: s.lambda,
        format: (v) => fmt(v), onInput: (v) => { s.lambda = Math.round(v * 10) / 10; changed('keepType'); } });
      desc = C.hint('variantDesc');
      bound = C.hint('boundHint');
      row.push(variant.field, lambda.field);
    }
    const manual = C.manual({
      summaryKey: 'manualData',
      hintKey: isMatrix ? 'manualAssignHintMatrix' : 'manualAssignHintInt',
      fields: [{ id: 'inP', labelKey: 'manualTimes' }, { id: 'inX', labelKey: 'manualChromosome' }],
      onSubmit(v) {
        const groups = v.inP.trim().split(/\s*[;/|]\s*/).filter(Boolean);
        const inst = { p: groups.map((g) => g.split(/[\s,]+/).filter(Boolean).map(Number)) };
        const err0 = A.validateInstance(inst);
        if (err0) return err0;
        const m = inst.p[0].length;
        let x;
        if (isMatrix) {
          const bits = v.inX.replace(/[^0-9]/g, '').split('').map(Number);
          if (bits.length !== inst.p.length * m) return 'errMatrixShape';
          x = Array.from({ length: inst.p.length }, (_, i) => bits.slice(i * m, (i + 1) * m));
        } else x = v.inX.trim().split(/[\s,;-]+/).filter(Boolean).map(Number);
        const err = P.validate(inst, x);
        if (err) return err;
        s.inst = inst;
        s.n = inst.p.length;
        s.m = m;
        s.x = x;
        s.opt = A.optimum(inst);
        ctx.stop(); sync(); ctx.onChange('start');
        return null;
      },
    });
    ctx.controlsEl.replaceChildren(C.row(...row, C.buttons(...buttons)), ...(isMatrix ? [desc, bound] : []), manual.el);

    // ---------- Tarjeta: las dos codificaciones ----------
    const card = C.card('bothTitle', 'bothNote');
    const sameLine = C.el('p', 'both-same');
    const scroll = C.el('div', 'table-scroll');
    const table = C.el('table', 'cmp-table both-table', { id: 'bothTable' });
    scroll.append(table);
    card.append(sameLine, scroll);
    ctx.extraEl.replaceChildren(card);

    /** Asignación que evalúa la página (null si la matriz es infactible y se penaliza). */
    function evaluated() {
      if (!isMatrix) return s.x.slice();
      const a = A.fromMatrix(s.x);
      if (a) return a;
      return s.variant === 'repair' ? A.fromMatrix(P.repair(s.inst, s.x).matrix) : null;
    }

    const pSerial = () => s.inst.p.map((r) => r.join('.')).join('-');
    function otherHref(a) {
      const xs = a ? (isMatrix ? a.join('-') : A.toMatrix(a, s.m).map((r) => r.join('')).join('-')) : null;
      const q = new URLSearchParams({ enc: other, lang: ctx.lang(), s: String(s.seed), n: String(s.n), m: String(s.m), p: pSerial() });
      if (xs) q.set('x', xs);
      return `#${q.toString()}`;
    }

    function renderBoth() {
      const a = evaluated();
      const total = Math.pow(s.m, s.n);
      const bits = Math.pow(2, s.n * s.m);
      sameLine.replaceChildren();
      if (a) {
        const mono = (txt) => { const c = C.el('code', 'mono'); c.textContent = txt; return c; };
        sameLine.append(t(isMatrix && !A.isFeasibleMatrix(s.x) ? 'bothSameRepaired' : 'bothSame'), ' ',
          t('bothVector'), ' ', mono(a.join(' ')), ' · ', t('bothMatrix'), ' ', mono(A.toMatrix(a, s.m).map((r) => r.join('')).join(' ')));
      } else sameLine.textContent = t('bothNoAssignment');
      const head = C.el('tr');
      ['colEncoding', 'colGenes', 'colSpace', 'colFeasibleShare', 'colRedundancy', 'colOneGene'].forEach((k) => {
        const th = C.el('th', null, { scope: 'col' });
        th.textContent = t(k);
        head.append(th);
      });
      const thead = C.el('thead');
      thead.append(head);
      const pre = a ? root.GAX.problems['assignment-matrix'].repairPreimages(s.inst, a) : null;
      const rows = [
        { id: 'assignment-int', name: t('encInt'), genes: t('genesInt', { n: s.n, m: s.m }), space: `${A.power(s.m, s.n)} = ${fmt(total)}`,
          feas: t('feasAll', { total: fmt(total) }), red: t('redNone'), one: t('oneInt') },
        { id: 'assignment-matrix', name: t('encMatrix'), genes: t('genesMatrix', { nm: s.n * s.m }), space: `${A.power(2, s.n * s.m)} = ${fmt(bits)}`,
          feas: t('feasShare', { total: fmt(total), share: fmtShare(total / bits) }),
          red: pre != null ? t('redRepair', { count: fmt(pre) }) : t('redRepairNone'), one: t('oneMatrix') },
      ];
      const tbody = C.el('tbody');
      rows.forEach((r) => {
        const cur = r.id === content.id;
        const tr = C.el('tr', cur ? 'current' : null, cur ? { 'aria-current': 'true' } : {});
        const th = C.el('th', null, { scope: 'row' });
        if (cur) th.textContent = r.name;
        else {
          const link = C.el('a', null, { href: otherHref(a) });
          link.textContent = r.name;
          th.append(link);
        }
        tr.append(th, ...[r.genes, r.space, r.feas, r.red, r.one].map((txt) => { const td = C.el('td'); td.textContent = txt; return td; }));
        tbody.append(tr);
      });
      table.replaceChildren(thead, tbody);
    }

    function fmtShare(v) {
      const p = 100 * v;
      return (p >= 10 ? Math.round(p) : Number(p.toPrecision(2))).toLocaleString(ctx.lang() === 'es' ? 'es-ES' : 'en-GB', { maximumSignificantDigits: 2 });
    }

    function sync() {
      const l = ctx.lang();
      nTasks.set(s.n);
      nMachines.set(s.m);
      seed.set(s.seed);
      if (isMatrix) {
        variant.setOptions(P.VARIANTS.map((v) => ({ value: v, label: content.variants[v].name[l] })), s.variant);
        desc.textContent = content.variants[s.variant].desc[l];
        lambda.field.hidden = s.variant !== 'penalty';
        lambda.set(s.lambda);
        bound.hidden = s.variant !== 'penalty';
        bound.textContent = t('boundHint', { bound: A.lambdaBound(s.inst) });
      }
      manual.set({ inP: s.inst.p.map((r) => r.join(' ')).join('; '), inX: chromText(s.x) });
      renderBoth();
    }

    // ---------- Vista ----------
    const view = root.GAX.createAssignmentView({
      svg: ctx.svg, t, fmt, mode,
      onGene(i, j) {
        ctx.stop();
        if (isMatrix) {
          s.x = s.x.map((r) => r.slice());
          s.x[i][j - 1] = 1 - s.x[i][j - 1];
        } else {
          s.x = s.x.slice();
          s.x[i] = (s.x[i] % s.m) + 1;
        }
        const st = ctx.currentStep();
        changed(st && st.stage >= 4 ? 'end' : 'keep');
      },
    });

    function parseP(str) {
      if (!str) return null;
      const p = str.split('-').map((r) => r.split('.').map(Number));
      return A.validateInstance({ p }) ? null : { p };
    }

    return {
      view,
      init(q) {
        if (isMatrix) {
          const vr = q.get('v');
          s.variant = P.VARIANTS.indexOf(vr) !== -1 ? vr : 'repair';
          const lam = Number(q.get('l'));
          s.lambda = q.get('l') != null && lam >= P.LAMBDA.min && lam <= P.LAMBDA.max ? Math.round(lam * 10) / 10 : P.LAMBDA.def;
        }
        const sd = Math.max(0, Math.floor(Number(q.get('s'))) || 0) || (R.newSeed() % 1000000);
        const inst = parseP(q.get('p'));
        if (inst) {
          s.seed = sd;
          s.inst = inst;
          s.n = inst.p.length;
          s.m = inst.p[0].length;
          s.opt = A.optimum(inst);
          s.x = newChromosome(sd);
        } else {
          const n = Number(q.get('n'));
          const m = Number(q.get('m'));
          generate(sd, n >= A.LIMITS.nMin && n <= A.LIMITS.nMax ? n : 6, m >= A.LIMITS.mMin && m <= A.LIMITS.mMax ? m : 3);
        }
        const xs = q.get('x');
        if (xs) {
          const x = isMatrix ? xs.split('-').map((r) => r.split('').map(Number)) : xs.split('-').map(Number);
          if (!P.validate(s.inst, x)) s.x = x;
        }
        sync();
      },
      run() {
        const res = P.run(s.inst, s.x, { variant: s.variant, lambda: s.lambda });
        const maxT = Math.max(res.stats.optimum, ...res.steps.map((st) => Math.max(0, ...st.loads)));
        view.setProblem(s.inst, res.stats.optimum, maxT);
        return res;
      },
      hash() {
        const h = [];
        if (isMatrix) {
          h.push(['v', s.variant]);
          if (s.variant === 'penalty') h.push(['l', String(s.lambda)]);
        }
        h.push(['s', String(s.seed)], ['n', String(s.n)], ['m', String(s.m)], ['p', pSerial()],
          ['x', isMatrix ? s.x.map((r) => r.join('')).join('-') : s.x.join('-')]);
        return h;
      },
      legend() {
        const items = [['sw-cell-chosen', 'legendChosen'], ['sw-cell-fast', 'legendFast']];
        if (isMatrix) items.push(['sw-gene-one', 'legendBitOne'], ['sw-gene-zero', 'legendBitZero'], ['sw-col-bad', 'legendColBad']);
        items.push(['sw-bar', 'legendBar']);
        if (isMatrix) items.push(['sw-bar-dup', 'legendDup']);
        if (isMatrix && s.variant === 'repair') items.push(['sw-mut', 'legendRepaired']);
        items.push(['sw-line sw-cmax', 'legendCmax'], ['sw-line sw-tour-opt', 'legendOptMakespan']);
        return items;
      },
      variant: () => (isMatrix ? s.variant : 'int'),
      editHintKey: isMatrix ? 'editHintMatrix' : 'editHintInt',
      formulaInstance: (res) => (isMatrix
        ? t('formulaInstanceMatrix', { n: s.n, m: s.m, total: fmt(res.stats.total), feasible: fmt(res.stats.feasible), opt: res.stats.optimum })
        : t('formulaInstanceInt', { n: s.n, m: s.m, total: fmt(res.stats.total), opt: res.stats.optimum })),
      onLanguage() { if (lambda) lambda.refresh(); manual.refresh(); sync(); },
    };
  }

  (root.GAX = root.GAX || {}).createAssignmentUI = createAssignmentUI;
})(typeof self !== 'undefined' ? self : this);
