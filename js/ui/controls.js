/*
 * Piezas de los paneles de controles de cada codificación: deslizadores, números, desplegables,
 * botones y el formulario de datos a mano. Las etiquetas llevan data-i18n, así que cambian solas
 * con el idioma.
 */
(function (root) {
  'use strict';

  function createControls(t) {
    function el(tag, cls, attrs) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) e.setAttribute(k, v); });
      return e;
    }
    function label(forId, key) {
      const l = el('label', null, { for: forId, 'data-i18n': key });
      l.textContent = t(key);
      return l;
    }
    function field(forId, key, ...children) {
      const f = el('div', 'field');
      f.append(label(forId, key), ...children);
      return f;
    }

    function range(o) {
      const input = el('input', null, { type: 'range', id: o.id, min: o.min, max: o.max, step: o.step || 1, value: o.value });
      const out = el('output', null, { id: `${o.id}Out`, for: o.id });
      const fmt = o.format || ((v) => v);
      out.textContent = fmt(Number(o.value));
      const wrap = el('div', 'range-wrap');
      wrap.append(input, out);
      const f = field(o.id, o.labelKey, wrap);
      input.addEventListener('input', () => { out.textContent = fmt(Number(input.value)); if (o.onInput) o.onInput(Number(input.value)); });
      return {
        field: f, input,
        set(v) { input.value = v; out.textContent = fmt(Number(v)); },
        setMax(m) { input.max = m; },
        refresh() { out.textContent = fmt(Number(input.value)); },
      };
    }

    function number(o) {
      const input = el('input', null, { type: 'number', id: o.id, min: o.min, max: o.max, step: 1, inputmode: 'numeric' });
      input.addEventListener('change', () => o.onChange(Number(input.value)));
      return { field: field(o.id, o.labelKey, input), input, set(v) { input.value = v; } };
    }

    function select(o) {
      const sel = el('select', null, { id: o.id });
      sel.addEventListener('change', () => o.onChange(sel.value));
      return {
        field: field(o.id, o.labelKey, sel), input: sel,
        setOptions(opts, value) {
          sel.replaceChildren(...opts.map((x) => { const op = el('option'); op.value = x.value; op.textContent = x.label; return op; }));
          sel.value = value;
        },
      };
    }

    function checkbox(o) {
      const wrap = el('label', 'sync check-field');
      const input = el('input', null, { type: 'checkbox', id: o.id });
      const span = el('span', null, { 'data-i18n': o.labelKey });
      span.textContent = t(o.labelKey);
      wrap.append(input, span);
      input.addEventListener('change', () => o.onChange(input.checked));
      return { field: wrap, input, set(v) { input.checked = !!v; } };
    }

    function button(o) {
      const b = el('button', `btn${o.primary ? ' primary' : ''}`, { type: 'button', id: o.id, 'data-i18n': o.labelKey });
      b.textContent = t(o.labelKey);
      b.addEventListener('click', o.onClick);
      return b;
    }

    function buttons(...bs) {
      const d = el('div', 'buttons');
      d.append(...bs);
      return d;
    }

    function row(...children) {
      const d = el('div', 'control-row');
      d.append(...children);
      return d;
    }

    function hint(id) {
      return el('p', 'hint variant-desc', { id });
    }

    /** Formulario de datos a mano: fields = [{ id, labelKey }]; onSubmit(values) devuelve una clave de error o null. */
    function manual(o) {
      const det = el('details', null, { id: o.id || 'manual' });
      const sum = el('summary', null, { 'data-i18n': o.summaryKey });
      sum.textContent = t(o.summaryKey);
      const form = el('form', 'manual-form', { novalidate: '' });
      const h = el('p', 'hint', { 'data-i18n': o.hintKey });
      h.textContent = t(o.hintKey);
      const grid = el('div', 'manual-grid');
      const inputs = {};
      o.fields.forEach((f) => {
        const input = el('input', null, { type: 'text', id: f.id, autocomplete: 'off', spellcheck: 'false' });
        inputs[f.id] = input;
        grid.append(label(f.id, f.labelKey), input);
      });
      const actions = el('div', 'manual-actions');
      const submit = el('button', 'btn primary', { type: 'submit', 'data-i18n': 'apply' });
      submit.textContent = t('apply');
      const err = el('p', 'error', { role: 'alert' });
      actions.append(submit, err);
      form.append(h, grid, actions);
      det.append(sum, form);
      let errKey = null;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const values = {};
        Object.keys(inputs).forEach((k) => { values[k] = inputs[k].value; });
        errKey = o.onSubmit(values);
        err.textContent = errKey ? t(errKey) : '';
      });
      return {
        el: det, inputs,
        set(values) { Object.entries(values).forEach(([k, v]) => { inputs[k].value = v; }); },
        clearError() { errKey = null; err.textContent = ''; },
        refresh() { err.textContent = errKey ? t(errKey) : ''; },
      };
    }

    function card(titleKey, noteKey) {
      const sec = el('section', 'card');
      const h = el('h2', 'learn-title', { 'data-i18n': titleKey });
      h.textContent = t(titleKey);
      sec.append(h);
      if (noteKey) {
        const p = el('p', 'hint', { 'data-i18n': noteKey });
        p.textContent = t(noteKey);
        sec.append(p);
      }
      return sec;
    }

    return { el, range, number, select, checkbox, button, buttons, row, hint, manual, card };
  }

  (root.GAX = root.GAX || {}).createControls = createControls;
})(typeof self !== 'undefined' ? self : this);
