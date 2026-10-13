/*
 * Generador de bancos de preguntas para Moodle (formato Moodle XML).
 *
 * Cada pregunta es uno de los 21 ejercicios de la práctica (js/practice.js) sobre una página
 * generada al azar con los filtros del nivel; las respuestas guardadas son las del ejercicio, así
 * que la pregunta y la herramienta corrigen lo mismo. Formato cloze: una casilla por elemento
 * (puntuación parcial). La retroalimentación general da la solución y enlaza a la herramienta
 * publicada: la resolución paso a paso (en el paso de la solución) y el ejercicio en modo práctica.
 *
 * Moodle no tiene el mapa ni el Gantt y una casilla no admite «cualquiera de los 2n cromosomas»,
 * así que cuatro ejercicios se adaptan al texto (ver adapt()).
 *
 * El nombre de cada pregunta (que el alumnado no ve) lleva su semilla, para reproducirla. La semilla
 * base del banco es aleatoria en cada exportación.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const G = isNode ? null : root.GAX;
  const R = isNode ? require('./rng.js') : G.rng;
  const I18N = isNode ? require('./i18n.js') : G.i18n;
  const PR = isNode ? require('./practice.js') : G.practice;
  const A = isNode ? require('./assignment.js') : G.assignment;
  const Fn = isNode ? require('./func.js') : G.func;
  const problem = (id) => (isNode ? require(`./problems/${id}.js`) : G.problems[id]);

  const APP = 'https://josemagalan.github.io/representation-ga/';
  const LEVELS = ['easy', 'medium', 'hard'];
  const ENCODINGS = ['knapsack-bits', 'tsp-perm', 'assignment-int', 'assignment-matrix', 'function-real', 'function-bits'];
  const KINDS = [].concat(...ENCODINGS.map((id) => PR.typesFor(id).map((type) => ({ id: `${id}:${type}`, enc: id, type }))));
  const kindById = (id) => KINDS.find((k) => k.id === id);
  const MAX_TRIES = 4000;

  // ---------- Textos propios (el resto sale de js/i18n.js, los mismos de la práctica) ----------
  const T = {
    es: {
      root: 'Representación',
      level: { easy: 'Fácil', medium: 'Media', hard: 'Difícil' },
      enc: {
        'knapsack-bits': 'Mochila · vector de bits', 'tsp-perm': 'Viajante · permutación',
        'assignment-int': 'Asignación · vector de enteros', 'assignment-matrix': 'Asignación · matriz binaria',
        'function-real': 'Función · vector de reales', 'function-bits': 'Función · cadena binaria',
      },
      problem: {
        'knapsack-bits': 'Problema de la mochila 0/1 con un vector de bits: xᵢ = 1 si el objeto i entra en la mochila.',
        'tsp-perm': 'Problema del viajante con una permutación: el gen k es la ciudad que se visita en el lugar k, y el circuito vuelve de la última a la primera.',
        'assignment-int': 'Asignación de tareas a máquinas no relacionadas (minimizar el makespan Cmax, la mayor carga) con un vector de enteros: aᵢ es la máquina de la tarea i.',
        'assignment-matrix': 'Asignación de tareas a máquinas no relacionadas (minimizar el makespan Cmax, la mayor carga) con una matriz binaria: yᵢⱼ = 1 si la tarea i se hace en la máquina j.',
        'function-real': 'Minimizar una función continua de dos variables con un vector de dos reales.',
        'function-bits': 'Minimizar una función continua de dos variables con una cadena binaria: los k primeros bits codifican x₁ y los k siguientes, x₂.',
      },
      item: 'Objeto', capacity: 'Capacidad de la mochila: W = {W}.',
      times: 'Tiempos pᵢⱼ (filas: máquinas; columnas: tareas):',
      matrix: 'Cromosoma y (filas: máquinas; columnas: tareas):',
      answer: 'Respuesta', solution: 'Solución',
      linkSteps: 'Ver la resolución paso a paso en la herramienta',
      linkPractice: 'Repetir este ejercicio en la herramienta (modo práctica)',
      knapEncodeSolution: 'Solución que da el decodificador: objetos {list}, con peso {weight} (W = {W}) y valor {value}.',
      tspEdges: 'El circuito recorre estos tramos (sin sentido ni orden): {edges}.',
      tspEncodeTask: 'Los 2n = {twoN} cromosomas que empiezan en cualquier ciudad y van en cualquier sentido describen este mismo circuito. Escribe el que empieza en la ciudad 1 y sigue hacia la menor de sus dos vecinas.',
      tspDecodeTask: 'Decodifica el cromosoma: para cada ciudad, escribe la que se visita justo después (de la última se vuelve a la primera).',
      tspNext: 'Ciudad siguiente', tspAfter: 'Después de la {c}',
      plan: 'Plan de trabajo: {plan}.', planNone: 'ninguna tarea',
      assignEncodeTask: 'Escribe el vector de enteros: la máquina de cada tarea.',
      bitsPoint: 'Punto de la rejilla: x = ({x1}; {x2}).',
    },
    en: {
      root: 'Representation',
      level: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
      enc: {
        'knapsack-bits': 'Knapsack · bit vector', 'tsp-perm': 'Travelling salesman · permutation',
        'assignment-int': 'Assignment · integer vector', 'assignment-matrix': 'Assignment · binary matrix',
        'function-real': 'Function · real vector', 'function-bits': 'Function · bit string',
      },
      problem: {
        'knapsack-bits': '0/1 knapsack problem with a bit vector: xᵢ = 1 if item i goes into the knapsack.',
        'tsp-perm': 'Travelling salesman problem with a permutation: gene k is the city visited in place k, and the tour returns from the last to the first.',
        'assignment-int': 'Assignment of tasks to unrelated machines (minimise the makespan Cmax, the largest load) with an integer vector: aᵢ is the machine of task i.',
        'assignment-matrix': 'Assignment of tasks to unrelated machines (minimise the makespan Cmax, the largest load) with a binary matrix: yᵢⱼ = 1 if task i is done on machine j.',
        'function-real': 'Minimise a continuous function of two variables with a vector of two reals.',
        'function-bits': 'Minimise a continuous function of two variables with a bit string: the first k bits encode x₁ and the next k, x₂.',
      },
      item: 'Item', capacity: 'Knapsack capacity: W = {W}.',
      times: 'Times pᵢⱼ (rows: machines; columns: tasks):',
      matrix: 'Chromosome y (rows: machines; columns: tasks):',
      answer: 'Answer', solution: 'Solution',
      linkSteps: 'See the step-by-step solution in the tool',
      linkPractice: 'Repeat this exercise in the tool (practice mode)',
      knapEncodeSolution: 'Solution given by the decoder: items {list}, with weight {weight} (W = {W}) and value {value}.',
      tspEdges: 'The tour goes along these legs (in no particular order or direction): {edges}.',
      tspEncodeTask: 'The 2n = {twoN} chromosomes that start at any city and go in either direction describe this same tour. Write the one that starts at city 1 and goes on to the smaller of its two neighbours.',
      tspDecodeTask: 'Decode the chromosome: for each city, write the one visited right after it (from the last one the tour returns to the first).',
      tspNext: 'Next city', tspAfter: 'After {c}',
      plan: 'Schedule: {plan}.', planNone: 'no tasks',
      assignEncodeTask: 'Write the integer vector: the machine of each task.',
      bitsPoint: 'Grid point: x = ({x1}; {x2}).',
    },
  };

  // ---------- Utilidades ----------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fill = (s, p) => s.replace(/\{(\w+)\}/g, (m, k) => (p && p[k] != null ? p[k] : m));
  const inRange = (x, [lo, hi]) => x >= lo && x <= hi;
  const minus = (s) => s.replace(/^-/, '−');
  /** Número con la coma o el punto del idioma y como mucho d decimales (sin ceros de más). */
  function num(v, lang, d) {
    const s = String(Number((Math.abs(v) < 1e-12 ? 0 : v).toFixed(d)));
    return minus(lang === 'es' ? s.replace('.', ',') : s);
  }
  const fixed = (v, lang, d) => minus(lang === 'es' ? v.toFixed(d).replace('.', ',') : v.toFixed(d));
  const COORD = ['x1', 'x2', 'a', 'b', 'delta', 'g1', 'g2'];

  /** Parámetros de un texto de la práctica, formateados como en la página. */
  function fmtParams(enc, params, lang) {
    const out = {};
    Object.entries(params || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) out[k] = v.map((x) => fixed(x, lang, 2)).join(' · ');
      else if (typeof v !== 'number') out[k] = v;
      else if (enc.startsWith('function') && COORD.indexOf(k) !== -1) out[k] = num(v, lang, 4);
      else out[k] = num(v, lang, 2);
    });
    return out;
  }
  const tr = (lang, key, params) => I18N.t(lang, key, params);

  // ---------- Casillas cloze ----------
  /** Caracteres que hay que escapar dentro de una respuesta cloze. */
  const clozeEsc = (s) => String(s).replace(/([}#~/"\\])/g, '\\$1');
  const clozeNumber = (v) => {
    const x = Math.abs(v) < 1e-12 ? 0 : Number(v.toPrecision(12));
    return String(x);
  };
  function tolOf(gr, v) {
    if (gr.kind === 'int' || !gr.tol || gr.tol === 'exact') return 0;
    return Number(PR.TOL[gr.tol](v).toPrecision(4));
  }
  function choiceLabels(gr, ex, lang) {
    if (gr.kind === 'yesno' || gr.kind === 'check') return [{ v: 'yes', label: tr(lang, 'prYes') }, { v: 'no', label: tr(lang, 'prNo') }];
    return gr.options.map((o) => {
      let label = o;
      if (o === 'any') label = tr(lang, 'prAny');
      else if (o === 'none') label = tr(lang, 'prNone');
      else if (o === 'many') label = tr(lang, 'prMany');
      else if (ex.id.startsWith('assignment')) label = tr(lang, 'machineShort', { j: o });
      return { v: o, label };
    });
  }
  function cloze(gr, ans, ex, lang) {
    if (gr.kind === 'bit') return `{1:SHORTANSWER:=${ans}}`;
    if (gr.kind === 'int' || gr.kind === 'num') return `{1:NUMERICAL:=${clozeNumber(ans)}:${tolOf(gr, ans)}}`;
    const want = gr.kind === 'check' ? (ans ? 'yes' : 'no') : ans;
    return `{1:MULTICHOICE:${choiceLabels(gr, ex, lang).map((o) => `${o.v === want ? '=' : ''}${clozeEsc(o.label)}`).join('~')}}`;
  }
  /** Lo que se escribe en la solución para un valor de un grupo. */
  function shown(gr, v, ex, lang) {
    if (gr.kind === 'check') return tr(lang, v ? 'prYes' : 'prNo');
    if (gr.kind === 'yesno' || gr.kind === 'choice') return choiceLabels(gr, ex, lang).find((o) => o.v === v).label;
    if (gr.kind === 'num') return num(v, lang, gr.tol === 'coord' ? 4 : (gr.tol === 'fval' ? 3 : 2));
    return String(v);
  }

  // ---------- Tablas ----------
  const CELL = 'padding:4px 8px;text-align:center;font-family:monospace;font-size:1.05em;';
  const HEAD = 'padding:0 8px;text-align:center;color:#777;font-size:0.8em;';
  const TH = 'padding:4px 10px;text-align:left;white-space:nowrap;';
  const table = (rows) => `<table style="border-collapse:collapse;margin:0.5em 0;">${rows.join('')}</table>`;
  const headRow = (cells, corner) => `<tr><th style="${TH}">${esc(corner || '')}</th>${cells.map((c) => `<td style="${HEAD}">${esc(c)}</td>`).join('')}</tr>`;
  const dataRow = (label, cells, raw) => `<tr><th style="${TH}">${esc(label)}</th>${cells.map((c) => `<td style="${CELL}">${raw ? c : esc(c)}</td>`).join('')}</tr>`;

  const shortCap = (lab, lang) => {
    const p = lab.params || {};
    const v = Object.values(p)[0];
    return v != null ? String(v) : tr(lang, lab.key, p);
  };

  // ---------- Adaptaciones al texto ----------
  /** El ejercicio tal como va en Moodle: el de la práctica, con los cambios que pide el papel. */
  function adapt(ex, lang) {
    const L = T[lang];
    const out = Object.assign({}, ex, { givens: ex.givens.slice(), groups: ex.groups.slice(), extra: [] });
    const id = ex.id;
    if (id === 'knapsack-bits' && ex.type === 'encode') {
      out.givens[0] = { text: L.knapEncodeSolution, params: ex.givens[0].params };
    }
    if (id === 'function-bits' && ex.type === 'encode') {
      out.givens = out.givens.map((g) => (g.key === 'prBitsPointGiven' ? { text: L.bitsPoint, params: g.params } : g));
    }
    if (id === 'assignment-int' && ex.type === 'encode') {
      const { m } = A.sizes(ex.page.inst);
      const plan = Array.from({ length: m }, (_, j) => {
        const ts = ex.page.x.map((mj, i) => (mj === j + 1 ? tr(lang, 'taskShort', { i: i + 1 }) : null)).filter(Boolean);
        return `${tr(lang, 'machineShort', { j: j + 1 })}: ${ts.length ? ts.join(', ') : L.planNone}`;
      }).join('; ');
      out.givens = [{ text: L.plan, params: { plan } }, { text: L.assignEncodeTask }];
    }
    if (id === 'tsp-perm' && ex.type === 'encode') {
      const tour = ex.groups[0].items.map((it) => it.answer);
      const n = tour.length;
      // Cromosoma único: empieza en la 1 y sigue hacia la menor de sus dos vecinas
      const k = tour.indexOf(1);
      const fwd = tour.slice(k).concat(tour.slice(0, k));
      const canon = fwd[1] < fwd[n - 1] ? fwd : [1].concat(fwd.slice(1).reverse());
      const edges = tour.map((a, i) => { const b = tour[(i + 1) % n]; return a < b ? [a, b] : [b, a]; })
        .sort((p, q) => p[0] - q[0] || p[1] - q[1]).map((e) => `${e[0]}–${e[1]}`).join(', ');
      out.givens = [{ text: L.tspEdges, params: { edges } }, { text: L.tspEncodeTask, params: { twoN: 2 * n } }];
      out.groups = [Object.assign({}, ex.groups[0], { kind: 'int', items: canon.map((c, i) => ({ label: { key: 'prPlace', params: { i: i + 1 } }, answer: c })) })];
    }
    if (id === 'tsp-perm' && ex.type === 'decode') {
      const x = ex.page.x;
      const n = x.length;
      const next = Array.from({ length: n }, (_, c) => x[(x.indexOf(c + 1) + 1) % n]);
      out.givens = [ex.givens[0], { text: L.tspDecodeTask }];
      out.groups = [{ id: 'next', text: L.tspNext, kind: 'int', items: next.map((v, c) => ({ label: { text: fill(L.tspAfter, { c: c + 1 }), cap: String(c + 1) }, answer: v })) }];
    }
    return out;
  }

  // ---------- Páginas al azar por nivel ----------
  const KN = { easy: [5, 6], medium: [7, 8], hard: [10, 12] };
  const TSPN = { easy: 5, medium: 7, hard: 9 };
  const ASZ = { int: { easy: [5, 2], medium: [6, 3], hard: [8, 4] }, matrix: { easy: [5, 2], medium: [5, 3], hard: [6, 4] } };
  const FREE = { easy: [1, 2], medium: [2, 3], hard: [3, 12] };
  const BAD = { easy: [1, 1], medium: [2, 2], hard: [3, 6] };

  const sumW = (inst, x) => x.reduce((s, b, i) => s + b * inst.weights[i], 0);

  function knapsackPage(type, level, seed, r) {
    const P = problem('knapsack-bits');
    const n = R.randInt(r, ...KN[level]);
    const s = (seed % 999999) + 1;
    const inst = P.randomInstance(s, n);
    const x = P.randomChromosome(s, n);
    let variant = 'penalty-linear';
    let lambda = 1;
    let draw = 1;
    const over = sumW(inst, x) > inst.capacity;
    if (type === 'encode') {
      variant = 'decoder';
      const pg = { inst, x, variant, lambda, draw, seed: s };
      const free = PR.exercise('knapsack-bits', 'encode', pg).groups[0].items.filter((it) => it.answer === 'any').length;
      return inRange(free, FREE[level]) ? pg : null;
    }
    if (type === 'decode') {
      variant = level === 'easy' ? 'penalty-linear' : 'decoder';
      if (level === 'hard' && P.decoderDecode(inst, x).skipped.length < 2) return null;
      if (level === 'medium' && P.decoderDecode(inst, x).skipped.length < 1) return null;
    }
    if (type === 'validity') {
      if (level === 'easy') variant = r() < 0.5 ? 'penalty-linear' : 'penalty-quadratic';
      else if (level === 'medium') {
        variant = 'repair-greedy';
        if (!over) return null;
      } else {
        variant = r() < 0.5 ? 'repair-random' : 'decoder';
        if (variant === 'repair-random') {
          draw = (seed % 998) + 1;
          if ((P.evaluate(inst, x, variant, { seed: draw }).removed || []).length < 2) return null;
        } else if (P.decoderDecode(inst, x).skipped.length < 2) return null;
      }
    }
    if (type === 'fitness') {
      if (level === 'easy') lambda = R.randInt(r, 1, 3);
      else lambda = R.randInt(r, 5, 25) / 10;
      variant = level === 'hard' ? 'penalty-quadratic' : 'penalty-linear';
      if (level !== 'easy' && !over) return null;
    }
    return { inst, x, variant, lambda, draw, seed: s };
  }

  function tspPage(type, level, seed) {
    const P = problem('tsp-perm');
    const n = type === 'fitness' && level === 'hard' ? 7 : TSPN[level];
    const s = (seed % 999999) + 1;
    const inst = P.randomInstance(s, n);
    let x = P.randomChromosome(s, n);
    if (type === 'validity') {
      if (level === 'easy') x = s % 2 ? P.brokenChromosome(s, n) : x;
      else x = P.brokenChromosome(s, n);
      if (level === 'hard') {
        // Una segunda ciudad repetida, lejos de la primera
        const info = P.analyze(x);
        const keep = new Set(info.repeated);
        const pos = x.map((c, i) => i).filter((i) => !keep.has(x[i]));
        if (pos.length < 2) return null;
        x = x.slice();
        x[pos[pos.length - 1]] = x[pos[0]];
        if (P.analyze(x).repeated.length !== 2) return null;
      }
    }
    return { inst, x, seed: s };
  }

  function assignmentPage(id, type, level, seed) {
    const isM = id === 'assignment-matrix';
    const [n, m] = ASZ[isM ? 'matrix' : 'int'][level];
    const s = (seed % 999999) + 1;
    const inst = A.randomInstance(s, n, m);
    if (!isM) return { inst, x: A.randomAssignment(s, n, m), seed: s };
    const P = problem(id);
    const lambda = { easy: 1, medium: 2, hard: 1.5 }[level];
    if (type === 'encode') return { inst, x: P.randomFeasible(s, n, m), variant: 'repair', lambda: 1, seed: s };
    const x = P.randomChromosome(s, n, m);
    const bad = x.map((row) => A.rowOnes(row).length);
    const nBad = bad.filter((k) => k !== 1).length;
    if (!inRange(nBad, BAD[level])) return null;
    if (level === 'hard' && !(bad.some((k) => k === 0) && bad.some((k) => k > 1))) return null;
    return { inst, x, variant: type === 'fitness' ? 'penalty' : 'repair', lambda: type === 'fitness' ? lambda : 1, seed: s };
  }

  function functionRealPage(type, level, seed, r) {
    const fn = level === 'hard' ? 'rastrigin' : 'himmelblau';
    const F = Fn.fnOf(fn);
    const outCount = (p) => p.filter((v) => v < F.a || v > F.b).length;
    if (type === 'validity') {
      const p = Fn.randomOutside(fn, seed);
      const want = level === 'easy' ? 1 : 2;
      if (level !== 'hard' && outCount(p) !== want) return null;
      const variant = level === 'easy' ? 'clamp' : (level === 'medium' ? (r() < 0.5 ? 'clamp' : 'reflect') : 'reflect');
      return { fn, x: p, variant, lambda: 10 };
    }
    if (level === 'easy') return { fn, x: Fn.randomPoint(fn, seed), variant: 'clamp', lambda: 10 };
    const p = Fn.randomOutside(fn, seed);
    if (level === 'medium') return { fn, x: p, variant: 'clamp', lambda: 10 };
    return { fn, x: p, variant: 'penalty', lambda: [10, 20, 50][seed % 3] };
  }

  function functionBitsPage(type, level, seed, r) {
    const k = level === 'easy' ? 3 : (level === 'medium' ? R.randInt(r, 4, 5) : R.randInt(r, 6, 8));
    const fn = level === 'hard' ? 'rastrigin' : 'himmelblau';
    const variant = level === 'easy' ? 'standard' : (level === 'medium' ? (r() < 0.5 ? 'standard' : 'gray') : (r() < 0.5 ? 'gray' : 'standard'));
    return { fn, k, variant, x: Fn.randomBits(seed, k) };
  }

  function pageFor(kind, level, seed) {
    const r = R.mulberry32(seed);
    if (kind.enc === 'knapsack-bits') return knapsackPage(kind.type, level, seed, r);
    if (kind.enc === 'tsp-perm') return tspPage(kind.type, level, seed);
    if (kind.enc.startsWith('assignment')) return assignmentPage(kind.enc, kind.type, level, seed);
    if (kind.enc === 'function-real') return functionRealPage(kind.type, level, seed, r);
    return functionBitsPage(kind.type, level, seed, r);
  }

  // ---------- Enlaces a la herramienta ----------
  /** Parámetros de la URL de la página, los mismos que escribe js/ui/<id>.js. */
  function pageHash(enc, pg) {
    const h = [];
    if (enc === 'knapsack-bits') {
      h.push(['v', pg.variant]);
      if (pg.variant.startsWith('penalty')) h.push(['l', String(pg.lambda)]);
      if (pg.variant === 'repair-random') h.push(['r', String(pg.draw)]);
      h.push(['s', String(pg.seed)], ['w', pg.inst.weights.join('-')], ['val', pg.inst.values.join('-')], ['W', String(pg.inst.capacity)], ['x', pg.x.join('-')]);
    } else if (enc === 'tsp-perm') {
      h.push(['s', String(pg.seed)], ['n', String(pg.x.length)], ['x', pg.x.join('-')]);
    } else if (enc.startsWith('assignment')) {
      const isM = enc === 'assignment-matrix';
      const { n, m } = A.sizes(pg.inst);
      if (isM) {
        h.push(['v', pg.variant]);
        if (pg.variant === 'penalty') h.push(['l', String(pg.lambda)]);
      }
      h.push(['s', String(pg.seed)], ['n', String(n)], ['m', String(m)], ['p', pg.inst.p.map((row) => row.join('.')).join('-')],
        ['x', isM ? pg.x.map((row) => row.join('')).join('-') : pg.x.join('-')]);
    } else if (enc === 'function-real') {
      h.push(['fn', pg.fn], ['v', pg.variant]);
      if (pg.variant === 'penalty') h.push(['l', String(pg.lambda)]);
      h.push(['x', pg.x.map((v) => String(Fn.round2(v))).join('_')]);
    } else {
      h.push(['fn', pg.fn], ['v', pg.variant], ['k', String(pg.k)], ['x', pg.x.join('')]);
    }
    return h;
  }

  function runPage(enc, pg) {
    const P = problem(enc);
    if (enc === 'knapsack-bits') return P.run(pg.inst, pg.x, { variant: pg.variant, lambda: pg.lambda, seed: pg.draw });
    if (enc === 'tsp-perm' || enc === 'assignment-int') return P.run(pg.inst, pg.x);
    if (enc === 'assignment-matrix') return P.run(pg.inst, pg.x.map((row) => row.slice()), { variant: pg.variant, lambda: pg.lambda });
    if (enc === 'function-real') return P.run({ fn: pg.fn }, pg.x, { variant: pg.variant, lambda: pg.lambda });
    return P.run({ fn: pg.fn, k: pg.k }, pg.x, { variant: pg.variant });
  }

  function links(ex, lang) {
    const steps = runPage(ex.id, ex.page).steps;
    let step = steps.length - 1;
    if (!ex.solution.last) {
      const k = steps.findIndex((s) => ex.solution.types.indexOf(s.type) !== -1);
      if (k >= 0) step = k;
    }
    const base = [['enc', ex.id], ['lang', lang]].concat(pageHash(ex.id, ex.page));
    const q1 = new URLSearchParams(base.concat([['step', String(step)]]));
    const q2 = new URLSearchParams(base.concat([['step', '0'], ['practice', ex.type]]));
    return { steps: `${APP}#${q1.toString()}`, practice: `${APP}#${q2.toString()}`, step };
  }

  // ---------- Pregunta ----------
  const textOf = (g, ex, lang) => (g.text ? fill(g.text, fmtParams(ex.id, g.params, lang)) : tr(lang, g.key, fmtParams(ex.id, g.params, lang)));
  const groupLabel = (gr, lang) => (gr.text ? gr.text : tr(lang, gr.key, gr.params));
  const itemLabel = (lab, lang) => (lab.text ? lab.text : tr(lang, lab.key, lab.params));
  const itemCap = (lab, lang) => (lab.cap ? lab.cap : shortCap(lab, lang));

  function instanceHtml(ex, lang) {
    const L = T[lang];
    if (ex.id === 'knapsack-bits') {
      const { weights, values, capacity } = ex.page.inst;
      return table([headRow(weights.map((_, i) => String(i + 1)), L.item), dataRow('w', weights), dataRow('v', values)]) + `<p>${esc(fill(L.capacity, { W: capacity }))}</p>`;
    }
    if (ex.id.startsWith('assignment')) {
      const p = ex.page.inst.p;
      const m = p[0].length;
      let html = `<p>${esc(L.times)}</p>` + table([headRow(p.map((_, i) => tr(lang, 'taskShort', { i: i + 1 })))]
        .concat(Array.from({ length: m }, (_, j) => dataRow(tr(lang, 'machineShort', { j: j + 1 }), p.map((row) => row[j])))));
      if (ex.id === 'assignment-matrix' && ex.type !== 'encode') {
        // El cromosoma, además de en el texto, como tabla máquinas × tareas (como en la herramienta)
        const y = ex.page.x;
        html += `<p>${esc(L.matrix)}</p>` + table([headRow(y.map((_, i) => tr(lang, 'taskShort', { i: i + 1 })))]
          .concat(Array.from({ length: m }, (_, j) => dataRow(tr(lang, 'machineShort', { j: j + 1 }), y.map((row) => row[j])))));
      }
      return html;
    }
    return '';
  }

  function givensHtml(ex, lang) {
    return ex.givens.map((g) => {
      if (g.table) {
        const rows = [headRow(g.table.head.map(String))].concat(g.table.rows.map((row) => dataRow(String(row[0]), row.slice(1).map((v) => (v == null ? '—' : fixed(v, lang, 1))))));
        return `<p>${esc(tr(lang, g.key))}:</p>` + table(rows);
      }
      return `<p>${esc(textOf(g, ex, lang))}</p>`;
    }).join('');
  }

  function answerHtml(ex, lang) {
    return ex.groups.map((gr) => {
      const label = esc(groupLabel(gr, lang));
      const box = (it) => cloze(gr, it.answer, ex, lang);
      if (gr.items.length === 1) return `<p><strong>${label}:</strong> ${box(gr.items[0])}</p>`;
      if (gr.grid) {
        const { n, m } = gr.grid;
        const rows = [headRow(Array.from({ length: n }, (_, i) => tr(lang, 'taskShort', { i: i + 1 })))]
          .concat(Array.from({ length: m }, (_, j) => dataRow(tr(lang, 'machineShort', { j: j + 1 }), Array.from({ length: n }, (_, i) => box(gr.items[i * m + j])), true)));
        return `<p><strong>${label}</strong></p>` + table(rows);
      }
      if (gr.kind === 'check' || gr.kind === 'yesno' || gr.kind === 'choice') {
        return `<p><strong>${label}</strong></p>` + table(gr.items.map((it) => `<tr><th style="${TH}">${esc(itemLabel(it.label, lang))}</th><td style="${CELL}text-align:left;">${box(it)}</td></tr>`));
      }
      return `<p><strong>${label}</strong></p>` + table([headRow(gr.items.map((it) => itemCap(it.label, lang))), dataRow('', gr.items.map(box), true)]);
    }).join('');
  }

  function solutionHtml(ex, lang, lk) {
    const L = T[lang];
    const parts = ex.groups.map((gr) => {
      const vals = gr.items.map((it) => shown(gr, it.answer, ex, lang));
      const list = gr.items.length === 1 ? vals[0]
        : (gr.kind === 'bit' || gr.kind === 'int' ? vals.join(' ') : gr.items.map((it, i) => `${itemLabel(it.label, lang)}: ${vals[i]}`).join(' · '));
      return `<li>${esc(groupLabel(gr, lang))}: ${esc(list)}</li>`;
    });
    const a = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;
    return `<p><strong>${esc(L.solution)}</strong></p><ul>${parts.join('')}</ul><p>${a(lk.steps, L.linkSteps)} · ${a(lk.practice, L.linkPractice)}</p>`;
  }

  function question(kind, level, seed, lang) {
    const pg = pageFor(kind, level, seed);
    if (!pg) return null;
    const base = PR.exercise(kind.enc, kind.type, pg);
    const ex = adapt(base, lang);
    const L = T[lang];
    const lk = links(ex, lang);
    const typeName = tr(lang, kind.type === 'locality' ? 'prType_locality' : `prType_${kind.type}`);
    const text = `<p>${esc(L.problem[kind.enc])}</p>` + `<p><strong>${esc(typeName)}.</strong> ${esc(tr(lang, `prIntro_${kind.type}`))}</p>` +
      instanceHtml(ex, lang) + givensHtml(ex, lang) + `<p><strong>${esc(L.answer)}</strong></p>` + answerHtml(ex, lang);
    const name = [L.enc[kind.enc], typeName, L.level[level].toLowerCase(), `s=${seed}`].join(' · ');
    return {
      kind: kind.id, enc: kind.enc, type: kind.type, level, seed, page: ex.page, exercise: ex,
      category: [L.enc[kind.enc], typeName, L.level[level]], name,
      tags: [`representation-${kind.enc}`, `type-${kind.type}`, `level-${level}`, `lang-${lang}`],
      qtype: 'cloze', text, general: solutionHtml(ex, lang, lk), link: lk.steps, practiceLink: lk.practice, step: lk.step,
      boxes: ex.groups.reduce((s, gr) => s + gr.items.length, 0),
    };
  }

  // ---------- Generación ----------
  /**
   * opts: { lang, kinds: [id], levels: [id], count, seed (base; aleatoria si falta) }
   * → { seed, lang, questions, missing: [{ kind, level, made, wanted }] }
   */
  function generate(opts) {
    const lang = T[opts.lang] ? opts.lang : 'es';
    const count = Math.max(1, Math.min(50, opts.count || 10));
    const seed = Number.isFinite(opts.seed) ? opts.seed : R.newSeed();
    const questions = [];
    const missing = [];
    const used = new Set();
    let block = 0;
    (opts.kinds || []).forEach((kid) => {
      const kind = kindById(kid);
      if (!kind) return;
      LEVELS.filter((lv) => (opts.levels || []).indexOf(lv) !== -1).forEach((level) => {
        let s = (seed % 100000) * 1000 + (block++) * 100003;
        let made = 0;
        for (let tries = 0; made < count && tries < MAX_TRIES; tries++, s++) {
          const sd = (s % 2147483646) + 1;
          const q = question(kind, level, sd, lang);
          if (!q) continue;
          const key = `${kid}|${JSON.stringify(q.page)}`;
          if (used.has(key)) continue;
          used.add(key);
          questions.push(q);
          made++;
        }
        if (made < count) missing.push({ kind: kid, level, made, wanted: count });
      });
    });
    return { seed, lang, questions, missing };
  }

  // ---------- Moodle XML ----------
  const cdata = (s) => `<![CDATA[${String(s).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;

  function toXml(result) {
    const L = T[result.lang] || T.es;
    const out = [];
    let lastCat = null;
    result.questions.forEach((q) => {
      const cat = [L.root].concat(q.category).join('/');
      if (cat !== lastCat) {
        out.push(`  <question type="category">\n    <category><text>$course$/top/${esc(cat)}</text></category>\n  </question>`);
        lastCat = cat;
      }
      out.push(`  <question type="cloze">
    <name><text>${esc(q.name)}</text></name>
    <questiontext format="html"><text>${cdata(q.text)}</text></questiontext>
    <generalfeedback format="html"><text>${cdata(q.general)}</text></generalfeedback>
    <penalty>0</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
    <tags>${q.tags.map((t) => `<tag><text>${esc(t)}</text></tag>`).join('')}</tags>
  </question>`);
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${esc(L.root)} · seed ${result.seed} · ${APP} -->\n<quiz>\n${out.join('\n')}\n</quiz>\n`;
  }

  /** Texto de la pregunta para la vista previa: las casillas cloze se sustituyen por campos vacíos. */
  function previewHtml(q) {
    return q.text
      .replace(/\{1:MULTICHOICE:([^}]*)\}/g, (m, body) => `<select disabled aria-label="…"><option>—</option>${body.split('~').map((o) => `<option>${o.replace(/^=/, '').replace(/\\(.)/g, '$1')}</option>`).join('')}</select>`)
      .replace(/\{1:(SHORTANSWER|NUMERICAL):=[^}]*\}/g, '<input size="4" disabled aria-label="…">');
  }

  const api = { generate, toXml, previewHtml, question, adapt, pageFor, pageHash, links, KINDS, LEVELS, ENCODINGS, KN, TSPN, ASZ, FREE, BAD, APP, texts: T };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).moodle = api;
})(typeof self !== 'undefined' ? self : this);
