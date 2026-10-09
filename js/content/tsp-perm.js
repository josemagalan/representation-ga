/*
 * Contenido docente del problema del viajante con representación permutacional.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'En el problema del viajante (TSP) hay n ciudades y una distancia entre cada par. Hay que encontrar el circuito más corto que pase exactamente una vez por cada ciudad y vuelva a la de partida. Es el problema de optimización combinatoria más estudiado (Applegate et al., 2006) y el modelo de muchos problemas de rutas, secuenciación de tareas y fabricación. Aquí las ciudades están en un cuadrado de lado 100 y la distancia entre dos de ellas es la euclídea redondeada a una décima, igual que la biblioteca de problemas TSPLIB la redondea a enteros: así cada tramo, cada suma y el óptimo se escriben exactamente con los números que se ven.',
      'El mismo problema admite formalizaciones muy distintas. La clásica de programación lineal entera (Dantzig, Fulkerson y Johnson, 1954) usa una variable binaria xᵢⱼ por cada par de ciudades, que vale 1 si el circuito va de i a j, y necesita restricciones para que de cada ciudad se salga y se entre una vez y para que no se formen subcircuitos. La que se usa aquí toma como variable de decisión el propio orden de visita, una permutación π: la función objetivo es la longitud del circuito y la restricción ya no es una desigualdad, sino la estructura de la variable, que tiene que ser una permutación. La representación no viene impuesta por el problema: es una decisión de diseño.',
      'La codificación de camino (path representation) escribe el cromosoma como esa permutación: el gen k es la ciudad que se visita en el lugar k. Es la más natural y la más usada (Larrañaga et al., 1999), aunque no la única: la representación de adyacencia guarda en el gen i la ciudad que va después de la i, y la ordinal (Grefenstette et al., 1985) codifica el orden como una lista de posiciones dentro de las ciudades que quedan, de modo que cualquier cadena es válida.',
      'Toda permutación es un circuito válido, así que con esta codificación no hay cromosomas infactibles. El problema aparece al aplicar operadores pensados para otras representaciones: el cruce de un punto o el reinicio aleatorio de un gen dejan ciudades repetidas y otras sin visitar. Hay dos salidas: reparar el cromosoma, como hace la herramienta, o usar operadores que conservan la permutación, como el cruce PMX (Goldberg y Lingle, 1985) o el OX y las mutaciones de intercambio, inserción e inversión, que muestran las herramientas hermanas de cruce y mutación.',
      'El precio de la codificación de camino es la redundancia: un mismo circuito se puede empezar en cualquiera de sus n ciudades y recorrer en los dos sentidos, así que lo describen 2n permutaciones distintas. De las n! permutaciones solo hay (n − 1)!/2 circuitos diferentes. El algoritmo trata esos 2n cromosomas como soluciones distintas aunque tengan la misma aptitud, y dos padres que describen el mismo circuito con distinto punto de partida pueden tener hijos peores que ellos. Fijar la primera ciudad reduce la redundancia a 2.',
      'Coste: decodificar y evaluar un cromosoma lleva un tiempo O(n). Encontrar el óptimo, en cambio, es un problema NP-difícil. Para mostrar aquí el circuito óptimo se usa el algoritmo de programación dinámica de Held y Karp (1962), que tarda O(n² 2ⁿ): unas cien mil operaciones con 10 ciudades, pero más de cien billones con 40.',
    ],
    en: [
      'In the travelling salesman problem (TSP) there are n cities and a distance between each pair. The task is to find the shortest tour that visits every city exactly once and returns to the starting one. It is the most studied combinatorial optimisation problem (Applegate et al., 2006) and the model for many routing, task sequencing and manufacturing problems. Here the cities lie in a square of side 100 and the distance between two of them is the Euclidean one rounded to one decimal place, just as the TSPLIB problem library rounds it to integers: this way every leg, every sum and the optimum are written exactly with the numbers shown.',
      'The same problem admits very different formalisations. The classic integer linear programming one (Dantzig, Fulkerson and Johnson, 1954) uses a binary variable xᵢⱼ for each pair of cities, equal to 1 if the tour goes from i to j, and needs constraints so that each city is left and entered once and no subtours are formed. The one used here takes the visiting order itself as the decision variable, a permutation π: the objective function is the length of the tour and the constraint is no longer an inequality but the structure of the variable, which must be a permutation. The representation is not imposed by the problem: it is a design decision.',
      'Path representation writes the chromosome as that permutation: gene k is the city visited in place k. It is the most natural and the most widely used (Larrañaga et al., 1999), though not the only one: the adjacency representation stores in gene i the city that comes after city i, and the ordinal one (Grefenstette et al., 1985) encodes the order as a list of positions within the cities still left, so that any string is valid.',
      'Every permutation is a valid tour, so this encoding has no infeasible chromosomes. The problem appears when applying operators designed for other representations: one-point crossover or random resetting of a gene leave some cities repeated and others unvisited. There are two ways out: repairing the chromosome, as the tool does, or using operators that preserve the permutation, such as PMX crossover (Goldberg and Lingle, 1985) or OX and the swap, insert and inversion mutations, shown in the sister crossover and mutation tools.',
      'The price of path representation is redundancy: the same tour can start at any of its n cities and be travelled in either direction, so 2n different permutations describe it. Of the n! permutations there are only (n − 1)!/2 different tours. The algorithm treats those 2n chromosomes as different solutions even though they have the same fitness, and two parents describing the same tour from different starting cities may have children worse than themselves. Fixing the first city reduces the redundancy to 2.',
      'Cost: decoding and evaluating a chromosome takes O(n) time. Finding the optimum, on the other hand, is NP-hard. To show the optimal tour here, the tool uses Held and Karp’s (1962) dynamic programming algorithm, which takes O(n² 2ⁿ): about a hundred thousand operations with 10 cities, but over a hundred trillion with 40.',
    ],
  };

  const variants = {
    path: {
      name: { es: 'Representación de camino', en: 'Path representation' },
      desc: { es: 'El gen k es la ciudad que se visita en el lugar k.', en: 'Gene k is the city visited in place k.' },
    },
  };

  const msub = (a, b) => `<msub><mi>${a}</mi>${b}</msub>`;
  const mi = (x) => `<mi>${x}</mi>`;
  const formalization = {
    rows: [
      { id: 'vars', label: { es: 'Variables', en: 'Variables' },
        math: `<math><mi>π</mi><mo>=</mo><mo>(</mo>${msub('π', mi('1'))}<mo>,</mo><mo>…</mo><mo>,</mo>${msub('π', mi('n'))}<mo>)</mo><mo>,</mo><mspace width="0.6em"></mspace>${msub('π', mi('k'))}<mo>∈</mo><mo>{</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>n</mi><mo>}</mo></math>` },
      { id: 'obj', label: { es: 'Objetivo', en: 'Objective' },
        math: `<math><mo>min</mo><mspace width="0.3em"></mspace><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mrow><mi>n</mi><mo>−</mo><mn>1</mn></mrow></munderover><mi>d</mi><mo>(</mo>${msub('π', mi('k'))}<mo>,</mo>${msub('π', '<mrow><mi>k</mi><mo>+</mo><mn>1</mn></mrow>')}<mo>)</mo><mo>+</mo><mi>d</mi><mo>(</mo>${msub('π', mi('n'))}<mo>,</mo>${msub('π', '<mn>1</mn>')}<mo>)</mo></math>` },
      { id: 'cons', label: { es: 'Restricción', en: 'Constraint' },
        math: `<math>${msub('π', mi('i'))}<mo>≠</mo>${msub('π', mi('j'))}<mspace width="0.4em"></mspace><mtext>si</mtext><mspace width="0.4em"></mspace><mi>i</mi><mo>≠</mo><mi>j</mi></math>`,
        mathEn: `<math>${msub('π', mi('i'))}<mo>≠</mo>${msub('π', mi('j'))}<mspace width="0.4em"></mspace><mtext>if</mtext><mspace width="0.4em"></mspace><mi>i</mi><mo>≠</mo><mi>j</mi></math>` },
      { id: 'space', label: { es: 'Espacio de búsqueda', en: 'Search space' },
        math: `<math><mi>π</mi><mo>∈</mo>${msub('S', mi('n'))}<mo>,</mo><mspace width="0.6em"></mspace><mo>|</mo>${msub('S', mi('n'))}<mo>|</mo><mo>=</mo><mi>n</mi><mo>!</mo><mo>,</mo><mspace width="0.6em"></mspace><mfrac><mrow><mo>(</mo><mi>n</mi><mo>−</mo><mn>1</mn><mo>)</mo><mo>!</mo></mrow><mn>2</mn></mfrac></math>` },
    ],
  };

  const narration = {
    es: {
      problem: 'Tenemos {n} ciudades. El viajante sale de una, tiene que pasar por todas exactamente una vez y volver a la de partida recorriendo la menor distancia posible.',
      formVars: 'Primero, qué se decide: el orden de visita. La variable de decisión es una secuencia π = (π₁, …, πₙ) de las {n} ciudades, donde πₖ es la ciudad que se visita en el lugar k.',
      formObj: 'Segundo, qué se quiere: minimizar la longitud del circuito, la suma de las distancias entre ciudades consecutivas más la vuelta de la última a la primera. Cada distancia es la euclídea redondeada a una décima.',
      formCons: 'Tercero, qué no se puede: repetir una ciudad o saltarse alguna. Aquí la restricción no es una desigualdad, sino la estructura de la variable: π tiene que ser una permutación de las ciudades.',
      formSpace: 'Hay {n}! = {fact} permutaciones, pero solo {tours} circuitos distintos: cada uno se puede empezar en cualquiera de sus {n} ciudades y recorrer en dos sentidos, así que lo describen 2n = {twoN} permutaciones. El más corto, en trazo discontinuo, mide {opt}.',
      encode: 'Codificación de camino: el cromosoma es la propia permutación, {chrom}, y el gen k es la ciudad que se visita en el lugar k. Pulsa dos genes para intercambiarlos: el resultado sigue siendo una permutación.',
      decodeIntro: 'Decodificar es pasar del cromosoma al circuito: recorremos los genes de izquierda a derecha y unimos cada ciudad con la siguiente.',
      decodeStart: 'Gen 1: el viajante sale de la ciudad {city}.',
      decodeGo: 'Gen {k}: de la ciudad {from} a la {to}, {d}. Llevamos {len}.',
      decodeRepeat: 'Gen {k}: de la ciudad {from} a la {to}, {d}. ¡Pero la ciudad {to} ya se había visitado! Llevamos {len}.',
      decodeClose: 'Para cerrar el circuito, de la última ciudad, la {from}, se vuelve a la primera, la {to}: {d}. Longitud total: {len}.',
      decodeDone: 'El circuito mide {len}. El óptimo, en trazo discontinuo, mide {opt}: este es un {gap} % más largo.',
      decodeDoneOpt: 'El circuito mide {len}: es el más corto posible, el óptimo.',
      validPerm: 'Validez: el cromosoma es una permutación, con cada ciudad una sola vez, así que describe un circuito válido y su aptitud es su longitud, {len}. Con esta codificación no hay cromosomas infactibles mientras los operadores conserven la permutación.',
      redundancy: 'El precio es la redundancia: los {twoN} cromosomas de la tabla describen este mismo circuito ({n} puntos de partida × 2 sentidos). El algoritmo los trata como soluciones distintas aunque tengan la misma aptitud.',
      invalidPerm: 'Validez: el cromosoma no es una permutación. Ciudades repetidas: {rep}. Ciudades que faltan: {miss}. No describe un circuito del viajante, así que no tiene sentido darle una aptitud. Es lo que dejan un cruce o una mutación pensados para otra representación.',
      repairIntro: 'Reparación: recorremos el cromosoma y, cada vez que una ciudad aparece por segunda vez, la cambiamos por la menor de las que faltan.',
      repairFix: 'Gen {pos}: la ciudad {old} ya estaba en el circuito; la cambiamos por la {nw}.',
      repairDone: 'Cromosoma reparado: {chrom}, un circuito válido de longitud {len}. Lo habitual, en cambio, es usar operadores que no rompan la permutación, como los que muestran las herramientas de cruce y mutación.',
    },
    en: {
      problem: 'We have {n} cities. The salesman leaves from one, must pass through all of them exactly once and return to the starting one, travelling the shortest possible distance.',
      formVars: 'First, what is decided: the visiting order. The decision variable is a sequence π = (π₁, …, πₙ) of the {n} cities, where πₖ is the city visited in place k.',
      formObj: 'Second, what we want: to minimise the length of the tour, the sum of the distances between consecutive cities plus the way back from the last one to the first. Each distance is the Euclidean one rounded to one decimal place.',
      formCons: 'Third, what cannot be done: repeating a city or skipping one. Here the constraint is not an inequality but the structure of the variable: π must be a permutation of the cities.',
      formSpace: 'There are {n}! = {fact} permutations, but only {tours} different tours: each one can start at any of its {n} cities and be travelled in two directions, so 2n = {twoN} permutations describe it. The shortest one, dashed, is {opt} long.',
      encode: 'Path representation: the chromosome is the permutation itself, {chrom}, and gene k is the city visited in place k. Click two genes to swap them: the result is still a permutation.',
      decodeIntro: 'Decoding means going from the chromosome to the tour: we read the genes from left to right and join each city to the next one.',
      decodeStart: 'Gene 1: the salesman leaves from city {city}.',
      decodeGo: 'Gene {k}: from city {from} to city {to}, {d}. So far, {len}.',
      decodeRepeat: 'Gene {k}: from city {from} to city {to}, {d}. But city {to} had already been visited! So far, {len}.',
      decodeClose: 'To close the tour, from the last city, {from}, back to the first, {to}: {d}. Total length: {len}.',
      decodeDone: 'The tour is {len} long. The optimum, dashed, is {opt}: this one is {gap}% longer.',
      decodeDoneOpt: 'The tour is {len} long: it is the shortest possible, the optimum.',
      validPerm: 'Validity: the chromosome is a permutation, with each city only once, so it describes a valid tour and its fitness is its length, {len}. With this encoding there are no infeasible chromosomes as long as the operators preserve the permutation.',
      redundancy: 'The price is redundancy: the {twoN} chromosomes in the table describe this same tour ({n} starting cities × 2 directions). The algorithm treats them as different solutions even though they have the same fitness.',
      invalidPerm: 'Validity: the chromosome is not a permutation. Repeated cities: {rep}. Missing cities: {miss}. It does not describe a travelling salesman tour, so giving it a fitness makes no sense. This is what a crossover or mutation designed for another representation leaves behind.',
      repairIntro: 'Repair: we scan the chromosome and, whenever a city appears for the second time, we replace it by the smallest of the missing ones.',
      repairFix: 'Gene {pos}: city {old} was already in the tour; we replace it by city {nw}.',
      repairDone: 'Repaired chromosome: {chrom}, a valid tour of length {len}. The usual approach, however, is to use operators that do not break the permutation, like those shown in the crossover and mutation tools.',
    },
  };

  const P = {
    es: {
      sig: 'EVALUAR_CIRCUITO(π, d)',
      check: 'si π no es una permutación: π ← REPARAR(π)',
      len: 'L ← 0',
      forK: 'para k = 1, …, n − 1:',
      add: 'L ← L + d(π[k], π[k + 1])',
      close: 'L ← L + d(π[n], π[1])        // vuelta al origen',
      ret: 'devolver L',
      rsig: 'REPARAR(π)',
      rinit: 'vistas ← ∅;  faltan ← ciudades que no están en π, de menor a mayor',
      rfor: 'para k = 1, …, n:',
      rif: 'si π[k] ∈ vistas: π[k] ← primera de faltan, que se quita de faltan',
      radd: 'vistas ← vistas ∪ {π[k]}',
      rret: 'devolver π',
    },
    en: {
      sig: 'EVALUATE_TOUR(π, d)',
      check: 'if π is not a permutation: π ← REPAIR(π)',
      len: 'L ← 0',
      forK: 'for k = 1, …, n − 1:',
      add: 'L ← L + d(π[k], π[k + 1])',
      close: 'L ← L + d(π[n], π[1])        // back to the start',
      ret: 'return L',
      rsig: 'REPAIR(π)',
      rinit: 'seen ← ∅;  missing ← cities not in π, in increasing order',
      rfor: 'for k = 1, …, n:',
      rif: 'if π[k] ∈ seen: π[k] ← first of missing, which is removed from missing',
      radd: 'seen ← seen ∪ {π[k]}',
      rret: 'return π',
    },
  };

  function pseudocode(lang) {
    const T = P[lang] || P.es;
    return [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'check', indent: 1, text: T.check },
      { id: 'len', indent: 1, text: T.len },
      { id: 'forK', indent: 1, text: T.forK },
      { id: 'add', indent: 2, text: T.add },
      { id: 'close', indent: 1, text: T.close },
      { id: 'ret', indent: 1, text: T.ret },
      { id: 'blank', indent: 0, text: '' },
      { id: 'rsig', indent: 0, text: T.rsig },
      { id: 'rinit', indent: 1, text: T.rinit },
      { id: 'rfor', indent: 1, text: T.rfor },
      { id: 'rif', indent: 2, text: T.rif },
      { id: 'radd', indent: 2, text: T.radd },
      { id: 'rret', indent: 1, text: T.rret },
    ];
  }

  const keywords = { es: ['para', 'si no', 'si', 'devolver', 'no es'], en: ['for', 'if', 'return', 'is not'] };
  const stepLines = {
    problem: ['sig'], formVars: ['sig'], formObj: ['sig'], formCons: ['sig'], formSpace: ['sig'], encode: ['sig'],
    decodeIntro: ['len'],
    decodeStart: ['forK'],
    decodeGo: ['forK', 'add'],
    decodeRepeat: ['forK', 'add'],
    decodeClose: ['close'],
    decodeDone: ['ret'],
    validPerm: ['check', 'ret'],
    redundancy: ['ret'],
    invalidPerm: ['check'],
    repairIntro: ['rsig', 'rinit'],
    repairFix: ['rfor', 'rif'],
    repairDone: ['rret'],
  };
  const fnName = { python: 'tsp_fitness', javascript: 'tspFitness' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'tsp_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def tour_length(tour, coords):
    """{{docLength}}"""
    n = len(tour)
    tenths = 0  # {{tenths}}
    for k in range(n):
        a = coords[tour[k] - 1]
        b = coords[tour[(k + 1) % n] - 1]  # {{wrap}}
        tenths += math.floor(math.hypot(a[0] - b[0], a[1] - b[1]) * 10 + 0.5)
    return tenths / 10


def repair(x):
    """{{docRepair}}"""
    missing = sorted(set(range(1, len(x) + 1)) - set(x))
    seen = set()
    tour = list(x)
    for k, city in enumerate(tour):
        if city in seen:
            tour[k] = missing.pop(0)
        seen.add(tour[k])
    return tour


def equivalent_chromosomes(tour):
    """{{docEquiv}}"""
    n = len(tour)
    back = tour[::-1]
    return [tour[k:] + tour[:k] for k in range(n)] + [back[k:] + back[:k] for k in range(n)]


def tsp_fitness(x, coords):
    """{{docFitness}}"""
    tour = repair(x)  # {{noChange}}
    return tour_length(tour, coords), tour


if __name__ == "__main__":
    # {{example}}
    coords = [(10, 10), (90, 10), (90, 90), (10, 90), (50, 50)]
    print(tsp_fitness([1, 2, 5, 3, 4], coords))  # (353.2, [1, 2, 5, 3, 4])
    print(tsp_fitness([1, 2, 2, 3, 4], coords))  # (353.2, [1, 2, 5, 3, 4])
    print(len(equivalent_chromosomes([1, 2, 5, 3, 4])))  # 10
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'tsp-fitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docLength}} */
function tourLength(tour, coords) {
  const n = tour.length;
  let tenths = 0; // {{tenths}}
  for (let k = 0; k < n; k++) {
    const a = coords[tour[k] - 1];
    const b = coords[tour[(k + 1) % n] - 1]; // {{wrap}}
    tenths += Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) * 10);
  }
  return tenths / 10;
}

/** {{docRepair}} */
function repair(x) {
  const present = new Set(x);
  const missing = [];
  for (let c = 1; c <= x.length; c++) if (!present.has(c)) missing.push(c);
  const seen = new Set();
  const tour = x.slice();
  tour.forEach((city, k) => {
    if (seen.has(city)) tour[k] = missing.shift();
    seen.add(tour[k]);
  });
  return tour;
}

/** {{docEquiv}} */
function equivalentChromosomes(tour) {
  const n = tour.length;
  const back = tour.slice().reverse();
  const rot = (a, k) => a.slice(k).concat(a.slice(0, k));
  return [...Array(n).keys()].map((k) => rot(tour, k)).concat([...Array(n).keys()].map((k) => rot(back, k)));
}

/** {{docFitness}} */
function tspFitness(x, coords) {
  const tour = repair(x); // {{noChange}}
  return { length: tourLength(tour, coords), tour };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { tourLength, repair, equivalentChromosomes, tspFitness };
  if (require.main === module) {
    // {{example}}
    const coords = [[10, 10], [90, 10], [90, 90], [10, 90], [50, 50]];
    console.log(tspFitness([1, 2, 5, 3, 4], coords)); // { length: 353.2, tour: [1, 2, 5, 3, 4] }
    console.log(tspFitness([1, 2, 2, 3, 4], coords)); // { length: 353.2, tour: [1, 2, 5, 3, 4] }
    console.log(equivalentChromosomes([1, 2, 5, 3, 4]).length); // 10
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Problema del viajante con representación de camino: evaluación, reparación y cromosomas equivalentes.',
      ref: 'Referencias: Grefenstette et al. (1985); Larrañaga et al. (1999); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docLength: 'Longitud del circuito cerrado que visita las ciudades en el orden del cromosoma. coords[c - 1] son las coordenadas (x, y) de la ciudad c. Cada distancia es la euclídea redondeada a décimas.',
      tenths: 'se suma en décimas enteras, para que el resultado sea exacto',
      wrap: 'tras la última ciudad se vuelve a la primera',
      docRepair: 'Convierte el cromosoma en una permutación: cada ciudad que aparece por segunda vez se cambia por la menor de las que faltan.',
      docEquiv: 'Los 2n cromosomas que describen el mismo circuito: las n rotaciones y las n del sentido contrario.',
      docFitness: 'Aptitud (longitud, a minimizar) del cromosoma x, reparado si no es una permutación. Devuelve la longitud y el circuito evaluado.',
      noChange: 'si x ya es una permutación, no cambia',
      example: 'Ejemplo: cinco ciudades, un cromosoma válido y otro con la ciudad 2 repetida',
    },
    en: {
      title: 'Travelling salesman problem with path representation: evaluation, repair and equivalent chromosomes.',
      ref: 'References: Grefenstette et al. (1985); Larrañaga et al. (1999); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docLength: 'Length of the closed tour that visits the cities in the order of the chromosome. coords[c - 1] holds the (x, y) coordinates of city c. Each distance is the Euclidean one rounded to tenths.',
      tenths: 'summed in whole tenths, so that the result is exact',
      wrap: 'after the last city, back to the first',
      docRepair: 'Turns the chromosome into a permutation: every city that appears for the second time is replaced by the smallest missing one.',
      docEquiv: 'The 2n chromosomes that describe the same tour: the n rotations and the n of the opposite direction.',
      docFitness: 'Fitness (length, to be minimised) of chromosome x, repaired if it is not a permutation. Returns the length and the evaluated tour.',
      noChange: 'if x is already a permutation, it does not change',
      example: 'Example: five cities, a valid chromosome and another with city 2 repeated',
    },
  };

  const references = [
    C.ref('grefenstette1985', {
      es: 'Uno de los primeros trabajos sobre algoritmos genéticos para el viajante. Compara representaciones (de camino, de adyacencia y ordinal) y muestra que la ordinal admite el cruce clásico a costa de transmitir mal la información de los padres.',
      en: 'One of the first works on genetic algorithms for the travelling salesman. Compares representations (path, adjacency and ordinal) and shows that the ordinal one allows classic crossover at the cost of passing on the parents’ information poorly.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la representación de las soluciones, con las permutaciones como codificación de los problemas de secuenciación, y sus propiedades deseables.',
      en: 'The course’s reference textbook. Covers solution representation, with permutations as the encoding for sequencing problems, and its desirable properties.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la codificación de las soluciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers the encoding of solutions in chapter 8, on genetic algorithms.',
    }),
    C.ref('larranaga', {
      es: 'Revisión de las representaciones (binaria, de camino, de adyacencia, ordinal y matricial) y de los operadores de los algoritmos genéticos para el viajante.',
      en: 'Review of the representations (binary, path, adjacency, ordinal and matrix) and operators of genetic algorithms for the travelling salesman.',
    }),
    C.ref('goldbergLingle', {
      es: 'Propone el cruce PMX, que conserva la permutación, y estudia qué información de los padres pasa a los hijos con la representación de camino.',
      en: 'Proposes PMX crossover, which preserves the permutation, and studies what information passes from parents to children with path representation.',
    }),
    C.ref('dfj', {
      es: 'Formulación clásica del viajante como programa lineal entero, con una variable binaria por arco y restricciones de eliminación de subcircuitos.',
      en: 'Classic formulation of the travelling salesman as an integer linear program, with one binary variable per arc and subtour elimination constraints.',
    }),
    C.ref('heldKarp', {
      es: 'Algoritmo de programación dinámica que encuentra el circuito óptimo en O(n² 2ⁿ). Es el que usa la herramienta para mostrar el óptimo.',
      en: 'Dynamic programming algorithm that finds the optimal tour in O(n² 2ⁿ). It is the one the tool uses to show the optimum.',
    }),
    C.ref('applegate', {
      es: 'Monografía de referencia sobre el problema del viajante: historia, formulaciones y métodos de resolución exacta.',
      en: 'Reference monograph on the travelling salesman problem: history, formulations and exact solution methods.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'tsp-perm', explanation, variants, formalization, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['tsp-perm'] = api;
})(typeof self !== 'undefined' ? self : this);
