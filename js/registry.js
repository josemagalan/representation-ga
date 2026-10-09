/*
 * Catálogo de representaciones, problemas y codificaciones.
 * Representación → problemas → codificaciones. Una codificación con `ready: true` necesita tres
 * ficheros con su mismo id:
 *   js/problems/<id>.js  (instancia, decodificación, evaluación, factibilidad y traza)
 *   js/content/<id>.js   (formalización y contenido docente)
 *   js/ui/<id>.js        (controles, tarjetas propias y vista D3 de la página)
 * Las demás aparecen en la pantalla inicial como «próximamente».
 * Funciona tanto en el navegador (window.GAX.registry) como en Node (module.exports).
 */
(function (root) {
  'use strict';

  const representations = [
    {
      id: 'binary',
      name: { es: 'Binaria', en: 'Binary' },
      desc: {
        es: 'Cada gen es un bit (0 o 1) y representa una decisión de sí o no. Es la codificación natural cuando una solución consiste en elegir un subconjunto, pero no toda cadena de bits tiene por qué ser una solución factible.',
        en: 'Each gene is a bit (0 or 1) and stands for a yes-or-no decision. It is the natural encoding when a solution consists of choosing a subset, but not every bit string need be a feasible solution.',
      },
      sample: ['1', '0', '1', '1', '0', '0', '1', '0'],
      problems: [
        {
          id: 'knapsack',
          name: { es: 'Problema de la mochila', en: '0/1 knapsack problem' },
          encodings: [
            {
              id: 'knapsack-bits',
              ready: true,
              name: { es: 'Vector de bits', en: 'Bit vector' },
              summary: {
                es: 'Un bit por objeto: 1 si entra en la mochila. Si no cabe, hay que penalizar, reparar o decodificar.',
                en: 'One bit per item: 1 if it goes into the knapsack. If it does not fit, it must be penalised, repaired or decoded.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'integer',
      name: { es: 'Entera', en: 'Integer' },
      desc: {
        es: 'Cada gen es un número entero dentro de un rango y los valores pueden repetirse. Según el problema, el entero es una categoría sin orden (qué máquina) o una cantidad ordenada, y eso cambia qué operadores tienen sentido.',
        en: 'Each gene is an integer within a range, and values may repeat. Depending on the problem, the integer is an unordered category (which machine) or an ordered quantity, and that changes which operators make sense.',
      },
      sample: ['2', '1', '3', '2', '1'],
      problems: [
        {
          id: 'assignment',
          name: { es: 'Asignación de tareas a máquinas', en: 'Task-to-machine assignment' },
          encodings: [
            {
              id: 'assignment-int',
              ready: false,
              name: { es: 'Vector de enteros', en: 'Integer vector' },
              summary: {
                es: 'El gen i dice en qué máquina se hace la tarea i: cada tarea va a una sola máquina por construcción.',
                en: 'Gene i says on which machine task i is done: every task goes to exactly one machine by construction.',
              },
            },
            {
              id: 'assignment-matrix',
              ready: false,
              name: { es: 'Matriz binaria', en: 'Binary matrix' },
              summary: {
                es: 'Un bit por cada par tarea–máquina: la restricción «una máquina por tarea» hay que comprobarla.',
                en: 'One bit per task–machine pair: the “one machine per task” constraint has to be checked.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'permutation',
      name: { es: 'Permutacional', en: 'Permutation' },
      desc: {
        es: 'El cromosoma es un orden: cada valor aparece exactamente una vez. Aunque los genes sean enteros, no se pueden repetir, y eso condiciona la inicialización, el cruce y la mutación.',
        en: 'The chromosome is an order: each value appears exactly once. Although the genes are integers, they cannot repeat, and that shapes initialisation, crossover and mutation.',
      },
      sample: ['3', '1', '5', '2', '4'],
      problems: [
        {
          id: 'tsp',
          name: { es: 'Problema del viajante (TSP)', en: 'Travelling salesman problem (TSP)' },
          encodings: [
            {
              id: 'tsp-perm',
              ready: true,
              name: { es: 'Permutación de ciudades', en: 'Permutation of cities' },
              summary: {
                es: 'El orden de visita. Toda permutación es una ruta válida, pero cada ruta tiene 2n cromosomas equivalentes.',
                en: 'The visiting order. Every permutation is a valid tour, but each tour has 2n equivalent chromosomes.',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'real',
      name: { es: 'Real', en: 'Real-valued' },
      desc: {
        es: 'Cada gen es un número real dentro de unos límites. Es la codificación directa de las variables continuas; la alternativa clásica es codificarlas en binario con una precisión fija.',
        en: 'Each gene is a real number within bounds. It is the direct encoding of continuous variables; the classic alternative is to encode them in binary with a fixed precision.',
      },
      sample: ['1.25', '-0.73'],
      problems: [
        {
          id: 'function',
          name: { es: 'Optimización de una función continua', en: 'Continuous function optimisation' },
          encodings: [
            {
              id: 'function-real',
              ready: false,
              name: { es: 'Vector de reales', en: 'Real vector' },
              summary: {
                es: 'Un gen por variable, con toda la precisión de la máquina.',
                en: 'One gene per variable, with full machine precision.',
              },
            },
            {
              id: 'function-bits',
              ready: false,
              name: { es: 'Cadena binaria (estándar o Gray)', en: 'Bit string (standard or Gray)' },
              summary: {
                es: 'Cada variable en k bits: la precisión depende de k y el código Gray evita los saltos de Hamming.',
                en: 'Each variable in k bits: precision depends on k, and Gray code avoids Hamming cliffs.',
              },
            },
          ],
        },
      ],
    },
  ];

  const allEncodings = () => representations.flatMap((r) => r.problems.flatMap((p) => p.encodings.map((e) => Object.assign({ representation: r.id, problem: p.id }, e))));

  const getRepresentation = (id) => representations.find((r) => r.id === id) || null;
  const getEncoding = (id) => allEncodings().find((e) => e.id === id) || null;
  const isReady = (id) => !!(getEncoding(id) || {}).ready;
  const encodingCount = (rep) => rep.problems.reduce((n, p) => n + p.encodings.length, 0);

  const api = { representations, allEncodings, getRepresentation, getEncoding, isReady, encodingCount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).registry = api;
})(typeof self !== 'undefined' ? self : this);
