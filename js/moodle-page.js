/*
 * Página «Preguntas para Moodle» (#page=moodle): formulario del generador (js/moodle.js), descarga
 * del banco en Moodle XML, vista previa de una pregunta e instrucciones de uso. Textos propios en
 * ES y EN; los nombres de los tipos de ejercicio salen de js/i18n.js, los mismos de la práctica.
 */
(function (root) {
  'use strict';

  const text = {
    es: {
      title: 'Bancos de preguntas para Moodle',
      lead: 'Genera preguntas con los mismos ejercicios de la práctica y descárgalas en formato Moodle XML para importarlas en el banco de preguntas de tu curso. Cada pregunta enlaza, en su retroalimentación, con la resolución paso a paso de ese mismo ejemplo y con el ejercicio en la herramienta.',
      typesTitle: 'Tipos de pregunta',
      typesHint: 'Una casilla por elemento (gen, objeto, máquina, coordenada), con puntuación parcial, como en la corrección de la práctica. Los números de la función admiten la misma tolerancia que la práctica.',
      all: 'Marcar todos', none: 'Ninguno',
      levelsTitle: 'Niveles de dificultad',
      levelsHint: 'Fácil: instancias pequeñas (5 objetos, 5 ciudades, 5 tareas × 2 máquinas, k = 3) y los casos más directos. Media: algo más grandes, con reparación, decodificador o Gray. Difícil: las mayores (hasta 12 objetos, 9 ciudades, 8 × 4), reparación aleatoria, dos ciudades repetidas, Rastrigin y penalización cuadrática.',
      level: { easy: 'Fácil', medium: 'Media', hard: 'Difícil' },
      sizeTitle: 'Tamaño',
      count: 'Ejemplares por categoría',
      summary: (q, c) => `Se generarán ${q} preguntas en ${c} categorías (una por codificación, tipo y nivel).`,
      nothing: 'Elige al menos un tipo de pregunta y un nivel.',
      download: 'Descargar banco (Moodle XML)',
      done: (q, s, f) => `Descargado ${f}: ${q} preguntas, semilla del banco ${s}.`,
      missing: (list) => `No se han encontrado bastantes ejemplares distintos para: ${list}.`,
      previewTitle: 'Vista previa',
      previewHint: 'Así se verá una pregunta del banco (sin el estilo de Moodle). La solución y los enlaces van en la retroalimentación general.',
      previewKind: 'Pregunta',
      previewAnother: 'Otro ejemplar',
      previewSolution: 'Retroalimentación general',
      howTitle: 'Cómo usarlo en Moodle',
      how: [
        'En el curso: Banco de preguntas → Importar → formato «Moodle XML». Se crea una categoría por codificación, tipo y nivel dentro de «Representación».',
        'En el cuestionario, añade una «pregunta aleatoria» de cada categoría: cada estudiante recibe ejemplares distintos del mismo nivel.',
        'En las opciones de revisión, muestra la «Retroalimentación general» solo «Después de cerrar el cuestionario»: contiene la solución y los enlaces a la herramienta.',
        'Las preguntas son de tipo «Respuestas anidadas (Cloze)»: cada casilla puntúa por separado. Si usas Safe Exam Browser, comprueba que los enlaces se puedan abrir durante la revisión.',
      ],
      adaptNote: 'Moodle no tiene el mapa ni el diagrama de Gantt, así que cuatro ejercicios van en texto: en el viajante, codificar parte de la lista de tramos y pide el cromosoma que empieza en la ciudad 1 (para que la respuesta sea única) y decodificar pide la ciudad siguiente a cada una; codificar la asignación parte del plan de cada máquina, y codificar la mochila, de la lista de objetos.',
      seedNote: 'Cada descarga usa una semilla nueva, así que el banco no se puede volver a generar desde aquí. El nombre de cada pregunta (que el alumnado no ve) lleva su semilla para reproducir el ejercicio ante una reclamación.',
      file: 'banco-representacion',
    },
    en: {
      title: 'Question banks for Moodle',
      lead: 'Generate questions with the same exercises as the practice mode and download them in Moodle XML format to import them into your course question bank. Each question’s feedback links to the step-by-step solution of that very example and to the exercise in the tool.',
      typesTitle: 'Question types',
      typesHint: 'One box per element (gene, item, machine, coordinate), with partial credit, as in the practice mode’s marking. Function values accept the same tolerance as the practice mode.',
      all: 'Select all', none: 'None',
      levelsTitle: 'Difficulty levels',
      levelsHint: 'Easy: small instances (5 items, 5 cities, 5 tasks × 2 machines, k = 3) and the most direct cases. Medium: somewhat larger, with repair, decoder or Gray code. Hard: the largest (up to 12 items, 9 cities, 8 × 4), random repair, two repeated cities, Rastrigin and quadratic penalty.',
      level: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
      sizeTitle: 'Size',
      count: 'Instances per category',
      summary: (q, c) => `${q} questions will be generated in ${c} categories (one per encoding, type and level).`,
      nothing: 'Choose at least one question type and one level.',
      download: 'Download bank (Moodle XML)',
      done: (q, s, f) => `Downloaded ${f}: ${q} questions, bank seed ${s}.`,
      missing: (list) => `Not enough distinct instances were found for: ${list}.`,
      previewTitle: 'Preview',
      previewHint: 'This is how a question from the bank will look (without Moodle’s styling). The solution and the links go in the general feedback.',
      previewKind: 'Question',
      previewAnother: 'Another instance',
      previewSolution: 'General feedback',
      howTitle: 'How to use it in Moodle',
      how: [
        'In the course: Question bank → Import → “Moodle XML” format. One category per encoding, type and level is created inside “Representation”.',
        'In the quiz, add a “random question” from each category: each student gets different instances of the same level.',
        'In the review options, show the “General feedback” only “After the quiz is closed”: it contains the solution and the links to the tool.',
        'The questions are of the “Embedded answers (Cloze)” type: each box is marked separately. If you use Safe Exam Browser, check that the links can be opened during the review.',
      ],
      adaptNote: 'Moodle has neither the map nor the Gantt chart, so four exercises are given in text: in the travelling salesman, encoding starts from the list of legs and asks for the chromosome starting at city 1 (so that the answer is unique), and decoding asks for the city after each one; encoding the assignment starts from each machine’s schedule, and encoding the knapsack, from the list of items.',
      seedNote: 'Each download uses a new seed, so the bank cannot be regenerated from here. Each question’s name (hidden from students) includes its seed, to reproduce the exercise if a student queries the mark.',
      file: 'representation-bank',
    },
  };

  function createMoodlePage() {
    const G = root.GAX;
    const M = G.moodle;
    const I = G.i18n;
    const sel = { kinds: new Set(M.KINDS.map((k) => k.id)), levels: new Set(['medium']), count: 10, preview: null, previewSeed: 1 };
    let last = null;

    function node(tag, cls, content) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (content != null) e.textContent = content;
      return e;
    }
    function check(label, checked, onChange) {
      const l = node('label', 'mq-check');
      const i = node('input');
      i.type = 'checkbox';
      i.checked = checked;
      i.addEventListener('change', () => onChange(i.checked));
      l.append(i, node('span', null, label));
      return { el: l, input: i };
    }
    function numberField(label, value, min, max, onChange) {
      const l = node('label', 'mq-num');
      const i = node('input');
      i.type = 'number';
      i.min = String(min);
      i.max = String(max);
      i.step = '1';
      i.value = String(value);
      i.addEventListener('change', () => {
        const v = Math.max(min, Math.min(max, Math.round(Number(i.value)) || value));
        i.value = String(v);
        onChange(v);
      });
      l.append(node('span', null, label), i);
      return l;
    }
    function group(title, hint, items) {
      const f = node('fieldset', 'mq-group');
      f.append(node('legend', null, title));
      if (hint) f.append(node('p', 'hint', hint));
      const box = node('div', 'mq-items');
      box.append(...items);
      f.append(box);
      return f;
    }
    function download(name, content) {
      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = node('a');
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function render(container, lang) {
      const L = text[lang] || text.es;
      const MT = M.texts[lang] || M.texts.es;
      const kindName = (k) => `${I.t(lang, `prType_${k.type}`)}`;
      const levels = () => M.LEVELS.filter((lv) => sel.levels.has(lv));
      const kinds = () => M.KINDS.map((k) => k.id).filter((k) => sel.kinds.has(k));

      const summary = node('p', 'mq-summary');
      const btn = node('button', 'btn primary', L.download);
      btn.type = 'button';
      const status = node('p', 'mq-status');
      status.setAttribute('role', 'status');
      const preview = node('div', 'mq-preview');
      const pvSelect = node('select');
      pvSelect.id = 'mqPreviewKind';
      const pvLabel = node('label', 'mq-num');
      pvLabel.append(node('span', null, L.previewKind), pvSelect);
      const pvAnother = node('button', 'btn', L.previewAnother);
      pvAnother.type = 'button';

      function renderPreview() {
        preview.replaceChildren();
        const lv = levels();
        const kid = pvSelect.value;
        if (!kid || !lv.length) return;
        const r = M.generate({ lang, kinds: [kid], levels: [lv[0]], count: 1, seed: sel.previewSeed });
        const q = r.questions[0];
        if (!q) return;
        const qt = node('div', 'mq-qtext');
        qt.innerHTML = M.previewHtml(q);   // HTML generado por js/moodle.js (texto escapado)
        const fb = node('details', 'mq-feedback');
        const body = node('div');
        body.innerHTML = q.general;
        fb.append(node('summary', null, L.previewSolution), body);
        preview.append(node('p', 'mq-qname', q.name), qt, fb);
      }

      function syncPreviewOptions() {
        const ks = kinds();
        const keep = ks.indexOf(sel.preview) !== -1 ? sel.preview : ks[0];
        pvSelect.replaceChildren(...ks.map((id) => {
          const k = M.KINDS.find((x) => x.id === id);
          const o = node('option', null, `${MT.enc[k.enc]} · ${kindName(k)}`);
          o.value = id;
          return o;
        }));
        if (keep) pvSelect.value = keep;
        sel.preview = keep || null;
      }

      function refresh() {
        const cats = kinds().length * levels().length;
        summary.textContent = cats ? L.summary(cats * sel.count, cats) : L.nothing;
        btn.disabled = !cats;
        syncPreviewOptions();
        renderPreview();
      }

      const boxes = [];
      const encGroups = M.ENCODINGS.map((enc) => {
        const items = M.KINDS.filter((k) => k.enc === enc).map((k) => {
          const c = check(kindName(k), sel.kinds.has(k.id), (on) => { if (on) sel.kinds.add(k.id); else sel.kinds.delete(k.id); refresh(); });
          boxes.push({ id: k.id, input: c.input });
          return c.el;
        });
        return group(MT.enc[enc], null, items);
      });
      const setAll = (on) => {
        boxes.forEach((b) => { b.input.checked = on; if (on) sel.kinds.add(b.id); else sel.kinds.delete(b.id); });
        refresh();
      };
      const bAll = node('button', 'btn', L.all);
      bAll.type = 'button';
      bAll.addEventListener('click', () => setAll(true));
      const bNone = node('button', 'btn', L.none);
      bNone.type = 'button';
      bNone.addEventListener('click', () => setAll(false));
      const allRow = node('div', 'buttons mq-all');
      allRow.append(bAll, bNone);

      const levelItems = M.LEVELS.map((lv) => check(L.level[lv], sel.levels.has(lv), (on) => {
        if (on) sel.levels.add(lv); else sel.levels.delete(lv);
        refresh();
      }).el);

      pvSelect.addEventListener('change', () => { sel.preview = pvSelect.value; renderPreview(); });
      pvAnother.addEventListener('click', () => { sel.previewSeed = (sel.previewSeed % 9973) + 1; renderPreview(); });

      btn.addEventListener('click', () => {
        const r = M.generate({ lang, kinds: kinds(), levels: levels(), count: sel.count });
        const date = new Date().toISOString().slice(0, 10);
        const file = `${L.file}-${date}-s${r.seed}.xml`;
        download(file, M.toXml(r));
        let msg = L.done(r.questions.length, r.seed, file);
        if (r.missing.length) {
          const list = r.missing.map((m) => {
            const k = M.KINDS.find((x) => x.id === m.kind);
            return `${MT.enc[k.enc]} · ${kindName(k)} · ${L.level[m.level]} (${m.made}/${m.wanted})`;
          }).join('; ');
          msg += ` ${L.missing(list)}`;
        }
        last = { lang, text: msg };
        status.textContent = msg;
      });

      const how = node('ol', 'mq-how');
      L.how.forEach((h) => how.append(node('li', null, h)));

      const form = node('div', 'mq-form');
      form.append(node('h2', null, L.typesTitle), node('p', 'hint', L.typesHint), allRow, ...encGroups,
        group(L.levelsTitle, L.levelsHint, levelItems),
        group(L.sizeTitle, null, [numberField(L.count, sel.count, 1, 50, (v) => { sel.count = v; refresh(); })]));
      const actions = node('div', 'mq-actions');
      actions.append(summary, btn, status);
      if (last && last.lang === lang) status.textContent = last.text;

      const pvBar = node('div', 'mq-actions mq-pvbar');
      pvBar.append(pvLabel, pvAnother);
      const sec = (title, ...kids) => { const s = node('section', 'about-section'); s.append(node('h2', null, title), ...kids); return s; };
      container.replaceChildren(
        node('h1', null, L.title),
        node('p', 'lead', L.lead),
        form,
        actions,
        sec(L.previewTitle, node('p', 'hint', L.previewHint), pvBar, preview),
        sec(L.howTitle, how, node('p', 'hint', L.adaptNote), node('p', 'hint', L.seedNote)),
      );
      document.title = `${L.title} · ${I.t(lang, 'brand')}`;
      refresh();
    }

    return { render };
  }

  const api = { createMoodlePage, text };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).moodlePage = api;
})(typeof self !== 'undefined' ? self : this);
