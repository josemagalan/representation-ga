/*
 * Controles y tarjetas de la optimización de una función continua, comunes a las dos codificaciones:
 * función, bits por variable y código (binaria), tratamiento y λ (reales), cromosoma aleatorio,
 * datos a mano y la tarjeta «Las tres codificaciones», con el punto actual escrito en las tres y
 * enlaces a las otras con la misma función.
 * js/ui/function-real.js y js/ui/function-bits.js solo eligen el modo.
 */
(function (root) {
  'use strict';

  function createFunctionUI(ctx, mode) {
    const { P, content, t, fmt, R } = ctx;
    const Fn = root.GAX.func;
    const C = root.GAX.createControls(t);
    const isReal = mode === 'real';
    const s = {
      fn: 'himmelblau', k: Fn.LIMITS.kDef,
      variant: isReal ? 'clamp' : 'standard', lambda: isReal ? P.LAMBDA.def : 0,
      x: null,          // reales: [x₁, x₂]; binaria: 2k bits
    };
    const loc = () => (ctx.lang() === 'es' ? 'es-ES' : 'en-GB');
    const minus = (str) => str.replace(/^-/, '−');
    const fmtCoord = (v) => minus((Math.abs(v) < 1e-12 ? 0 : v).toLocaleString(loc(), { maximumFractionDigits: 4 }));
    function fmtF(v) {
      if (v === 0) return '0';
      return minus(Math.abs(v) >= 10 ? v.toLocaleString(loc(), { maximumFractionDigits: 2 }) : v.toLocaleString(loc(), { maximumSignificantDigits: 4 }));
    }
    const COORD = ['x', 'x1', 'x2', 'c1', 'c2', 'bx1', 'bx2', 'a', 'b', 'delta', 'half', 'jump', 'd'];
    const FVAL = ['fx', 'fc', 'best', 'opt', 'pen', 'fit'];

    const fnName = (id) => t(id === 'rastrigin' ? 'fnRastrigin' : 'fnHimmelblau');
    const newChromosome = (seed) => (isReal ? Fn.randomPoint(s.fn, seed) : Fn.randomBits(seed, s.k));
    const changed = (m) => { ctx.stop(); manual.clearError(); sync(); ctx.onChange(m); };
    const atEnd = () => { const st = ctx.currentStep(); return st && st.stage >= 4 ? 'end' : 'keep'; };
    const inst = () => (isReal ? { fn: s.fn } : { fn: s.fn, k: s.k });
    /** Punto que representa el cromosoma (reales: el propio; binaria: el decodificado). */
    const point = () => (isReal ? s.x.slice() : Fn.decodeBits(s.fn, s.x, s.k, s.variant).point);

    // ---------- Controles ----------
    const fnSel = C.select({ id: 'fnSelect', labelKey: 'fnSelect', onChange: (v) => {
      const p = point();
      s.fn = v;
      if (isReal) s.x = Fn.inBox(v, p) ? p : Fn.randomPoint(v, R.newSeed());
      else s.x = Fn.encodePoint(v, p, s.k, s.variant);
      changed('start');
    } });
    const row = [fnSel.field];
    let kRange = null;
    let codeSel = null;
    let treat = null;
    let lambda = null;
    if (isReal) {
      treat = C.select({ id: 'variant', labelKey: 'treatmentBox', onChange: (v) => { s.variant = v; changed('keepType'); } });
      lambda = C.range({ id: 'lambda', labelKey: 'lambda', min: P.LAMBDA.min, max: P.LAMBDA.max, step: P.LAMBDA.step, value: s.lambda,
        onInput: (v) => { s.lambda = v; changed('keepType'); } });
      row.push(treat.field, lambda.field);
    } else {
      kRange = C.range({ id: 'kBits', labelKey: 'kBits', min: Fn.LIMITS.kMin, max: Fn.LIMITS.kMax, value: s.k,
        onInput: (v) => { const p = point(); s.k = v; s.x = Fn.encodePoint(s.fn, p, s.k, s.variant); changed('keepType'); } });
      codeSel = C.select({ id: 'variant', labelKey: 'codeSelect', onChange: (v) => {
        const p = point();
        s.variant = v;
        s.x = Fn.encodePoint(s.fn, p, s.k, v);   // el mismo punto, escrito en el otro código
        changed('keepType');
      } });
      row.push(kRange.field, codeSel.field);
    }
    const buttons = [C.button({ id: 'btnChromosome', labelKey: 'randomChromosome', primary: true, onClick: () => { s.x = newChromosome(R.newSeed()); changed('keepType'); } })];
    if (isReal) buttons.push(C.button({ id: 'btnOutside', labelKey: 'randomOutside', onClick: () => { s.x = Fn.randomOutside(s.fn, R.newSeed()); changed('keepType'); } }));
    const desc = C.hint('variantDesc');
    const manual = C.manual({
      summaryKey: isReal ? 'manualPoint' : 'manualBits',
      hintKey: isReal ? 'manualPointHint' : 'manualBitsHint',
      fields: [{ id: 'inX', labelKey: 'manualChromosome' }],
      onSubmit(v) {
        let x;
        if (isReal) {
          const parts = v.inX.trim().replace(/[()]/g, '').split(/\s*[;\s]\s*|\s*,\s+/).filter(Boolean);
          x = parts.map((q) => Number(q.replace(',', '.')));
          if (x.length !== 2 || x.some((q) => !Number.isFinite(q))) return 'errRealLength';
          x = x.map(Fn.round2);
        } else x = v.inX.replace(/[\s,;]+/g, '').split('').map(Number);
        const err = P.validate(inst(), x);
        if (err) return err;
        s.x = x;
        ctx.stop(); sync(); ctx.onChange('keepType');
        return null;
      },
    });
    ctx.controlsEl.replaceChildren(C.row(...row, C.buttons(...buttons)), desc, manual.el);

    // ---------- Tarjeta: las tres codificaciones ----------
    const card = C.card('threeTitle', 'threeNote');
    const sameLine = C.el('p', 'both-same');
    const scroll = C.el('div', 'table-scroll');
    const table = C.el('table', 'cmp-table both-table', { id: 'threeTable' });
    scroll.append(table);
    const cmpLink = C.el('a', 'cmp-link cmp-link-inline');
    card.append(sameLine, scroll, cmpLink);
    const extras = [card];
    let treatCard = null;
    let treatTable = null;
    if (isReal) {
      treatCard = C.card('treatTitle', 'treatNote');
      const sc2 = C.el('div', 'table-scroll');
      treatTable = C.el('table', 'cmp-table treat-table', { id: 'treatTable' });
      sc2.append(treatTable);
      treatCard.append(sc2);
      extras.unshift(treatCard);
    }
    ctx.extraEl.replaceChildren(...extras);

    const ptStr = (p) => `(${fmtCoord(p[0])}; ${fmtCoord(p[1])})`;
    const bitStr = (bits, k) => `${bits.slice(0, k).join('')} ${bits.slice(k).join('')}`;
    const realHash = (p) => p.map((v) => String(Fn.round2(v))).join('_');

    function href(enc, extra) {
      const q = new URLSearchParams(Object.assign({ enc, lang: ctx.lang(), fn: s.fn }, extra));
      return `#${q.toString()}`;
    }

    function renderThree() {
      const p = point();
      const clamped = Fn.clampPoint(s.fn, p.map(Fn.round2));
      const kk = s.k;
      const std = Fn.encodePoint(s.fn, isReal ? clamped : p, kk, 'standard');
      const gry = Fn.encodePoint(s.fn, isReal ? clamped : p, kk, 'gray');
      const mono = (txt) => { const c = C.el('code', 'mono'); c.textContent = txt; return c; };
      sameLine.replaceChildren(t(isReal ? 'threeSameReal' : 'threeSameBits', { k: kk }), ' ',
        t('encReal'), ' ', mono(ptStr(isReal ? p : p.map(Fn.round2))), ' · ', t('encStandard'), ' ', mono(bitStr(std, kk)), ' · ', t('encGray'), ' ', mono(bitStr(gry, kk)));
      const head = C.el('tr');
      ['colEncoding', 'colGenes', 'colSpace', 'colPrecision', 'colBox', 'colOneGene'].forEach((key) => {
        const th = C.el('th', null, { scope: 'col' });
        th.textContent = t(key);
        head.append(th);
      });
      const thead = C.el('thead');
      thead.append(head);
      const F = Fn.fnOf(s.fn);
      const n = Math.pow(2, kk);
      const bitsRow = (code) => ({
        id: code, name: t(code === 'gray' ? 'encGray' : 'encStandard'), genes: t('genesBits', { nb: 2 * kk, k: kk }),
        space: `${Fn.power(2, 2 * kk)} = ${fmt(n * n)}`, prec: `Δ = ${fmtCoord(Fn.delta(s.fn, kk))}`, box: t('boxBits'),
        one: t(code === 'gray' ? 'oneGray' : 'oneStd', { k: kk, jump: fmtCoord(Math.pow(2, kk - 1) * Fn.delta(s.fn, kk)) }),
        href: href('function-bits', { v: code, k: String(kk), x: (code === 'gray' ? gry : std).join('') }),
      });
      const rows = [
        { id: 'real', name: t('encReal'), genes: t('genesReal'), space: t('spaceReal', { a: fmtCoord(F.a), b: fmtCoord(F.b) }), prec: t('precReal'),
          box: t('boxReal'), one: t('oneReal'), href: href('function-real', { k: String(kk), x: realHash(isReal ? p : p.map(Fn.round2)) }) },
        bitsRow('standard'), bitsRow('gray'),
      ];
      const current = isReal ? 'real' : s.variant;
      const tbody = C.el('tbody');
      rows.forEach((r) => {
        const cur = r.id === current;
        const tr = C.el('tr', cur ? 'current' : null, cur ? { 'aria-current': 'true' } : {});
        const th = C.el('th', null, { scope: 'row' });
        if (cur) th.textContent = r.name;
        else {
          const a = C.el('a', null, { href: r.href });
          a.textContent = r.name;
          th.append(a);
        }
        tr.append(th, ...[r.genes, r.space, r.prec, r.box, r.one].map((txt) => { const td = C.el('td'); td.textContent = txt; return td; }));
        tbody.append(tr);
      });
      table.replaceChildren(thead, tbody);
      const q = new URLSearchParams({ cmp: 'function', lang: ctx.lang(), from: content.id, fn: s.fn, k: String(kk), x: realHash(isReal ? p : p.map(Fn.round2)) });
      if (!isReal) q.set('v', s.variant);
      cmpLink.href = `#${q.toString()}`;
      cmpLink.replaceChildren(C.el('span'), C.el('span'));
      cmpLink.firstChild.textContent = t('cmpLink');
      cmpLink.lastChild.textContent = '→';
      cmpLink.lastChild.setAttribute('aria-hidden', 'true');
    }

    function renderTreat() {
      const l = ctx.lang();
      const head = C.el('tr');
      ['colTreatment', 'colEvaluated', 'colFx', 'colFitness'].forEach((key) => {
        const th = C.el('th', null, { scope: 'col' });
        th.textContent = t(key);
        head.append(th);
      });
      const thead = C.el('thead');
      thead.append(head);
      const tbody = C.el('tbody');
      P.VARIANTS.forEach((v) => {
        const ev = P.evaluate(inst(), s.x, v, { lambda: s.lambda });
        const tr = C.el('tr', v === s.variant ? 'current' : null, v === s.variant ? { 'aria-current': 'true' } : {});
        const name = C.el('th', null, { scope: 'row' });
        const btn = C.el('button', 'link-btn', { type: 'button' });
        btn.textContent = content.variants[v].name[l];
        btn.addEventListener('click', () => { s.variant = v; changed('keepType'); });
        name.append(btn);
        const moved = ev.solution[0] !== s.x[0] || ev.solution[1] !== s.x[1];
        const cells = [
          ptStr(ev.solution) + (ev.feasible || moved ? '' : ` (${t('outsideMark')})`),
          fmtF(Fn.evalAt(s.fn, ev.solution)),
          fmtF(ev.fitness),
        ];
        tr.append(name, ...cells.map((txt, kx) => { const td = C.el('td', kx === 0 ? `mono${moved ? ' bit-changed' : ''}` : 'num'); td.textContent = txt; return td; }));
        tbody.append(tr);
      });
      treatTable.replaceChildren(thead, tbody);
    }

    function sync() {
      const l = ctx.lang();
      fnSel.setOptions(Fn.FN_IDS.map((id) => ({ value: id, label: fnName(id) })), s.fn);
      if (isReal) {
        treat.setOptions(P.VARIANTS.map((v) => ({ value: v, label: content.variants[v].name[l] })), s.variant);
        lambda.field.hidden = s.variant !== 'penalty';
        lambda.set(s.lambda);
        manual.set({ inX: s.x.map((v) => String(v)).join(' ') });
        renderTreat();
      } else {
        kRange.set(s.k);
        codeSel.setOptions(P.VARIANTS.map((v) => ({ value: v, label: content.variants[v].name[l] })), s.variant);
        manual.set({ inX: bitStr(s.x, s.k) });
      }
      desc.textContent = content.variants[s.variant].desc[l];
      renderThree();
    }

    // ---------- Vista ----------
    const view = root.GAX.createFunctionView({
      svg: ctx.svg, t, fmt, fmtCoord, fmtF, mode,
      best: () => Fn.bestRepresentable(s.fn, s.k),
      onBit(j) {
        ctx.stop();
        s.x = s.x.slice();
        s.x[j] = 1 - s.x[j];
        changed(atEnd());
      },
      onMap(p) {
        if (isReal) {
          const q = p.map(Fn.round2);
          if (q[0] === s.x[0] && q[1] === s.x[1]) return;
          s.x = q;
        } else {
          const nb = Fn.encodePoint(s.fn, p, s.k, s.variant);
          if (nb.join('') === s.x.join('')) return;
          s.x = nb;
        }
        changed(atEnd());
      },
      onNudge(dx, dy) {
        const lim = Fn.LIMITS.realMax;
        s.x = [Fn.round2(Math.max(-lim, Math.min(lim, s.x[0] + dx))), Fn.round2(Math.max(-lim, Math.min(lim, s.x[1] + dy)))];
        changed(atEnd());
      },
    });

    return {
      view,
      init(q) {
        const f = q.get('fn');
        s.fn = Fn.FN_IDS.indexOf(f) !== -1 ? f : 'himmelblau';
        const vr = q.get('v');
        if (P.VARIANTS.indexOf(vr) !== -1) s.variant = vr;
        const kq = Number(q.get('k'));
        if (Number.isInteger(kq) && kq >= Fn.LIMITS.kMin && kq <= Fn.LIMITS.kMax) s.k = kq;
        if (isReal) {
          const lam = Number(q.get('l'));
          if (q.get('l') != null && lam >= P.LAMBDA.min && lam <= P.LAMBDA.max) s.lambda = Math.round(lam);
        }
        const xs = q.get('x');
        let x = null;
        if (xs) x = isReal ? xs.split('_').map((v) => (v.trim() === '' ? NaN : Fn.round2(Number(v)))) : xs.split('').map(Number);
        s.x = x && !P.validate(inst(), x) ? x : newChromosome(R.newSeed());
        sync();
      },
      run() {
        view.setProblem(s.fn, s.k);
        return P.run(inst(), s.x, { variant: s.variant, lambda: s.lambda });
      },
      hash() {
        const h = [['fn', s.fn], ['v', s.variant]];
        if (isReal) {
          if (s.variant === 'penalty') h.push(['l', String(s.lambda)]);
          h.push(['k', String(s.k)], ['x', realHash(s.x)]);   // k no se usa aquí, pero lo usa la tarjeta de las tres codificaciones
        } else h.push(['k', String(s.k)], ['x', s.x.join('')]);
        return h;
      },
      legend() {
        const items = [['sw-fmap', 'legendLandscape'], ['sw-fmin', 'legendMin']];
        if (isReal) {
          items.push(['sw-fpoint', 'legendPoint'], ['sw-fout', 'legendOutside'], ['sw-fpoint-out', 'legendPointOut']);
          if (s.variant !== 'penalty') items.push(['sw-ftreat', 'legendTreated']);
          items.push(['sw-line sw-dec-line', 'legendDecLine']);
        } else {
          items.push(['sw-gene-one', 'legendBitOne'], ['sw-gene-zero', 'legendBitZero']);
          if (s.k <= 6) items.push(['sw-lattice', 'legendLattice']);
          items.push(['sw-fpoint', 'legendPointBits'], ['sw-line sw-dec-line', 'legendDecLine'], ['sw-fbest', 'legendBest'], ['sw-nb', 'legendNeighbour'], ['sw-cliff', 'legendCliff']);
        }
        return items;
      },
      variant: () => s.variant,
      getPage: () => (isReal
        ? { fn: s.fn, x: s.x.slice(), variant: s.variant, lambda: s.lambda }
        : { fn: s.fn, k: s.k, variant: s.variant, x: s.x.slice() }),
      setPage(p) {
        s.fn = p.fn;
        s.variant = p.variant;
        if (isReal) s.lambda = p.lambda; else s.k = p.k;
        s.x = p.x.slice();
        manual.clearError();
        sync();
      },
      editHintKey: isReal ? 'editHintReal' : 'editHintBits',
      formulaArg: () => s.fn,
      formatParam(name, v) {
        if (typeof v !== 'number') return null;
        if (COORD.indexOf(name) !== -1) return fmtCoord(v);
        if (FVAL.indexOf(name) !== -1) return fmtF(v);
        return null;
      },
      formulaInstance: (res) => (isReal
        ? t(s.fn === 'rastrigin' ? 'formulaInstanceRastrigin' : 'formulaInstanceHimmelblau', { a: fmtCoord(res.stats.a), b: fmtCoord(res.stats.b) })
        : t('formulaInstanceBits', { name: fnName(s.fn), k: s.k, total: fmt(res.stats.total), delta: fmtCoord(res.stats.delta), best: fmtF(res.stats.best.f) })),
      onLanguage() { if (lambda) lambda.refresh(); if (kRange) kRange.refresh(); manual.refresh(); sync(); },
    };
  }

  (root.GAX = root.GAX || {}).createFunctionUI = createFunctionUI;
})(typeof self !== 'undefined' ? self : this);
