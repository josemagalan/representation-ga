/*
 * Pantalla «Comparar codificaciones» (#cmp=assignment | #cmp=function): la misma solución escrita en
 * cada codificación, el espacio de búsqueda de cada una y su localidad (vecinos a un gen), con el valor
 * del ejemplo en negrita y, entre paréntesis, la media sobre soluciones al azar. La lógica está en
 * js/compare.js; aquí solo se pinta y se guarda el estado en la URL.
 *
 * URL: #cmp=assignment&lang=es&from=<codificación>&s=…&n=…&m=…&p=…&a=1-2-3…
 *      #cmp=function&lang=es&from=<codificación>&v=<código>&fn=…&k=…&x=x₁_x₂
 */
(function (root) {
  'use strict';

  const SAMPLES = 1000;

  function createComparePage(opts) {
    const G = root.GAX;
    const C = G.compare;
    const A = G.assignment;
    const Fn = G.func;
    const R = G.rng;
    const t = opts.t;
    const host = opts.root;
    const lang = opts.lang;
    const loc = () => (lang() === 'es' ? 'es-ES' : 'en-GB');
    const minus = (s) => s.replace(/^-/, '−');
    const s = { problem: null, from: null, v: null, seed: 1, inst: null, a: null, fn: 'himmelblau', k: Fn.LIMITS.kDef, p: null };
    const meanCache = new Map();
    let token = 0;

    const el = (tag, cls, attrs) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) e.setAttribute(k, v); });
      return e;
    };
    const txt = (tag, cls, text, attrs) => { const e = el(tag, cls, attrs); e.textContent = text; return e; };

    // ---------- Números ----------
    const num = (v, d) => minus(v.toLocaleString(loc(), { maximumFractionDigits: d }));
    function pct(v) {
      const p = 100 * v;
      const d = p === 0 || p >= 10 ? 0 : (p >= 1 ? 1 : null);
      const str = d == null ? p.toLocaleString(loc(), { maximumSignificantDigits: 2 }) : p.toLocaleString(loc(), { maximumFractionDigits: d });
      return `${str} %`;
    }
    const coord = (v) => num(Math.abs(v) < 1e-12 ? 0 : v, 4);
    function fval(v) {
      if (v === 0) return '0';
      return minus(Math.abs(v) >= 10 ? v.toLocaleString(loc(), { maximumFractionDigits: 1 }) : v.toLocaleString(loc(), { maximumSignificantDigits: 3 }));
    }
    const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    const power = (b, e) => `${b}${String(e).split('').map((d) => SUP[d]).join('')}`;

    function fmtValue(kind, v, isMean) {
      if (v == null) return '—';
      if (kind === 'pct') return pct(v);
      if (kind === 'coord') return coord(v);
      if (kind === 'fval') return fval(v);
      if (kind === 'int') return num(v, isMean ? 1 : 0);
      if (kind === 'big') return num(v, Number.isInteger(v) ? 0 : 1);
      return num(v, 2);
    }

    // ---------- Estado y URL ----------
    const pSerial = () => s.inst.p.map((r) => r.join('.')).join('-');
    function parseP(str) {
      if (!str) return null;
      const p = str.split('-').map((r) => r.split('.').map(Number));
      return A.validateInstance({ p }) ? null : { p };
    }

    function load(q) {
      s.problem = q.get('cmp');
      const from = q.get('from');
      s.from = C.problemOf(from) === s.problem ? from : null;
      s.v = q.get('v');
      if (s.problem === 'assignment') {
        s.seed = R.parseSeed(q.get('s')) ?? (R.newSeed() % 1000000);
        const inst = parseP(q.get('p'));
        const n = Number(q.get('n'));
        const m = Number(q.get('m'));
        s.inst = inst || A.randomInstance(s.seed, n >= A.LIMITS.nMin && n <= A.LIMITS.nMax ? n : 6, m >= A.LIMITS.mMin && m <= A.LIMITS.mMax ? m : 3);
        const sz = A.sizes(s.inst);
        const a = (q.get('a') || '').split('-').map(Number);
        s.a = a.length === sz.n && a.every((j) => Number.isInteger(j) && j >= 1 && j <= sz.m) ? a : A.randomAssignment(s.seed, sz.n, sz.m);
      } else {
        const f = q.get('fn');
        s.fn = Fn.FN_IDS.indexOf(f) !== -1 ? f : 'himmelblau';
        const k = Number(q.get('k'));
        s.k = Number.isInteger(k) && k >= Fn.LIMITS.kMin && k <= Fn.LIMITS.kMax ? k : Fn.LIMITS.kDef;
        const x = (q.get('x') || '').split('_').map((v) => (v.trim() === '' ? NaN : Number(v)));   // «1_» no es (1, 0)
        s.p = x.length === 2 && x.every(Number.isFinite) ? C.comparePoint(s.fn, x) : Fn.randomPoint(s.fn, R.newSeed());
      }
    }

    function hash() {
      const h = [['cmp', s.problem], ['lang', lang()]];
      if (s.from) h.push(['from', s.from]);
      if (s.v) h.push(['v', s.v]);
      if (s.problem === 'assignment') {
        const { n, m } = A.sizes(s.inst);
        h.push(['s', String(s.seed)], ['n', String(n)], ['m', String(m)], ['p', pSerial()], ['a', s.a.join('-')]);
      } else h.push(['fn', s.fn], ['k', String(s.k)], ['x', s.p.map((v) => String(Fn.round2(v))).join('_')]);
      return h;
    }

    /** Enlace a la página de una fila (o de la codificación de origen) con esta instancia y esta solución. */
    function pageHref(rowId) {
      const pg = C.PAGE[rowId];
      const q = new URLSearchParams({ enc: pg.enc, lang: lang() });
      if (s.problem === 'assignment') {
        const { n, m } = A.sizes(s.inst);
        q.set('s', String(s.seed)); q.set('n', String(n)); q.set('m', String(m)); q.set('p', pSerial());
        q.set('x', pg.enc === 'assignment-int' ? s.a.join('-') : A.toMatrix(s.a, m).map((r) => r.join('')).join('-'));
      } else {
        q.set('fn', s.fn);
        if (pg.variant) q.set('v', pg.variant);
        q.set('k', String(s.k));
        if (pg.enc === 'function-real') q.set('x', s.p.map((v) => String(Fn.round2(v))).join('_'));
        else q.set('x', Fn.encodePoint(s.fn, s.p, s.k, pg.variant).join(''));
      }
      return `#${q.toString()}`;
    }
    /** Fila de la codificación de origen (en la binaria, la del código con que se venía). */
    function fromRow() {
      if (!s.from) return null;
      if (s.from === 'function-bits') return s.v === 'gray' ? 'function-gray' : 'function-standard';
      return s.from;
    }

    // ---------- Pintado ----------
    const rowName = (id) => t(`cmpEnc_${id}`);

    function renderHead() {
      const head = el('header', 'op-head');
      const back = el('a', 'back', { href: s.from ? pageHref(fromRow()) : `#lang=${lang()}` });
      back.append(txt('span', null, '← ', { 'aria-hidden': 'true' }), txt('span', null, s.from ? t('cmpBackTo', { name: rowName(fromRow()) }) : t('allEncodings')));
      head.append(back, txt('p', 'eyebrow', t(`cmpEyebrow_${s.problem}`)), txt('h1', null, t('cmpTitle')), txt('p', 'subtitle', t(`cmpLead_${s.problem}`)));
      return head;
    }

    function controls() {
      const Ctl = G.createControls(t);
      const rerender = () => { update(); opts.onChange(); };
      if (s.problem === 'assignment') {
        const { n, m } = A.sizes(s.inst);
        const regen = (nn, mm) => { s.seed = R.newSeed() % 1000000; s.inst = A.randomInstance(s.seed, nn, mm); s.a = A.randomAssignment(s.seed, nn, mm); };
        const rn = Ctl.range({ id: 'cmpTasks', labelKey: 'nTasks', min: A.LIMITS.nMin, max: A.LIMITS.nMax, value: n, onInput: (v) => { regen(v, A.sizes(s.inst).m); rerender(); } });
        const rm = Ctl.range({ id: 'cmpMachines', labelKey: 'nMachines', min: A.LIMITS.mMin, max: A.LIMITS.mMax, value: m, onInput: (v) => { regen(A.sizes(s.inst).n, v); rerender(); } });
        return Ctl.row(rn.field, rm.field, Ctl.buttons(
          Ctl.button({ id: 'cmpInstance', labelKey: 'randomInstance', primary: true, onClick: () => { const z = A.sizes(s.inst); regen(z.n, z.m); rerender(); } }),
          Ctl.button({ id: 'cmpSolution', labelKey: 'cmpRandomSolution', onClick: () => { const z = A.sizes(s.inst); s.a = A.randomAssignment(R.newSeed(), z.n, z.m); rerender(); } })));
      }
      const fsel = Ctl.select({ id: 'cmpFn', labelKey: 'fnSelect', onChange: (v) => { s.fn = v; s.p = C.comparePoint(v, s.p); rerender(); } });
      fsel.setOptions(Fn.FN_IDS.map((id) => ({ value: id, label: t(id === 'rastrigin' ? 'fnRastrigin' : 'fnHimmelblau') })), s.fn);
      const kr = Ctl.range({ id: 'cmpK', labelKey: 'kBits', min: Fn.LIMITS.kMin, max: Fn.LIMITS.kMax, value: s.k, onInput: (v) => { s.k = v; rerender(); } });
      return Ctl.row(fsel.field, kr.field, Ctl.buttons(
        Ctl.button({ id: 'cmpPoint', labelKey: 'cmpRandomPoint', primary: true, onClick: () => { s.p = Fn.randomPoint(s.fn, R.newSeed()); rerender(); } })));
    }

    function geneRow(label, values, cls, heads) {
      const grid = el('div', 'cmp-grid');
      const n = values.length;
      if (heads) {
        const hr = el('div', 'cmp-row');
        hr.style.setProperty('--n', n);
        hr.append(el('span'), ...heads.map((h) => txt('span', 'cmp-idx-num', h)));
        grid.append(hr);
      }
      const r = el('div', 'cmp-row');
      r.style.setProperty('--n', n);
      r.append(txt('span', 'cmp-row-label', label), ...values.map((v, i) => txt('span', `cmp-gene ${typeof cls === 'function' ? cls(v, i) : cls}`, String(v))));
      grid.append(r);
      return grid;
    }

    function chromosome(row) {
      const box = el('div', 'cmp-scroll');
      if (row.id === 'assignment-int') {
        box.append(geneRow('a', row.chrom, 'p1', row.chrom.map((_, i) => t('taskShort', { i: i + 1 }))));
      } else if (row.id === 'assignment-matrix') {
        const g = el('div', 'cmp-grid');
        const n = row.chrom.length;
        const m = row.chrom[0].length;
        const hr = el('div', 'cmp-row');
        hr.style.setProperty('--n', n);
        hr.append(el('span'), ...row.chrom.map((_, i) => txt('span', 'cmp-idx-num', t('taskShort', { i: i + 1 }))));
        g.append(hr);
        for (let j = 0; j < m; j++) {
          const r = el('div', 'cmp-row');
          r.style.setProperty('--n', n);
          r.append(txt('span', 'cmp-row-label', t('machineShort', { j: j + 1 })), ...row.chrom.map((col) => txt('span', `cmp-gene ${col[j] ? 'p1' : 'same'}`, String(col[j]))));
          g.append(r);
        }
        box.append(g);
      } else if (row.id === 'function-real') {
        const g = geneRow('x', row.chrom.map(coord), 'p1', [t('geneX1'), t('geneX2')]);
        g.dataset.rep = 'real';
        box.append(g);
      } else {
        const k = row.chrom.length / 2;
        const g = geneRow('g', row.chrom, (v) => (v ? 'p1' : 'same'), row.chrom.map((_, j) => (j === 0 ? 'x₁' : (j === k ? 'x₂' : ''))));
        g.classList.add('cmp-bits');
        box.append(g);
      }
      return box;
    }

    let headHost = null;
    let solHost = null;
    let tablesHost = null;

    function solutionCard() {
      const card = el('section', 'card', { 'aria-labelledby': 'cmp-sol-title' });
      const head = el('div', 'cmp-section-head');
      head.append(txt('h2', 'learn-title', t('cmpSolutionTitle'), { id: 'cmp-sol-title' }));
      solHost = el('div');
      card.append(head, controls(), solHost);
      return card;
    }

    function solutionBody(res) {
      const frag = document.createDocumentFragment();
      let line;
      if (s.problem === 'assignment') line = t('cmpSolutionAssign', { vec: res.solution.join(' '), cmax: res.makespan });
      else line = t('cmpSolutionFn', { x1: coord(res.point[0]), x2: coord(res.point[1]), k: s.k, g1: coord(res.grid[0]), g2: coord(res.grid[1]) });
      frag.append(txt('p', 'hint cmp-sol-line', line));
      const list = el('div', 'cmp-children');
      const from = fromRow();
      res.rows.forEach((row) => {
        const item = el('div', `cmp-op${row.id === from ? ' from' : ''}`);
        const h = el('div', 'cmp-op-head');
        h.append(txt('a', 'cmp-op-name', rowName(row.id), { href: pageHref(row.id) }), txt('span', 'cmp-op-meta', t(`cmpMeta_${row.id}`, { k: s.k })));
        item.append(h, chromosome(row));
        list.append(item);
      });
      frag.append(list);
      return frag;
    }

    function spaceText(row, col) {
      const sp = row.space;
      if (col === 'genes') {
        if (s.problem === 'assignment') return sp.genes.int ? t('cmpGenesInt', { n: sp.genes.n }) : t('cmpGenesMatrix', { nm: sp.genes.nm });
        return sp.genes.real ? t('genesReal') : t('genesBits', { nb: sp.genes.nb, k: sp.genes.k });
      }
      if (col === 'size') return sp.size ? `${power(sp.size.base, sp.size.exp)} = ${num(sp.size.value, 0)}` : t('cmpSizeReal');
      if (col === 'box') return t(sp.box === 'in' ? 'boxBits' : 'cmpBoxReal');
      return null;
    }

    function table(kind, res, mean) {
      const cols = C.COLUMNS[s.problem][kind];
      const tbl = el('table', 'cmp-table');
      const hr = el('tr');
      hr.append(txt('th', null, t('colEncoding'), { scope: 'col' }), ...cols.map((c) => txt('th', null, t(`cmpCol_${c.id}`), { scope: 'col' })));
      const thead = el('thead');
      thead.append(hr);
      const tbody = el('tbody');
      const from = fromRow();
      res.rows.forEach((row) => {
        const tr = el('tr', row.id === from ? 'from' : null);
        const th = el('th', null, { scope: 'row' });
        th.append(txt('a', null, rowName(row.id), { href: pageHref(row.id) }));
        tr.append(th);
        cols.forEach((c) => {
          const td = el('td');
          const cell = el('div', 'cmp-cell');
          const nums = el('div', 'cmp-nums');
          if (c.kind === 'text') {
            td.textContent = spaceText(row, c.id);
            tr.append(td);
            return;
          }
          const v = kind === 'space' ? row.space[c.id] : row.local[c.id];
          let m = null;
          if (kind === 'space' && c.mean) m = row.space[`${c.id}Mean`];
          if (kind === 'local') m = mean ? mean[row.id][c.id] : undefined;
          nums.append(txt('span', 'cmp-val', fmtValue(c.kind, v, false)));
          if (m !== null) nums.append(txt('span', 'cmp-ex', m === undefined ? '(…)' : `(${fmtValue(c.kind, m, true)})`));
          cell.append(nums);
          if (c.kind === 'pct') {
            const bar = el('div', 'cmp-bar', { 'aria-hidden': 'true' });
            const fill = el('div', 'cmp-fill');
            fill.style.width = `${Math.max(0, Math.min(1, v)) * 100}%`;
            bar.append(fill);
            if (m != null) {
              const tick = el('div', 'cmp-tick');
              tick.style.left = `${Math.max(0, Math.min(1, m)) * 100}%`;
              bar.append(tick);
            }
            cell.append(bar);
          }
          td.append(cell);
          tr.append(td);
        });
        tbody.append(tr);
      });
      tbl.append(thead, tbody);
      const sc = el('div', 'table-scroll');
      sc.append(tbl);
      return sc;
    }

    function tablesCard(res, mean) {
      const frag = document.createDocumentFragment();
      const c1 = el('section', 'card', { 'aria-labelledby': 'cmp-space-title' });
      c1.append(txt('h2', 'learn-title', t('cmpSpaceTitle'), { id: 'cmp-space-title' }), txt('p', 'hint', t(`cmpSpaceNote_${s.problem}`)), table('space', res, mean));
      const c2 = el('section', 'card', { 'aria-labelledby': 'cmp-local-title' });
      c2.append(txt('h2', 'learn-title', t('cmpLocalTitle'), { id: 'cmp-local-title' }),
        txt('p', 'hint', t(`cmpLocalNote_${s.problem}`, { samples: num(SAMPLES, 0) })), table('local', res, mean));
      const cols = C.COLUMNS[s.problem].space.concat(C.COLUMNS[s.problem].local).filter((c) => c.id !== 'genes' && c.id !== 'size');
      c2.append(txt('h3', 'cmp-defs-title', t('cmpDefsTitle')));
      const dl = el('dl', 'cmp-defs');
      cols.forEach((c) => dl.append(txt('dt', null, t(`cmpCol_${c.id}`)), txt('dd', null, t(`cmpDef_${s.problem}_${c.id}`))));
      c2.append(dl, txt('p', 'hint cmp-refs', t(`cmpRefs_${s.problem}`)));
      frag.append(c1, c2);
      return frag;
    }

    function result() {
      return s.problem === 'assignment' ? C.assignment(s.inst, s.a) : C.fn(s.fn, s.k, s.p);
    }
    function meanKey() {
      if (s.problem === 'assignment') { const { n, m } = A.sizes(s.inst); return `a:${n}:${m}`; }
      return `f:${s.fn}:${s.k}`;
    }

    /** Pantalla completa (al llegar o al cambiar de idioma). */
    function render() {
      headHost = el('div');
      tablesHost = el('div');
      host.replaceChildren(headHost, solutionCard(), tablesHost);
      update();
    }

    /** Lo que depende de la solución, sin tocar los controles (para no cortar un deslizador). */
    function update() {
      const res = result();
      const key = meanKey();
      const mean = meanCache.get(key) || null;
      headHost.replaceChildren(renderHead());
      solHost.replaceChildren(solutionBody(res));
      tablesHost.replaceChildren(tablesCard(res, mean));
      document.title = t('cmpDocTitle', { name: t(`cmpProblem_${s.problem}`) });
      if (!mean) {
        // La media (1000 soluciones al azar) justo después del primer dibujado, para no bloquearlo
        const my = ++token;
        setTimeout(() => {
          if (my !== token) return;
          let m;
          if (s.problem === 'assignment') { const { n, m: mm } = A.sizes(s.inst); m = C.assignmentMean(n, mm, SAMPLES, 7); } else m = C.fnMean(s.fn, s.k, SAMPLES, 7);
          meanCache.set(key, m);
          if (my === token && meanKey() === key) tablesHost.replaceChildren(tablesCard(result(), m));
        }, 30);
      }
    }

    return {
      show(q) { load(q); render(); },
      render,
      hash,
      problem: () => s.problem,
    };
  }

  (root.GAX = root.GAX || {}).createComparePage = createComparePage;
})(typeof self !== 'undefined' ? self : this);
