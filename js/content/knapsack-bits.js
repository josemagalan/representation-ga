/*
 * Contenido docente de la mochila 0/1 con representación binaria.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'En el problema de la mochila 0/1 hay n objetos, cada uno con un peso wᵢ y un valor vᵢ, y una mochila que admite como mucho un peso W. Hay que elegir qué objetos se meten para que el valor total sea máximo sin superar la capacidad. Es uno de los problemas de optimización combinatoria más estudiados (Martello y Toth, 1990) y aparece, con otros nombres, al seleccionar proyectos con un presupuesto, cargar un contenedor o decidir qué inversiones hacer.',
      'Formalizar antes de codificar obliga a separar tres cosas: qué se decide (las variables de decisión, aquí una xᵢ por objeto, que vale 1 si entra y 0 si no), qué se quiere conseguir (la función objetivo, maximizar Σ vᵢ xᵢ) y qué no se puede hacer (las restricciones, aquí una sola: Σ wᵢ xᵢ ≤ W). El conjunto de todas las combinaciones posibles de valores de las variables es el espacio de búsqueda: {0, 1}ⁿ, con 2ⁿ elementos, que se duplica con cada objeto nuevo.',
      'La codificación binaria es la más directa para este problema: un gen por variable de decisión, de modo que el cromosoma es literalmente el vector x. Talbi (2009) pide a una representación tres propiedades: completitud (todas las soluciones del problema se pueden representar), conexidad (los operadores pueden llevar de una solución a cualquier otra) y eficiencia (los operadores la manipulan con facilidad). La cadena de bits cumple las tres, pero tiene un inconveniente: también representa combinaciones que no caben en la mochila. Cuando la capacidad es ajustada, la mayoría de los cromosomas son infactibles.',
      'Hay tres formas clásicas de tratar los cromosomas infactibles, que Michalewicz (1996) comparó precisamente sobre este problema: penalizarlos, repararlos o cambiar la forma de leerlos con un decodificador. Elegir una no es un detalle de implementación: cambia qué soluciones ve el algoritmo y cómo de fácil le resulta llegar a las buenas.',
      'Penalización: el cromosoma se deja como está y su aptitud se rebaja según cuánto se pasa de la capacidad, el exceso e = peso − W. La penalización lineal resta λ · e; la cuadrática resta (λ · e)², que castiga poco los excesos pequeños y mucho los grandes. Michalewicz toma λ igual a la mayor relación valor/peso de la instancia. Si λ es demasiado pequeña, el algoritmo puede preferir soluciones que no se pueden usar; si es demasiado grande, le cuesta explorar cerca del límite de la capacidad, que es donde suelen estar las mejores soluciones (Richardson et al., 1989).',
      'Reparación: el cromosoma infactible se convierte en uno factible sacando objetos hasta que la mochila no pesa más que W. La reparación voraz saca primero el objeto con peor relación valor/peso; la aleatoria, uno cualquiera. Después hay que decidir si el cromosoma reparado sustituye al original en la población (enfoque lamarckiano) o solo se usa para calcular su aptitud (enfoque baldwiniano). Orvosh y Davis (1993) observaron que devolver a la población solo una pequeña parte de los reparados, en torno al 5 %, daba buenos resultados.',
      'Decodificador: en lugar de leer el cromosoma como la solución, se lee como unas instrucciones para construirla. Aquí, se recorren los genes en orden y cada 1 mete su objeto solo si todavía cabe. Así, cualquier cadena de bits da una solución factible, pero a cambio la representación deja de ser uno a uno: muchos cromosomas distintos dan la misma solución (redundancia), y el orden de los genes importa, porque los primeros objetos tienen preferencia.',
      'Coste: decodificar y evaluar un cromosoma lleva un tiempo O(n). La reparación voraz, tal como está escrita, O(n²) en el peor caso; ordenando antes los objetos por su relación valor/peso, O(n log n).',
    ],
    en: [
      'In the 0/1 knapsack problem there are n items, each with a weight wᵢ and a value vᵢ, and a knapsack that can hold at most a weight W. The task is to choose which items to pack so that the total value is maximal without exceeding the capacity. It is one of the most studied combinatorial optimisation problems (Martello and Toth, 1990) and appears, under other names, when selecting projects within a budget, loading a container or choosing investments.',
      'Formalising before encoding forces us to separate three things: what is decided (the decision variables, here one xᵢ per item, equal to 1 if it is packed and 0 otherwise), what we want to achieve (the objective function, maximise Σ vᵢ xᵢ) and what cannot be done (the constraints, here a single one: Σ wᵢ xᵢ ≤ W). The set of all possible combinations of values of the variables is the search space: {0, 1}ⁿ, with 2ⁿ elements, which doubles with every new item.',
      'Binary encoding is the most direct one for this problem: one gene per decision variable, so the chromosome is literally the vector x. Talbi (2009) asks three properties of a representation: completeness (every solution of the problem can be represented), connexity (the operators can lead from one solution to any other) and efficiency (the operators handle it easily). The bit string meets all three, but it has a drawback: it also represents combinations that do not fit in the knapsack. When the capacity is tight, most chromosomes are infeasible.',
      'There are three classic ways of dealing with infeasible chromosomes, which Michalewicz (1996) compared precisely on this problem: penalising them, repairing them or changing the way they are read with a decoder. Choosing one is not an implementation detail: it changes which solutions the algorithm sees and how easily it reaches the good ones.',
      'Penalty: the chromosome is left as it is and its fitness is lowered according to how far it exceeds the capacity, the excess e = weight − W. The linear penalty subtracts λ · e; the quadratic one subtracts (λ · e)², which punishes small excesses lightly and large ones heavily. Michalewicz sets λ equal to the largest value-to-weight ratio of the instance. If λ is too small, the algorithm may prefer solutions that cannot be used; if it is too large, it struggles to explore near the capacity limit, which is where the best solutions usually lie (Richardson et al., 1989).',
      'Repair: the infeasible chromosome is turned into a feasible one by removing items until the knapsack weighs no more than W. Greedy repair removes the item with the worst value-to-weight ratio first; random repair, any of them. Then one has to decide whether the repaired chromosome replaces the original in the population (the Lamarckian approach) or is only used to compute its fitness (the Baldwinian approach). Orvosh and Davis (1993) observed that returning only a small share of the repaired chromosomes to the population, around 5%, gave good results.',
      'Decoder: instead of reading the chromosome as the solution, it is read as instructions for building it. Here, the genes are scanned in order and each 1 packs its item only if it still fits. That way any bit string yields a feasible solution, but in exchange the representation is no longer one-to-one: many different chromosomes give the same solution (redundancy), and the order of the genes matters, because the first items take precedence.',
      'Cost: decoding and evaluating a chromosome takes O(n) time. Greedy repair, as written, O(n²) in the worst case; sorting the items by value-to-weight ratio beforehand, O(n log n).',
    ],
  };

  const variants = {
    'penalty-linear': {
      name: { es: 'Penalización lineal', en: 'Linear penalty' },
      desc: {
        es: 'El cromosoma no cambia; su aptitud es el valor menos λ · e, donde e es lo que se pasa de la capacidad.',
        en: 'The chromosome does not change; its fitness is the value minus λ · e, where e is how far it exceeds the capacity.',
      },
    },
    'penalty-quadratic': {
      name: { es: 'Penalización cuadrática', en: 'Quadratic penalty' },
      desc: {
        es: 'El cromosoma no cambia; su aptitud es el valor menos (λ · e)²: castiga poco los excesos pequeños y mucho los grandes.',
        en: 'The chromosome does not change; its fitness is the value minus (λ · e)²: small excesses are punished lightly and large ones heavily.',
      },
    },
    'repair-greedy': {
      name: { es: 'Reparación voraz', en: 'Greedy repair' },
      desc: {
        es: 'Se sacan objetos hasta que caben, empezando por el de peor relación valor/peso.',
        en: 'Items are removed until the rest fit, starting with the one with the worst value-to-weight ratio.',
      },
    },
    'repair-random': {
      name: { es: 'Reparación aleatoria', en: 'Random repair' },
      desc: {
        es: 'Se sacan objetos elegidos al azar hasta que caben. «Sortear de nuevo» cambia los números aleatorios.',
        en: 'Randomly chosen items are removed until the rest fit. “Draw again” changes the random numbers.',
      },
    },
    decoder: {
      name: { es: 'Decodificador', en: 'Decoder' },
      desc: {
        es: 'Los genes se leen en orden y cada 1 mete su objeto solo si cabe: toda cadena da una solución factible.',
        en: 'The genes are read in order and each 1 packs its item only if it fits: every string gives a feasible solution.',
      },
    },
  };

  // Formalización (MathML), una fila por elemento del modelo; la vista resalta la del paso actual.
  const msub = (a, b) => `<msub><mi>${a}</mi><mi>${b}</mi></msub>`;
  const sumI = '<munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover>';
  const formalization = {
    rows: [
      { id: 'vars', label: { es: 'Variables', en: 'Variables' },
        math: `<math>${msub('x', 'i')}<mo>∈</mo><mo>{</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>}</mo><mo>,</mo><mspace width="0.6em"></mspace><mi>i</mi><mo>=</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>n</mi></math>` },
      { id: 'obj', label: { es: 'Objetivo', en: 'Objective' },
        math: `<math display="inline"><mo>max</mo><mspace width="0.3em"></mspace>${sumI}${msub('v', 'i')}<mo>⁢</mo>${msub('x', 'i')}</math>` },
      { id: 'cons', label: { es: 'Restricción', en: 'Constraint' },
        math: `<math display="inline">${sumI}${msub('w', 'i')}<mo>⁢</mo>${msub('x', 'i')}<mo>≤</mo><mi>W</mi></math>` },
      { id: 'space', label: { es: 'Espacio de búsqueda', en: 'Search space' },
        math: '<math><mi>x</mi><mo>∈</mo><msup><mrow><mo>{</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>}</mo></mrow><mi>n</mi></msup><mo>,</mo><mspace width="0.6em"></mspace><mrow><mo>|</mo><msup><mrow><mo>{</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>}</mo></mrow><mi>n</mi></msup><mo>|</mo></mrow><mo>=</mo><msup><mn>2</mn><mi>n</mi></msup></math>' },
    ],
  };

  const narration = {
    es: {
      problem: 'Tenemos {n} objetos, cada uno con su peso w y su valor v, y una mochila de capacidad W = {W}. Entre todos pesan {S}: no caben todos, así que hay que elegir cuáles se meten para que el valor sea el máximo posible.',
      problemAllFit: 'Tenemos {n} objetos, cada uno con su peso w y su valor v, y una mochila de capacidad W = {W}. Entre todos pesan {S}, así que caben todos y el problema es trivial. Baja la capacidad para que haya que elegir.',
      formVars: 'Primero, qué se decide. Hay una variable de decisión por objeto: xᵢ vale 1 si el objeto i entra en la mochila y 0 si se queda fuera. Son {n} decisiones de sí o no.',
      formObj: 'Segundo, qué se quiere: maximizar el valor total, Σ vᵢ xᵢ. Cada objeto suma su valor solo si su xᵢ vale 1.',
      formCons: 'Tercero, qué no se puede: el peso total, Σ wᵢ xᵢ, no puede pasar de la capacidad W = {W}.',
      formSpace: 'Todas las combinaciones de ceros y unos forman el espacio de búsqueda: {pow} = {total}. Solo {feasible} caben en la mochila (el {pct} %). La mejor vale {opt}.',
      encode: 'Codificación: un gen por variable de decisión. El cromosoma es una cadena de {n} bits, {chrom}, y el gen i dice si el objeto i entra (1) o no (0). Haz clic en un gen para cambiarlo.',
      decodeIntro: 'Decodificar es pasar del cromosoma a la solución que representa. Leemos los genes de izquierda a derecha: cada 1 mete su objeto en la mochila.',
      decodeIntroDecoder: 'Con un decodificador, el cromosoma no es la solución, sino las instrucciones para construirla: leemos los genes de izquierda a derecha y cada 1 mete su objeto solo si todavía cabe.',
      decodeOut: 'Gen {pos} = 0: el objeto {pos} se queda fuera.',
      decodeIn: 'Gen {pos} = 1: el objeto {pos} entra (w = {w}, v = {v}). La mochila pesa {weight} y vale {value}.',
      decodeInOver: 'Gen {pos} = 1: el objeto {pos} entra (w = {w}, v = {v}). La mochila pesa {weight}, más que W = {W}, y vale {value}.',
      decodeSkip: 'Gen {pos} = 1, pero el objeto {pos} (w = {w}) no cabe: la mochila ya pesa {weight} y {weight} + {w} supera W = {W}. El decodificador lo salta.',
      decodeDoneOk: 'Solución decodificada: la mochila pesa {weight}, no más que W = {W}, y vale {value}.',
      decodeDoneOver: 'Solución decodificada: la mochila pesa {weight} y vale {value}, pero la capacidad es W = {W}.',
      feasible: 'Validez: la solución es factible, porque pesa {weight} ≤ W = {W}. Ningún tratamiento hace falta y su aptitud es su valor: {value}.',
      feasibleDecoder: 'Validez: con el decodificador la solución siempre es factible. Aquí ha cabido todo lo que pedía el cromosoma, y su aptitud es su valor: {value}.',
      feasibleDecoderSkipped: 'Validez: con el decodificador la solución siempre es factible. Se han saltado {skipped} objetos que no cabían, y la aptitud es el valor de lo que sí ha entrado: {value}.',
      decoderRedundancy: 'El precio es la redundancia: {count} cromosomas distintos se decodifican en esta misma solución, {sol}. El algoritmo no los distingue.',
      decoderRedundancyOne: 'El precio suele ser la redundancia, aunque esta solución, {sol}, solo sale de un cromosoma: el que la escribe tal cual.',
      infeasible: 'Validez: la solución es infactible. Pesa {weight} y la capacidad es W = {W}: se pasa en e = {e}.',
      penaltyLinear: 'Penalización lineal: aptitud = valor − λ · e = {value} − {lambda} · {e} = {fitness}. El cromosoma no cambia.',
      penaltyQuadratic: 'Penalización cuadrática: aptitud = valor − (λ · e)² = {value} − ({lambda} · {e})² = {value} − {pen} = {fitness}. El cromosoma no cambia.',
      penaltyBeats: 'Cuidado: esta solución infactible tiene aptitud {fitness}, más que la mejor solución factible, que vale {opt}. Con esta λ, el algoritmo preferiría una mochila que no se puede cerrar. Sube λ y compruébalo.',
      penaltyBelow: 'Su aptitud, {fitness}, queda por debajo de la mejor solución factible, que vale {opt}. Baja λ para ver cuándo dejaría de ser así.',
      repairIntroGreedy: 'Reparación voraz: sacamos objetos hasta que la mochila no pese más que W, empezando cada vez por el que tiene peor relación valor/peso. Sobra un peso de {e}.',
      repairIntroRandom: 'Reparación aleatoria: sacamos objetos elegidos al azar hasta que la mochila no pese más que W. Sobra un peso de {e}.',
      repairRemoveGreedy: 'El peor de los que quedan dentro es el objeto {item}: v/w = {v}/{w} = {ratio}. Lo sacamos y su gen pasa a 0. La mochila pesa {weight} ≤ W = {W}: ya cabe.',
      repairRemoveGreedyMore: 'El peor de los que quedan dentro es el objeto {item}: v/w = {v}/{w} = {ratio}. Lo sacamos y su gen pasa a 0. La mochila pesa {weight}: todavía se pasa de W = {W}.',
      repairRemoveRandom: 'Dentro están los objetos {list} (k = {k}). Sorteamos r = {r}: ⌊r · k⌋ = {pick}, así que sale el objeto {item} (contando desde 0). La mochila pesa {weight} ≤ W = {W}: ya cabe.',
      repairRemoveRandomMore: 'Dentro están los objetos {list} (k = {k}). Sorteamos r = {r}: ⌊r · k⌋ = {pick}, así que sale el objeto {item} (contando desde 0). La mochila pesa {weight}: todavía se pasa de W = {W}.',
      repairDone: 'Cromosoma reparado: {chrom}. Pesa {weight} ≤ W = {W} y vale {value}, que es su aptitud. Se pueden devolver a la población el reparado (lamarckiano) o el original (baldwiniano).',
    },
    en: {
      problem: 'We have {n} items, each with its weight w and its value v, and a knapsack of capacity W = {W}. Together they weigh {S}: they do not all fit, so we must choose which ones to pack to make the value as large as possible.',
      problemAllFit: 'We have {n} items, each with its weight w and its value v, and a knapsack of capacity W = {W}. Together they weigh {S}, so they all fit and the problem is trivial. Lower the capacity so that there is a choice to make.',
      formVars: 'First, what is decided. There is one decision variable per item: xᵢ is 1 if item i goes into the knapsack and 0 if it stays out. These are {n} yes-or-no decisions.',
      formObj: 'Second, what we want: to maximise the total value, Σ vᵢ xᵢ. Each item adds its value only if its xᵢ is 1.',
      formCons: 'Third, what cannot be done: the total weight, Σ wᵢ xᵢ, cannot exceed the capacity W = {W}.',
      formSpace: 'All the combinations of zeros and ones make up the search space: {pow} = {total}. Only {feasible} fit in the knapsack ({pct}%). The best one is worth {opt}.',
      encode: 'Encoding: one gene per decision variable. The chromosome is a string of {n} bits, {chrom}, and gene i says whether item i is packed (1) or not (0). Click a gene to change it.',
      decodeIntro: 'Decoding means going from the chromosome to the solution it represents. We read the genes from left to right: each 1 packs its item.',
      decodeIntroDecoder: 'With a decoder, the chromosome is not the solution but the instructions for building it: we read the genes from left to right and each 1 packs its item only if it still fits.',
      decodeOut: 'Gene {pos} = 0: item {pos} stays out.',
      decodeIn: 'Gene {pos} = 1: item {pos} goes in (w = {w}, v = {v}). The knapsack weighs {weight} and is worth {value}.',
      decodeInOver: 'Gene {pos} = 1: item {pos} goes in (w = {w}, v = {v}). The knapsack weighs {weight}, more than W = {W}, and is worth {value}.',
      decodeSkip: 'Gene {pos} = 1, but item {pos} (w = {w}) does not fit: the knapsack already weighs {weight} and {weight} + {w} exceeds W = {W}. The decoder skips it.',
      decodeDoneOk: 'Decoded solution: the knapsack weighs {weight}, no more than W = {W}, and is worth {value}.',
      decodeDoneOver: 'Decoded solution: the knapsack weighs {weight} and is worth {value}, but the capacity is W = {W}.',
      feasible: 'Validity: the solution is feasible, because it weighs {weight} ≤ W = {W}. No treatment is needed and its fitness is its value: {value}.',
      feasibleDecoder: 'Validity: with the decoder the solution is always feasible. Here everything the chromosome asked for fitted, and its fitness is its value: {value}.',
      feasibleDecoderSkipped: 'Validity: with the decoder the solution is always feasible. {skipped} items that did not fit were skipped, and the fitness is the value of what did go in: {value}.',
      decoderRedundancy: 'The price is redundancy: {count} different chromosomes decode into this same solution, {sol}. The algorithm cannot tell them apart.',
      decoderRedundancyOne: 'The price is usually redundancy, although this solution, {sol}, comes from a single chromosome: the one that spells it out as it is.',
      infeasible: 'Validity: the solution is infeasible. It weighs {weight} and the capacity is W = {W}: it exceeds it by e = {e}.',
      penaltyLinear: 'Linear penalty: fitness = value − λ · e = {value} − {lambda} · {e} = {fitness}. The chromosome does not change.',
      penaltyQuadratic: 'Quadratic penalty: fitness = value − (λ · e)² = {value} − ({lambda} · {e})² = {value} − {pen} = {fitness}. The chromosome does not change.',
      penaltyBeats: 'Careful: this infeasible solution has fitness {fitness}, more than the best feasible solution, which is worth {opt}. With this λ, the algorithm would prefer a knapsack that cannot be closed. Raise λ and check.',
      penaltyBelow: 'Its fitness, {fitness}, stays below the best feasible solution, which is worth {opt}. Lower λ to see when that would stop being the case.',
      repairIntroGreedy: 'Greedy repair: we remove items until the knapsack weighs no more than W, each time starting with the one with the worst value-to-weight ratio. There is an excess weight of {e}.',
      repairIntroRandom: 'Random repair: we remove randomly chosen items until the knapsack weighs no more than W. There is an excess weight of {e}.',
      repairRemoveGreedy: 'The worst of those still inside is item {item}: v/w = {v}/{w} = {ratio}. We remove it and its gene becomes 0. The knapsack weighs {weight} ≤ W = {W}: it now fits.',
      repairRemoveGreedyMore: 'The worst of those still inside is item {item}: v/w = {v}/{w} = {ratio}. We remove it and its gene becomes 0. The knapsack weighs {weight}: it still exceeds W = {W}.',
      repairRemoveRandom: 'Items {list} are inside (k = {k}). We draw r = {r}: ⌊r · k⌋ = {pick}, so item {item} comes out (counting from 0). The knapsack weighs {weight} ≤ W = {W}: it now fits.',
      repairRemoveRandomMore: 'Items {list} are inside (k = {k}). We draw r = {r}: ⌊r · k⌋ = {pick}, so item {item} comes out (counting from 0). The knapsack weighs {weight}: it still exceeds W = {W}.',
      repairDone: 'Repaired chromosome: {chrom}. It weighs {weight} ≤ W = {W} and is worth {value}, which is its fitness. Either the repaired chromosome (Lamarckian) or the original one (Baldwinian) can go back into the population.',
    },
  };

  // ---------- Pseudocódigo ----------
  const P = {
    es: {
      sig: (vr) => (vr.startsWith('penalty') ? 'EVALUAR_MOCHILA(x, w, v, W, λ)' : 'EVALUAR_MOCHILA(x, w, v, W)'),
      init: 'S ← ∅;  peso ← 0;  valor ← 0',
      forGene: 'para i = 1, …, n:',
      ifOne: 'si x[i] = 1:',
      ifOneFits: 'si x[i] = 1 y peso + w[i] ≤ W:',
      add: 'S ← S ∪ {i};  peso ← peso + w[i];  valor ← valor + v[i]',
      ifFeas: 'si peso ≤ W: devolver valor',
      retDecoder: 'devolver valor        // siempre factible',
      excess: 'e ← peso − W',
      penLinear: 'devolver valor − λ · e',
      penQuadratic: 'devolver valor − (λ · e)²',
      whileOver: 'mientras peso > W:',
      pickGreedy: 'j ← el objeto de S con menor v[j] / w[j]',
      pickRandom: 'sortear r en [0, 1);  j ← el ⌊r · |S|⌋-ésimo objeto de S, contando desde 0',
      remove: 'S ← S ∖ {j};  x[j] ← 0;  peso ← peso − w[j];  valor ← valor − v[j]',
      retRepair: 'devolver valor        // x queda reparado',
    },
    en: {
      sig: (vr) => (vr.startsWith('penalty') ? 'EVALUATE_KNAPSACK(x, w, v, W, λ)' : 'EVALUATE_KNAPSACK(x, w, v, W)'),
      init: 'S ← ∅;  weight ← 0;  value ← 0',
      forGene: 'for i = 1, …, n:',
      ifOne: 'if x[i] = 1:',
      ifOneFits: 'if x[i] = 1 and weight + w[i] ≤ W:',
      add: 'S ← S ∪ {i};  weight ← weight + w[i];  value ← value + v[i]',
      ifFeas: 'if weight ≤ W: return value',
      retDecoder: 'return value        // always feasible',
      excess: 'e ← weight − W',
      penLinear: 'return value − λ · e',
      penQuadratic: 'return value − (λ · e)²',
      whileOver: 'while weight > W:',
      pickGreedy: 'j ← the item in S with the smallest v[j] / w[j]',
      pickRandom: 'draw r in [0, 1);  j ← item number ⌊r · |S|⌋ of S, counting from 0',
      remove: 'S ← S ∖ {j};  x[j] ← 0;  weight ← weight − w[j];  value ← value − v[j]',
      retRepair: 'return value        // x is left repaired',
    },
  };

  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const vr = variant || 'penalty-linear';
    const head = [
      { id: 'sig', indent: 0, text: T.sig(vr) },
      { id: 'init', indent: 1, text: T.init },
      { id: 'forGene', indent: 1, text: T.forGene },
    ];
    if (vr === 'decoder') {
      return head.concat([
        { id: 'ifOne', indent: 2, text: T.ifOneFits },
        { id: 'add', indent: 3, text: T.add },
        { id: 'ifFeas', indent: 1, text: T.retDecoder },
      ]);
    }
    const lines = head.concat([
      { id: 'ifOne', indent: 2, text: T.ifOne },
      { id: 'add', indent: 3, text: T.add },
      { id: 'ifFeas', indent: 1, text: T.ifFeas },
    ]);
    if (vr.startsWith('penalty')) {
      return lines.concat([
        { id: 'excess', indent: 1, text: T.excess },
        { id: 'pen', indent: 1, text: vr === 'penalty-quadratic' ? T.penQuadratic : T.penLinear },
      ]);
    }
    return lines.concat([
      { id: 'whileOver', indent: 1, text: T.whileOver },
      { id: 'pick', indent: 2, text: vr === 'repair-random' ? T.pickRandom : T.pickGreedy },
      { id: 'remove', indent: 2, text: T.remove },
      { id: 'retRepair', indent: 1, text: T.retRepair },
    ]);
  }

  const keywords = {
    es: ['para', 'mientras', 'sortear', 'devolver', 'si', 'y'],
    en: ['for', 'while', 'draw', 'return', 'if', 'and'],
  };
  const stepLines = {
    problem: ['sig'],
    formVars: ['sig'],
    formObj: ['sig'],
    formCons: ['sig'],
    formSpace: ['sig'],
    encode: ['sig'],
    decodeIntro: ['init', 'forGene'],
    decodeOut: ['forGene', 'ifOne'],
    decodeIn: ['ifOne', 'add'],
    decodeSkip: ['ifOne'],
    decodeDone: ['forGene'],
    feasible: ['ifFeas'],
    decoderRedundancy: ['ifFeas'],
    infeasible: ['ifFeas'],
    penalty: ['excess', 'pen'],
    penaltyCompare: ['pen'],
    repairIntro: ['whileOver'],
    repairRemove: ['whileOver', 'pick', 'remove'],
    repairDone: ['retRepair'],
  };
  const fnName = { python: 'knapsack_fitness', javascript: 'knapsackFitness' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'knapsack_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def decode(x, weights, values, capacity, only_if_fits=False):
    """{{docDecode}}"""
    solution = [0] * len(x)
    weight = value = 0
    for i, gene in enumerate(x):
        if gene == 1 and (not only_if_fits or weight + weights[i] <= capacity):
            solution[i] = 1
            weight += weights[i]
            value += values[i]
    return solution, weight, value


def knapsack_fitness(x, weights, values, capacity, method="penalty-linear", lam=1.0, rng=random):
    """{{docFitness}}"""
    if method == "decoder":
        solution, weight, value = decode(x, weights, values, capacity, only_if_fits=True)
        return value, solution  # {{alwaysFeasible}}
    solution, weight, value = decode(x, weights, values, capacity)
    if weight <= capacity:
        return value, solution
    if method in ("penalty-linear", "penalty-quadratic"):
        excess = weight - capacity
        penalty = lam * excess if method == "penalty-linear" else (lam * excess) ** 2
        return value - penalty, solution  # {{unchanged}}
    if method not in ("repair-greedy", "repair-random"):
        raise ValueError(method)
    while weight > capacity:
        inside = [i for i, s in enumerate(solution) if s == 1]
        if method == "repair-greedy":
            j = min(inside, key=lambda i: values[i] / weights[i])  # {{worst}}
        else:
            j = inside[int(rng.random() * len(inside))]
        solution[j] = 0
        weight -= weights[j]
        value -= values[j]
    return value, solution  # {{repaired}}


if __name__ == "__main__":
    # {{example}}
    w = [3, 5, 2, 7, 4]
    v = [4, 6, 3, 8, 2]
    x = [1, 1, 0, 1, 1]
    for method in ("penalty-linear", "penalty-quadratic", "repair-greedy", "decoder"):
        print(method, knapsack_fitness(x, w, v, 12, method))
    # penalty-linear (13.0, [1, 1, 0, 1, 1])
    # penalty-quadratic (-29.0, [1, 1, 0, 1, 1])
    # repair-greedy (10, [1, 1, 0, 0, 0])
    # decoder (12, [1, 1, 0, 0, 1])
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'knapsack-fitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docDecode}} */
function decode(x, weights, values, capacity, onlyIfFits = false) {
  const solution = Array(x.length).fill(0);
  let weight = 0;
  let value = 0;
  x.forEach((gene, i) => {
    if (gene === 1 && (!onlyIfFits || weight + weights[i] <= capacity)) {
      solution[i] = 1;
      weight += weights[i];
      value += values[i];
    }
  });
  return { solution, weight, value };
}

/** {{docFitness}} */
function knapsackFitness(x, weights, values, capacity, method = 'penalty-linear', lam = 1, rng = Math.random) {
  if (method === 'decoder') {
    const d = decode(x, weights, values, capacity, true);
    return { fitness: d.value, solution: d.solution }; // {{alwaysFeasible}}
  }
  let { solution, weight, value } = decode(x, weights, values, capacity);
  if (weight <= capacity) return { fitness: value, solution };
  if (method === 'penalty-linear' || method === 'penalty-quadratic') {
    const excess = weight - capacity;
    const penalty = method === 'penalty-linear' ? lam * excess : (lam * excess) ** 2;
    return { fitness: value - penalty, solution }; // {{unchanged}}
  }
  if (method !== 'repair-greedy' && method !== 'repair-random') throw new Error(method);
  while (weight > capacity) {
    const inside = solution.map((s, i) => (s === 1 ? i : -1)).filter((i) => i >= 0);
    let j;
    if (method === 'repair-greedy') {
      j = inside.reduce((a, b) => (values[b] / weights[b] < values[a] / weights[a] ? b : a)); // {{worst}}
    } else {
      j = inside[Math.floor(rng() * inside.length)];
    }
    solution[j] = 0;
    weight -= weights[j];
    value -= values[j];
  }
  return { fitness: value, solution }; // {{repaired}}
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { decode, knapsackFitness };
  if (require.main === module) {
    // {{example}}
    const w = [3, 5, 2, 7, 4];
    const v = [4, 6, 3, 8, 2];
    const x = [1, 1, 0, 1, 1];
    for (const method of ['penalty-linear', 'penalty-quadratic', 'repair-greedy', 'decoder']) {
      console.log(method, knapsackFitness(x, w, v, 12, method));
    }
    // penalty-linear { fitness: 13, solution: [ 1, 1, 0, 1, 1 ] }
    // penalty-quadratic { fitness: -29, solution: [ 1, 1, 0, 1, 1 ] }
    // repair-greedy { fitness: 10, solution: [ 1, 1, 0, 0, 0 ] }
    // decoder { fitness: 12, solution: [ 1, 1, 0, 0, 1 ] }
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mochila 0/1 con representación binaria: decodificación y aptitud con penalización, reparación o decodificador.',
      ref: 'Referencias: Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docDecode: 'Pasa del cromosoma x (lista de 0 y 1) a la solución: qué objetos entran, su peso y su valor. Con only_if_fits, cada objeto entra solo si cabe (decodificador).',
      docFitness: 'Aptitud del cromosoma x para la mochila de capacidad capacity. method: "penalty-linear" (valor − λ·e), "penalty-quadratic" (valor − (λ·e)²), "repair-greedy", "repair-random" o "decoder". Devuelve la aptitud y la solución evaluada. rng es cualquier objeto con un método random() en [0, 1).',
      alwaysFeasible: 'toda cadena da una solución factible',
      unchanged: 'el cromosoma no cambia',
      worst: 'peor relación valor/peso; en caso de empate, el primero',
      repaired: 'solución reparada',
      example: 'Ejemplo: 5 objetos y capacidad 12; el cromosoma pesa 19 y se pasa en 7',
    },
    en: {
      title: '0/1 knapsack with binary representation: decoding and fitness with penalty, repair or a decoder.',
      ref: 'References: Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docDecode: 'Goes from chromosome x (a list of 0s and 1s) to the solution: which items are packed, their weight and their value. With only_if_fits, each item is packed only if it fits (decoder).',
      docFitness: 'Fitness of chromosome x for a knapsack of capacity capacity. method: "penalty-linear" (value − λ·e), "penalty-quadratic" (value − (λ·e)²), "repair-greedy", "repair-random" or "decoder". Returns the fitness and the evaluated solution. rng is any object with a random() method in [0, 1).',
      alwaysFeasible: 'every string gives a feasible solution',
      unchanged: 'the chromosome does not change',
      worst: 'worst value-to-weight ratio; on a tie, the first one',
      repaired: 'repaired solution',
      example: 'Example: 5 items and capacity 12; the chromosome weighs 19 and exceeds it by 7',
    },
  };

  const references = [
    C.ref('michalewicz', {
      es: 'Compara sobre el problema de la mochila 0/1 las tres formas de tratar los cromosomas infactibles: penalizaciones (logarítmica, lineal y cuadrática, con λ igual a la mayor relación valor/peso), reparaciones (aleatoria y voraz) y decodificadores.',
      en: 'Compares, on the 0/1 knapsack problem, the three ways of handling infeasible chromosomes: penalties (logarithmic, linear and quadratic, with λ equal to the largest value-to-weight ratio), repairs (random and greedy) and decoders.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la representación de las soluciones y sus propiedades deseables (completitud, conexidad y eficiencia), y las estrategias para manejar restricciones: rechazo, penalización, reparación, decodificación y preservación de la factibilidad.',
      en: 'The course’s reference textbook. Covers solution representation and its desirable properties (completeness, connexity and efficiency), and the strategies for handling constraints: rejection, penalising, repairing, decoding and preserving feasibility.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la codificación de las soluciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers the encoding of solutions in chapter 8, on genetic algorithms.',
    }),
    C.ref('martelloToth', {
      es: 'Monografía de referencia sobre los problemas de mochila: formulación, variantes y algoritmos exactos y aproximados.',
      en: 'Reference monograph on knapsack problems: formulation, variants, and exact and approximate algorithms.',
    }),
    C.ref('richardson', {
      es: 'Pautas para diseñar funciones de penalización en algoritmos genéticos; muestra el riesgo de penalizar demasiado poco o demasiado.',
      en: 'Guidelines for designing penalty functions in genetic algorithms; shows the risk of penalising too little or too much.',
    }),
    C.ref('orvoshDavis', {
      es: 'Estudia si conviene devolver a la población los cromosomas reparados y propone hacerlo solo con una pequeña parte, en torno al 5 %.',
      en: 'Studies whether repaired chromosomes should be returned to the population and suggests doing so for only a small share, around 5%.',
    }),
    C.ref('coello', {
      es: 'Revisión de las técnicas de manejo de restricciones en algoritmos evolutivos: penalizaciones, reparación, decodificadores y representaciones y operadores especiales.',
      en: 'Survey of constraint-handling techniques in evolutionary algorithms: penalties, repair, decoders, and special representations and operators.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Dedica un capítulo al manejo de restricciones, con las mismas familias de técnicas.',
      en: 'Evolutionary computing textbook. Devotes a chapter to constraint handling, with the same families of techniques.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'knapsack-bits', explanation, variants, formalization, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['knapsack-bits'] = api;
})(typeof self !== 'undefined' ? self : this);
