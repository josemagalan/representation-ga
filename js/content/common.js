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

  const api = { refs, ref, makeHelpers, CORE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).contentCommon = api;
})(typeof self !== 'undefined' ? self : this);
