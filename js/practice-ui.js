/*
 * Tarjeta «Practicar» de la página de una codificación: tipo de ejercicio, datos, casillas de
 * respuesta (bits, casillas, desplegables, números o el circuito del viajante), «Comprobar» con la
 * corrección elemento a elemento, «Nuevo ejercicio» y «Ver la solución».
 * La lógica (qué se pregunta, cuál es la respuesta y cómo se corrige) está en js/practice.js; aquí
 * solo se pinta. app.js decide qué hacer con onType, onNew, onSolution y onRoute.
 */
(function (root) {
  'use strict';

  function createPracticePanel(opts) {
    const G = root.GAX;
    const PR = G.practice;
    const t = opts.t;
    const host = opts.root;
    const st = { ex: null, types: [], values: {}, graded: null, err: null };

    const el = (tag, cls, attrs) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) e.setAttribute(k, v); });
      return e;
    };
    const txt = (tag, cls, text, attrs) => { const e = el(tag, cls, attrs); e.textContent = text; return e; };
    const loc = () => (opts.lang() === 'es' ? 'es-ES' : 'en-GB');
    const minus = (s) => s.replace(/^-/, '−');
    const label = (l) => t(l.key, l.params);

    // ---------- Valores ----------
    function parseNumber(raw, kind) {
      const s = String(raw).trim().replace(/−/g, '-').replace(/\s+/g, '');
      if (!s) return '';
      const norm = s.replace(',', '.');
      if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(norm)) return s;   // queda como texto: formato no válido
      return Number(norm);   // si no es entero y hace falta uno, lo dice validate
    }
    const parseTour = (raw) => String(raw).trim().split(/[\s,;–-]+/).filter(Boolean).map((p) => (/^\d+$/.test(p) ? Number(p) : NaN));

    function initialValues(ex) {
      const v = {};
      ex.groups.forEach((gr) => {
        if (gr.start) v[gr.id] = gr.start.slice();
        else if (gr.kind === 'tour') v[gr.id] = [];
        else if (gr.kind === 'bit' || gr.kind === 'check') v[gr.id] = gr.items.map(() => 0);
        else v[gr.id] = gr.items.map(() => '');
      });
      return v;
    }

    // ---------- Formato de las respuestas ----------
    function fmtNum(v, tol) {
      if (typeof v !== 'number') return String(v);
      const digits = tol === 'coord' ? 4 : (Math.abs(v) > 0 && Math.abs(v) < 0.01 ? 4 : 2);
      return minus(v.toLocaleString(loc(), { maximumFractionDigits: digits }));
    }
    function optionLabel(gr, v) {
      if (v === 'any') return t('prAny');
      if (v === 'none') return t('prNone');
      if (v === 'many') return t('prMany');
      if (st.ex.id.startsWith('assignment')) return t('machineShort', { j: v });
      return String(v);
    }
    function show(gr, v) {
      if (gr.kind === 'yesno') return t(v === 'yes' ? 'prYes' : 'prNo');
      if (gr.kind === 'check') return t(v ? 'prYes' : 'prNo');
      if (gr.kind === 'choice') return optionLabel(gr, v);
      if (gr.kind === 'num') return fmtNum(v, gr.tol);
      return String(v);
    }
    function fmtParams(params) {
      const out = {};
      Object.entries(params || {}).forEach(([k, v]) => {
        if (Array.isArray(v)) out[k] = v.map((x) => x.toLocaleString(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })).join(' · ');
        else out[k] = v;
      });
      return out;
    }

    // ---------- Pintado ----------
    function changed() {
      st.graded = null;
      st.err = null;
      paintResult();
    }

    function bitButton(gr, idx, caption) {
      const b = el('button', 'pr-bit', { type: 'button' });
      const sync = () => {
        const v = st.values[gr.id][idx];
        b.textContent = String(v);
        b.classList.toggle('one', v === 1);
        b.setAttribute('aria-pressed', String(v === 1));
        b.setAttribute('aria-label', `${caption}: ${v}`);
      };
      b.addEventListener('click', () => { st.values[gr.id][idx] = 1 - st.values[gr.id][idx]; sync(); changed(); });
      sync();
      return b;
    }

    function itemWrap(gr, idx, control, caption) {
      const w = el('div', `pr-item pr-${gr.kind}`, { 'data-group': gr.id, 'data-idx': String(idx) });
      if (caption != null) w.append(txt('span', 'pr-cap', caption));
      w.append(control, el('span', 'pr-fix'));
      return w;
    }

    function shortCaption(gr, it) {
      const p = it.label.params || {};
      const first = Object.values(p)[0];
      return first != null ? String(first) : label(it.label);
    }

    function renderGroup(gr) {
      const fs = el('fieldset', `pr-group pr-kind-${gr.kind}`);
      fs.append(txt('legend', null, t(gr.key, gr.params)));
      const items = el('div', 'pr-items');
      const single = gr.items.length === 1;
      if (gr.kind === 'bit' && gr.grid) {
        // Matriz: filas = máquinas, columnas = tareas (como en el dibujo)
        const tbl = el('table', 'pr-grid');
        const head = el('tr');
        head.append(el('th'));
        for (let i = 0; i < gr.grid.n; i++) head.append(txt('th', null, t('taskShort', { i: i + 1 }), { scope: 'col' }));
        const thead = el('thead');
        thead.append(head);
        const tbody = el('tbody');
        for (let j = 0; j < gr.grid.m; j++) {
          const tr = el('tr');
          tr.append(txt('th', null, t('machineShort', { j: j + 1 }), { scope: 'row' }));
          for (let i = 0; i < gr.grid.n; i++) {
            const q = i * gr.grid.m + j;
            const td = el('td');
            td.append(itemWrap(gr, q, bitButton(gr, q, label(gr.items[q].label)), null));
            tr.append(td);
          }
          tbody.append(tr);
        }
        tbl.append(thead, tbody);
        const sc = el('div', 'table-scroll');
        sc.append(tbl);
        items.append(sc);
      } else {
        gr.items.forEach((it, idx) => {
          const name = label(it.label);
          let control;
          let caption = single ? null : name;
          if (gr.kind === 'bit') {
            control = bitButton(gr, idx, name);
            caption = shortCaption(gr, it);
          } else if (gr.kind === 'check') {
            control = el('label', 'pr-checkbox');
            const box = el('input', null, { type: 'checkbox' });
            box.checked = st.values[gr.id][idx] === 1;
            box.addEventListener('change', () => { st.values[gr.id][idx] = box.checked ? 1 : 0; changed(); });
            control.append(box, document.createTextNode(` ${name}`));
            caption = null;
          } else if (gr.kind === 'yesno') {
            control = el('div', 'seg pr-yesno', { role: 'radiogroup', 'aria-label': t(gr.key, gr.params) });
            ['yes', 'no'].forEach((v) => {
              const b = txt('button', null, t(v === 'yes' ? 'prYes' : 'prNo'), { type: 'button', role: 'radio' });
              const sync = () => b.setAttribute('aria-checked', String(st.values[gr.id][idx] === v));
              b.addEventListener('click', () => { st.values[gr.id][idx] = v; Array.from(control.children).forEach((c) => c.setAttribute('aria-checked', String(c === b))); changed(); });
              sync();
              control.append(b);
            });
          } else if (gr.kind === 'choice') {
            control = el('select', null, { 'aria-label': name });
            const blank = txt('option', null, t('prChoose'), { value: '' });
            control.append(blank, ...gr.options.map((o) => txt('option', null, optionLabel(gr, o), { value: o })));
            control.value = st.values[gr.id][idx];
            control.addEventListener('change', () => { st.values[gr.id][idx] = control.value; changed(); });
          } else if (gr.kind === 'tour') {
            return;   // se pinta aparte, debajo
          } else {
            control = el('input', 'pr-num', { type: 'text', inputmode: gr.kind === 'int' ? 'numeric' : 'decimal', autocomplete: 'off', spellcheck: 'false', 'aria-label': single ? t(gr.key, gr.params) : name });
            const v = st.values[gr.id][idx];
            control.value = v === '' || v == null ? '' : (typeof v === 'number' ? minus(String(v).replace('.', opts.lang() === 'es' ? ',' : '.')) : v);
            control.addEventListener('input', () => { st.values[gr.id][idx] = parseNumber(control.value, gr.kind); changed(); });
          }
          items.append(itemWrap(gr, idx, control, caption));
        });
      }
      if (gr.kind === 'tour') items.append(renderTour(gr));
      fs.append(items);
      return fs;
    }

    let tourInput = null;
    function renderTour(gr) {
      const box = el('div', 'pr-tour', { 'data-group': gr.id });
      const lab = el('label', 'pr-tour-label');
      lab.append(txt('span', null, t('prTourInput')));
      tourInput = el('input', 'pr-tour-input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', spellcheck: 'false' });
      tourInput.value = st.values[gr.id].join(' ');
      tourInput.addEventListener('input', () => {
        st.values[gr.id] = parseTour(tourInput.value);
        changed();
        if (opts.onRoute) opts.onRoute(st.values[gr.id].filter((c) => Number.isInteger(c)));
      });
      lab.append(tourInput);
      const undo = txt('button', 'btn', t('prUndo'), { type: 'button' });
      undo.addEventListener('click', () => setTour(gr, st.values[gr.id].slice(0, -1)));
      const clear = txt('button', 'btn', t('prClear'), { type: 'button' });
      clear.addEventListener('click', () => setTour(gr, []));
      const btns = el('div', 'buttons');
      btns.append(undo, clear);
      box.append(lab, btns, txt('p', 'hint', t('prTourHint')), el('div', 'pr-edges'));
      return box;
    }

    function setTour(gr, list) {
      st.values[gr.id] = list;
      if (tourInput) tourInput.value = list.join(' ');
      changed();
      if (opts.onRoute) opts.onRoute(list.filter((c) => Number.isInteger(c)));
    }

    function renderGivens() {
      const box = el('div', 'practice-givens');
      box.append(txt('h3', 'pr-sub', t('prGivensTitle')));
      st.ex.givens.forEach((gv) => {
        if (gv.table) {
          const cap = txt('p', 'practice-given', t(gv.key));
          const tbl = el('table', 'cmp-table pr-dist');
          const head = el('tr');
          head.append(el('th'));
          gv.table.head.forEach((h) => head.append(txt('th', null, String(h), { scope: 'col' })));
          const thead = el('thead');
          thead.append(head);
          const tbody = el('tbody');
          gv.table.rows.forEach((row) => {
            const tr = el('tr');
            tr.append(txt('th', null, String(row[0]), { scope: 'row' }));
            row.slice(1).forEach((v) => tr.append(txt('td', 'num', v == null ? '—' : v.toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }))));
            tbody.append(tr);
          });
          tbl.append(thead, tbody);
          const sc = el('div', 'table-scroll');
          sc.append(tbl);
          box.append(cap, sc);
        } else box.append(txt('p', 'practice-given', t(gv.key, fmtParams(gv.params))));
      });
      return box;
    }

    let form = null;
    let errP = null;
    let resultBox = null;

    function render() {
      host.replaceChildren();
      const ex = st.ex;
      const head = el('div', 'practice-head');
      head.append(txt('h2', 'learn-title', t('practiceTitle'), { id: 'practice-title' }));
      const seg = el('div', 'seg pr-types', { role: 'group', 'aria-label': t('prTypeLabel') });
      st.types.forEach((ty) => {
        const b = txt('button', null, t(`prType_${ty}`), { type: 'button', 'aria-pressed': String(ty === ex.type) });
        b.addEventListener('click', () => { if (ty !== ex.type) opts.onType(ty); });
        seg.append(b);
      });
      head.append(seg);
      host.append(head, txt('p', 'hint practice-intro', `${t(`prIntro_${ex.type}`)} ${t('prIntroCommon')}`), renderGivens());

      form = el('form', 'practice-form', { novalidate: '' });
      form.append(txt('h3', 'pr-sub', t('prAnswerTitle')));
      tourInput = null;
      ex.groups.forEach((gr) => form.append(renderGroup(gr)));
      const actions = el('div', 'manual-actions');
      actions.append(txt('button', 'btn primary', t('prCheck'), { type: 'submit' }));
      const bNew = txt('button', 'btn', t('prNew'), { type: 'button' });
      bNew.addEventListener('click', () => opts.onNew());
      const bSol = txt('button', 'btn', t('prSolution'), { type: 'button' });
      bSol.addEventListener('click', () => opts.onSolution());
      errP = el('p', 'error', { role: 'alert' });
      actions.append(bNew, bSol, errP);
      form.append(actions);
      form.addEventListener('submit', (e) => { e.preventDefault(); check(); });
      resultBox = el('div', 'practice-result', { 'aria-live': 'polite' });
      host.append(form, resultBox);
      paintResult();
    }

    function check() {
      const err = PR.validate(st.ex, st.values);
      st.err = err;
      st.graded = err ? null : PR.grade(st.ex, st.values);
      paintResult();
    }

    function paintResult() {
      if (!form) return;
      errP.textContent = st.err ? t(st.err) : '';
      form.querySelectorAll('.pr-item').forEach((w) => {
        w.classList.remove('ok', 'bad');
        w.querySelector('.pr-fix').textContent = '';
      });
      form.querySelectorAll('.pr-edges').forEach((e) => e.replaceChildren());
      resultBox.replaceChildren();
      if (!st.graded) return;
      st.graded.groups.forEach((gres, gi) => {
        const gr = st.ex.groups[gi];
        if (gr.kind === 'tour') {
          const edges = form.querySelector(`.pr-tour[data-group="${gr.id}"] .pr-edges`);
          edges.append(txt('span', 'practice-result-label', t('prTourEdges')));
          gres.items.forEach((it) => edges.append(txt('span', `practice-gene ${it.ok ? 'ok' : 'bad'}`, `${it.edge[0]}–${it.edge[1]}`)));
          return;
        }
        gres.items.forEach((it, idx) => {
          const w = form.querySelector(`.pr-item[data-group="${gr.id}"][data-idx="${idx}"]`);
          if (!w) return;
          w.classList.add(it.ok ? 'ok' : 'bad');
          if (!it.ok) w.querySelector('.pr-fix').textContent = t('prCorrectWas', { v: show(gr, it.correct) });
          const b = gr.kind === 'bit' ? w.querySelector('.pr-bit') : null;
          if (b) b.title = it.ok ? '' : t('prCorrectWas', { v: show(gr, it.correct) });
        });
      });
      const all = st.graded.ok === st.graded.total;
      resultBox.append(txt('p', `practice-score${all ? ' all' : ''}`, all ? t('prAllCorrect') : t('prScore', { ok: st.graded.ok, total: st.graded.total })));
      // Viajante: una respuesta correcta y, al codificar, los 2n cromosomas equivalentes
      st.ex.groups.forEach((gr, gi) => {
        if (gr.kind !== 'tour') return;
        const answer = gr.items.map((it) => it.answer);
        if (st.graded.groups[gi].items.some((it) => !it.ok)) resultBox.append(txt('p', 'practice-given', t('prOneAnswer', { chrom: answer.join(' ') })));
        if (st.ex.type === 'encode') {
          const eq = G.problems['tsp-perm'].equivalents(answer);
          resultBox.append(txt('p', 'practice-given', t('prEquivalents', { twoN: eq.length })));
          const list = el('div', 'pr-equiv');
          const mine = st.values[gr.id].join(' ');
          eq.forEach((c) => list.append(txt('code', `mono${c.join(' ') === mine ? ' mine' : ''}`, c.join(' '))));
          resultBox.append(list);
        }
      });
    }

    return {
      /** Ejercicio nuevo (o del mismo tipo con otros datos): respuestas en blanco. */
      render(ex, types) {
        st.ex = ex;
        st.types = types;
        st.values = initialValues(ex);
        st.graded = null;
        st.err = null;
        render();
        const tg = ex.groups.find((gr) => gr.kind === 'tour');
        if (opts.onRoute) opts.onRoute(tg ? st.values[tg.id] : null);
      },
      /** Repinta los textos (cambio de idioma) sin perder las respuestas ni la corrección. */
      refresh() { if (st.ex) render(); },
      /** Ciudad pulsada en el mapa: se añade al circuito del ejercicio. */
      addCity(c) {
        const gr = st.ex && st.ex.groups.find((g) => g.kind === 'tour');
        if (!gr) return;
        const list = st.values[gr.id].filter((v) => Number.isInteger(v));
        if (list.length >= gr.items.length) return;
        setTour(gr, list.concat([c]));
      },
      route() {
        const gr = st.ex && st.ex.groups.find((g) => g.kind === 'tour');
        return gr ? st.values[gr.id].filter((v) => Number.isInteger(v)) : null;
      },
    };
  }

  (root.GAX = root.GAX || {}).createPracticePanel = createPracticePanel;
})(typeof self !== 'undefined' ? self : this);
