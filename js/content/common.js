/*
 * Utilidades y referencias compartidas por los ficheros de contenido docente de los problemas y sus codificaciones.
 */
(function (root) {
  'use strict';

  const refs = {
    holland: {
      id: 'holland-1992',
      type: 'book',
      authors: 'Holland, J. H.',
      year: '1992',
      title: 'Adaptation in natural and artificial systems: An introductory analysis with applications to biology, control, and artificial intelligence',
      details: { es: '(1.ª ed. en MIT Press; 1.ª ed., 1975, University of Michigan Press). MIT Press', en: '(1st MIT Press ed.; 1st ed., 1975, University of Michigan Press). MIT Press' },
      url: null,
    },
    goldberg: {
      id: 'goldberg-1989',
      type: 'book',
      authors: 'Goldberg, D. E.',
      year: '1989',
      title: 'Genetic algorithms in search, optimization, and machine learning',
      details: { es: 'Addison-Wesley', en: 'Addison-Wesley' },
      url: null,
    },
    eiben: {
      id: 'eiben-smith-2015',
      type: 'book',
      authors: 'Eiben, A. E., & Smith, J. E.',
      year: '2015',
      title: 'Introduction to evolutionary computing',
      details: { es: '(2.ª ed.). Springer, Natural Computing Series', en: '(2nd ed.). Springer, Natural Computing Series' },
      url: 'https://doi.org/10.1007/978-3-662-44874-8',
    },
    back: {
      id: 'back-1993',
      type: 'inproceedings',
      authors: 'Bäck, T.',
      year: '1993',
      title: 'Optimal mutation rates in genetic search',
      container: 'Proceedings of the Fifth International Conference on Genetic Algorithms',
      details: { es: '(S. Forrest, ed., pp. 2–8). Morgan Kaufmann', en: '(S. Forrest, Ed., pp. 2–8). Morgan Kaufmann' },
      url: null,
    },
    droste: {
      id: 'droste-jansen-wegener-2002',
      type: 'article',
      authors: 'Droste, S., Jansen, T., & Wegener, I.',
      year: '2002',
      title: 'On the analysis of the (1+1) evolutionary algorithm',
      container: 'Theoretical Computer Science',
      details: { es: '276(1–2), 51–81', en: '276(1–2), 51–81' },
      url: 'https://doi.org/10.1016/S0304-3975(01)00182-7',
    },
    luke: {
      id: 'luke-2013',
      type: 'book',
      authors: 'Luke, S.',
      year: '2013',
      title: 'Essentials of metaheuristics',
      details: { es: '(2.ª ed.). Lulu. Disponible gratis en línea', en: '(2nd ed.). Lulu. Freely available online' },
      url: 'https://people.cs.gmu.edu/~sean/book/metaheuristics/',
    },
    talbi: {
      id: 'talbi-2009',
      type: 'book',
      authors: 'Talbi, E.-G.',
      year: '2009',
      title: 'Metaheuristics: From design to implementation',
      details: { es: 'Wiley', en: 'Wiley' },
      url: 'https://doi.org/10.1002/9780470496916',
      core: true,   // referencia básica del curso
    },
    bautista: {
      id: 'bautista-valhondo-2020',
      type: 'book',
      authors: 'Bautista-Valhondo, J.',
      year: '2020',
      title: 'Metaheurísticas en ingeniería',
      details: { es: 'Dextra, colección Investigación operativa', en: 'Dextra, Investigación operativa series' },
      url: null,
      core: true,   // referencia básica del curso
    },
  };

  Object.assign(refs, {
    syswerda1991: {
      id: 'syswerda-1991',
      type: 'inproceedings',
      authors: 'Syswerda, G.',
      year: '1991',
      title: 'Schedule optimization using genetic algorithms',
      container: 'Handbook of genetic algorithms',
      details: { es: '(L. Davis, ed., pp. 332–349). Van Nostrand Reinhold', en: '(L. Davis, Ed., pp. 332–349). Van Nostrand Reinhold' },
      url: null,
    },
    croes: {
      id: 'croes-1958',
      type: 'article',
      authors: 'Croes, G. A.',
      year: '1958',
      title: 'A method for solving traveling-salesman problems',
      container: 'Operations Research',
      details: { es: '6(6), 791–812', en: '6(6), 791–812' },
      url: 'https://doi.org/10.1287/opre.6.6.791',
    },
    lin: {
      id: 'lin-1965',
      type: 'article',
      authors: 'Lin, S.',
      year: '1965',
      title: 'Computer solutions of the traveling salesman problem',
      container: 'Bell System Technical Journal',
      details: { es: '44(10), 2245–2269', en: '44(10), 2245–2269' },
      url: 'https://doi.org/10.1002/j.1538-7305.1965.tb04146.x',
    },
  });

  Object.assign(refs, {
    michalewicz: {
      id: 'michalewicz-1996',
      type: 'book',
      authors: 'Michalewicz, Z.',
      year: '1996',
      title: 'Genetic algorithms + data structures = evolution programs',
      details: { es: '(3.ª ed.; 1.ª ed., 1992). Springer', en: '(3rd ed.; 1st ed., 1992). Springer' },
      url: null,
    },
    rechenberg: {
      id: 'rechenberg-1973',
      type: 'book',
      authors: 'Rechenberg, I.',
      year: '1973',
      title: 'Evolutionsstrategie: Optimierung technischer Systeme nach Prinzipien der biologischen Evolution',
      details: { es: 'Frommann-Holzboog', en: 'Frommann-Holzboog' },
      url: null,
    },
    beyer: {
      id: 'beyer-schwefel-2002',
      type: 'article',
      authors: 'Beyer, H.-G., & Schwefel, H.-P.',
      year: '2002',
      title: 'Evolution strategies – A comprehensive introduction',
      container: 'Natural Computing',
      details: { es: '1(1), 3–52', en: '1(1), 3–52' },
      url: 'https://doi.org/10.1023/A:1015059928466',
    },
    debGoyal: {
      id: 'deb-goyal-1996',
      type: 'article',
      authors: 'Deb, K., & Goyal, M.',
      year: '1996',
      title: 'A combined genetic adaptive search (GeneAS) for engineering design',
      container: 'Computer Science and Informatics',
      details: { es: '26(4), 30–45', en: '26(4), 30–45' },
      url: null,
    },
    deb2001: {
      id: 'deb-2001',
      type: 'book',
      authors: 'Deb, K.',
      year: '2001',
      title: 'Multi-objective optimization using evolutionary algorithms',
      details: { es: 'Wiley', en: 'Wiley' },
      url: null,
    },
    herrera: {
      id: 'herrera-lozano-verdegay-1998',
      type: 'article',
      authors: 'Herrera, F., Lozano, M., & Verdegay, J. L.',
      year: '1998',
      title: 'Tackling real-coded genetic algorithms: Operators and tools for behavioural analysis',
      container: 'Artificial Intelligence Review',
      details: { es: '12(4), 265–319', en: '12(4), 265–319' },
      url: 'https://doi.org/10.1023/A:1006504901164',
    },
  });


  // Representación y manejo de restricciones
  Object.assign(refs, {
    martelloToth: {
      id: 'martello-toth-1990',
      type: 'book',
      authors: 'Martello, S., & Toth, P.',
      year: '1990',
      title: 'Knapsack problems: Algorithms and computer implementations',
      details: { es: 'Wiley', en: 'Wiley' },
      url: null,
    },
    richardson: {
      id: 'richardson-1989',
      type: 'inproceedings',
      authors: 'Richardson, J. T., Palmer, M. R., Liepins, G., & Hilliard, M.',
      year: '1989',
      title: 'Some guidelines for genetic algorithms with penalty functions',
      container: 'Proceedings of the Third International Conference on Genetic Algorithms',
      details: { es: '(J. D. Schaffer, ed., pp. 191–197). Morgan Kaufmann', en: '(J. D. Schaffer, Ed., pp. 191–197). Morgan Kaufmann' },
      url: null,
    },
    orvoshDavis: {
      id: 'orvosh-davis-1993',
      type: 'inproceedings',
      authors: 'Orvosh, D., & Davis, L.',
      year: '1993',
      title: 'Shall we repair? Genetic algorithms, combinatorial optimization, and feasibility constraints',
      container: 'Proceedings of the Fifth International Conference on Genetic Algorithms',
      details: { es: '(S. Forrest, ed., p. 650). Morgan Kaufmann', en: '(S. Forrest, Ed., p. 650). Morgan Kaufmann' },
      url: null,
    },
    coello: {
      id: 'coello-2002',
      type: 'article',
      authors: 'Coello Coello, C. A.',
      year: '2002',
      title: 'Theoretical and numerical constraint-handling techniques used with evolutionary algorithms: A survey of the state of the art',
      container: 'Computer Methods in Applied Mechanics and Engineering',
      details: { es: '191(11–12), 1245–1287', en: '191(11–12), 1245–1287' },
      url: 'https://doi.org/10.1016/S0045-7825(01)00323-1',
    },
  });


  // Viajante
  Object.assign(refs, {
    grefenstette1985: {
      id: 'grefenstette-1985',
      type: 'inproceedings',
      authors: 'Grefenstette, J., Gopal, R., Rosmaita, B., & Van Gucht, D.',
      year: '1985',
      title: 'Genetic algorithms for the traveling salesman problem',
      container: 'Proceedings of an International Conference on Genetic Algorithms and Their Applications',
      details: { es: '(J. J. Grefenstette, ed., pp. 160–168). Lawrence Erlbaum', en: '(J. J. Grefenstette, Ed., pp. 160–168). Lawrence Erlbaum' },
      url: null,
    },
    goldbergLingle: {
      id: 'goldberg-lingle-1985',
      type: 'inproceedings',
      authors: 'Goldberg, D. E., & Lingle, R.',
      year: '1985',
      title: 'Alleles, loci, and the traveling salesman problem',
      container: 'Proceedings of an International Conference on Genetic Algorithms and Their Applications',
      details: { es: '(J. J. Grefenstette, ed., pp. 154–159). Lawrence Erlbaum', en: '(J. J. Grefenstette, Ed., pp. 154–159). Lawrence Erlbaum' },
      url: 'https://doi.org/10.4324/9781315799674-15',
    },
    larranaga: {
      id: 'larranaga-1999',
      type: 'article',
      authors: 'Larrañaga, P., Kuijpers, C. M. H., Murga, R. H., Inza, I., & Dizdarevic, S.',
      year: '1999',
      title: 'Genetic algorithms for the travelling salesman problem: A review of representations and operators',
      container: 'Artificial Intelligence Review',
      details: { es: '13(2), 129–170', en: '13(2), 129–170' },
      url: 'https://doi.org/10.1023/A:1006529012972',
    },
    dfj: {
      id: 'dantzig-fulkerson-johnson-1954',
      type: 'article',
      authors: 'Dantzig, G., Fulkerson, R., & Johnson, S.',
      year: '1954',
      title: 'Solution of a large-scale traveling-salesman problem',
      container: 'Journal of the Operations Research Society of America',
      details: { es: '2(4), 393–410', en: '2(4), 393–410' },
      url: 'https://doi.org/10.1287/opre.2.4.393',
    },
    heldKarp: {
      id: 'held-karp-1962',
      type: 'article',
      authors: 'Held, M., & Karp, R. M.',
      year: '1962',
      title: 'A dynamic programming approach to sequencing problems',
      container: 'Journal of the Society for Industrial and Applied Mathematics',
      details: { es: '10(1), 196–210', en: '10(1), 196–210' },
      url: 'https://doi.org/10.1137/0110015',
    },
    applegate: {
      id: 'applegate-2006',
      type: 'book',
      authors: 'Applegate, D. L., Bixby, R. E., Chvátal, V., & Cook, W. J.',
      year: '2006',
      title: 'The traveling salesman problem: A computational study',
      details: { es: 'Princeton University Press', en: 'Princeton University Press' },
      url: null,
    },
  });

  // Asignación de tareas a máquinas
  Object.assign(refs, {
    chuBeasley: {
      id: 'chu-beasley-1997',
      type: 'article',
      authors: 'Chu, P. C., & Beasley, J. E.',
      year: '1997',
      title: 'A genetic algorithm for the generalised assignment problem',
      container: 'Computers & Operations Research',
      details: { es: '24(1), 17–23', en: '24(1), 17–23' },
      url: 'https://doi.org/10.1016/S0305-0548(96)00032-9',
    },
    graham1979: {
      id: 'graham-1979',
      type: 'article',
      authors: 'Graham, R. L., Lawler, E. L., Lenstra, J. K., & Rinnooy Kan, A. H. G.',
      year: '1979',
      title: 'Optimization and approximation in deterministic sequencing and scheduling: A survey',
      container: 'Annals of Discrete Mathematics',
      details: { es: '5, 287–326', en: '5, 287–326' },
      url: 'https://doi.org/10.1016/S0167-5060(08)70356-X',
    },
    lenstra1990: {
      id: 'lenstra-shmoys-tardos-1990',
      type: 'article',
      authors: 'Lenstra, J. K., Shmoys, D. B., & Tardos, É.',
      year: '1990',
      title: 'Approximation algorithms for scheduling unrelated parallel machines',
      container: 'Mathematical Programming',
      details: { es: '46(1–3), 259–271', en: '46(1–3), 259–271' },
      url: 'https://doi.org/10.1007/BF01585745',
    },
  });

  // Función continua: codificación real y binaria
  Object.assign(refs, {
    janikowMichalewicz: {
      id: 'janikow-michalewicz-1991',
      type: 'inproceedings',
      authors: 'Janikow, C. Z., & Michalewicz, Z.',
      year: '1991',
      title: 'An experimental comparison of binary and floating point representations in genetic algorithms',
      container: 'Proceedings of the Fourth International Conference on Genetic Algorithms',
      details: { es: '(R. K. Belew y L. B. Booker, eds., pp. 31–36). Morgan Kaufmann', en: '(R. K. Belew & L. B. Booker, Eds., pp. 31–36). Morgan Kaufmann' },
      url: null,
    },
    caruanaSchaffer: {
      id: 'caruana-schaffer-1988',
      type: 'inproceedings',
      authors: 'Caruana, R. A., & Schaffer, J. D.',
      year: '1988',
      title: 'Representation and hidden bias: Gray vs. binary coding for genetic algorithms',
      container: 'Proceedings of the Fifth International Conference on Machine Learning',
      details: { es: '(pp. 153–161). Morgan Kaufmann', en: '(pp. 153–161). Morgan Kaufmann' },
      url: 'https://doi.org/10.1016/B978-0-934613-64-4.50021-9',
    },
    himmelblau1972: {
      id: 'himmelblau-1972',
      type: 'book',
      authors: 'Himmelblau, D. M.',
      year: '1972',
      title: 'Applied nonlinear programming',
      details: { es: 'McGraw-Hill', en: 'McGraw-Hill' },
      url: null,
    },
    muhlenbein1991: {
      id: 'muhlenbein-schomisch-born-1991',
      type: 'article',
      authors: 'Mühlenbein, H., Schomisch, M., & Born, J.',
      year: '1991',
      title: 'The parallel genetic algorithm as function optimizer',
      container: 'Parallel Computing',
      details: { es: '17(6–7), 619–632', en: '17(6–7), 619–632' },
      url: 'https://doi.org/10.1016/S0167-8191(05)80052-3',
    },
  });

  /*
   * Formalización común de la función continua: filas cuyo MathML depende de la función elegida
   * (math(lang, fn)). Las codificaciones solo cambian la fila del espacio de búsqueda.
   */
  const sub = (a, b) => `<msub><mi>${a}</mi><mn>${b}</mn></msub>`;
  const x1 = sub('x', 1);
  const x2 = sub('x', 2);
  const sq = (inner) => `<msup><mrow><mo>(</mo>${inner}<mo>)</mo></mrow><mn>2</mn></msup>`;
  const pw2 = (v) => `<msup>${v}<mn>2</mn></msup>`;
  const num = (v, lang) => `<mn>${String(v).replace('-', '−').replace('.', lang === 'es' ? ',' : '.')}</mn>`;
  const BOX = { himmelblau: [-5, 5], rastrigin: [-5.12, 5.12] };
  const box = (fn) => BOX[fn] || BOX.himmelblau;
  const fnRows = {
    vars: { id: 'vars', label: { es: 'Variables', en: 'Variables' },
      math: () => `<math>${x1}<mo>,</mo>${x2}<mo>∈</mo><mi mathvariant="normal">ℝ</mi></math>` },
    obj: { id: 'obj', label: { es: 'Objetivo', en: 'Objective' },
      math: (lang, fn) => (fn === 'rastrigin'
        ? `<math><mo>min</mo><mspace width="0.3em"></mspace><mi>f</mi><mo>=</mo><mn>20</mn><mo>+</mo><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mn>2</mn></munderover><mo>(</mo><msubsup><mi>x</mi><mi>i</mi><mn>2</mn></msubsup><mo>−</mo><mn>10</mn><mspace width="0.17em"></mspace><mi>cos</mi><mo>⁡</mo><mspace width="0.17em"></mspace><mn>2</mn><mi>π</mi><msub><mi>x</mi><mi>i</mi></msub><mo>)</mo></math>`
        : `<math><mo>min</mo><mspace width="0.3em"></mspace><mi>f</mi><mo>=</mo>${sq(`${pw2(x1)}<mo>+</mo>${x2}<mo>−</mo><mn>11</mn>`)}<mo>+</mo>${sq(`${x1}<mo>+</mo>${pw2(x2)}<mo>−</mo><mn>7</mn>`)}</math>`) },
    cons: { id: 'cons', label: { es: 'Restricción', en: 'Constraint' },
      math: (lang, fn) => `<math>${num(box(fn)[0], lang)}<mo>≤</mo><msub><mi>x</mi><mi>i</mi></msub><mo>≤</mo>${num(box(fn)[1], lang)}<mo>,</mo><mspace width="0.6em"></mspace><mi>i</mi><mo>=</mo><mn>1</mn><mo>,</mo><mn>2</mn></math>` },
  };

  /** Referencia compartida con una nota propia del operador. */
  function ref(key, note, extra) {
    return Object.assign({}, refs[key], { note }, extra || {});
  }

  /**
   * getCode y getPseudocodeText a partir de las plantillas del operador.
   * pseudocode puede ser { es: [...], en: [...] } o una función (lang, variant) => [...].
   */
  function makeHelpers(codeTemplates, codeComments, pseudocode) {
    const lines = (lang, variant) => (typeof pseudocode === 'function' ? pseudocode(lang, variant) : (pseudocode[lang] || pseudocode.es));
    return {
      getCode(kind, lang) {
        const tpl = codeTemplates[kind];
        const comments = codeComments[lang] || codeComments.es;
        return tpl.template.replace(/\{\{(\w+)\}\}/g, (m, k) => (comments[k] != null ? comments[k] : m));
      },
      getPseudocodeText(lang, variant) {
        return lines(lang, variant).map((l) => '    '.repeat(l.indent) + l.text).join('\n') + '\n';
      },
      pseudocodeFor: lines,
    };
  }

  /** Referencias básicas del curso: aparecen en todos los operadores, tras la fuente original. */
  const CORE = ['talbi', 'bautista'];

  const api = { refs, ref, makeHelpers, CORE, fnRows, fnBox: box };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).contentCommon = api;
})(typeof self !== 'undefined' ? self : this);
