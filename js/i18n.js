/*
 * Textos de la interfaz en español e inglés.
 * t(lang, key, params) sustituye {param} por su valor.
 */
(function (root) {
  'use strict';

  const dict = {
    es: {
      portalHome: 'Herramientas de algoritmos genéticos',
      brand: 'Representación en algoritmos genéticos',
      homeTitleDoc: 'Representación de soluciones · Algoritmos genéticos',
      encTitleDoc: '{name} · Algoritmos genéticos',
      homeEyebrow: 'Herramienta docente',
      homeTitle: 'Representación de soluciones en algoritmos genéticos',
      homeLead: 'Antes de seleccionar, cruzar o mutar hay que decidir cómo se representa una solución como cromosoma. Esa decisión condiciona qué operadores tienen sentido, cuántas soluciones no factibles aparecen y lo fácil o difícil que resulta la búsqueda. Elige una representación y un problema para ver, paso a paso, cómo se formaliza, se codifica y se decodifica.',
      encodingsCount: '{n} codificaciones',
      encodingsCountOne: '1 codificación',
      comingSoon: 'Próximamente',
      allEncodings: 'Todas las representaciones',
      seriesHomeLink: 'Después de representar: selección, cruce y mutación, las otras herramientas de la serie',
      seriesSelection: 'Selección',
      seriesCrossover: 'Cruce',
      seriesMutation: 'Mutación',
    },
    en: {
      portalHome: 'Genetic algorithm tools',
      brand: 'Representation in genetic algorithms',
      homeTitleDoc: 'Solution representation · Genetic algorithms',
      encTitleDoc: '{name} · Genetic algorithms',
      homeEyebrow: 'Teaching tool',
      homeTitle: 'Solution representation in genetic algorithms',
      homeLead: 'Before selecting, crossing over or mutating, we have to decide how a solution is represented as a chromosome. That decision shapes which operators make sense, how many infeasible solutions appear and how easy or hard the search turns out to be. Choose a representation and a problem to see, step by step, how it is formalised, encoded and decoded.',
      encodingsCount: '{n} encodings',
      encodingsCountOne: '1 encoding',
      comingSoon: 'Coming soon',
      allEncodings: 'All representations',
      seriesHomeLink: 'After representation: selection, crossover and mutation, the other tools in the series',
      seriesSelection: 'Selection',
      seriesCrossover: 'Crossover',
      seriesMutation: 'Mutation',
    },
  };

  function t(lang, key, params) {
    const table = dict[lang] || dict.es;
    let s = table[key] != null ? table[key] : (dict.es[key] != null ? dict.es[key] : key);
    if (params) s = s.replace(/\{(\w+)\}/g, (m, p) => (params[p] != null ? params[p] : m));
    return s;
  }

  const api = { t, dict, languages: Object.keys(dict) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).i18n = api;
})(typeof self !== 'undefined' ? self : this);
