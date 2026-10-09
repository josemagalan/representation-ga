/*
 * Contenido docente de la asignación de tareas a máquinas con un vector de enteros.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'En el problema de asignación de tareas a máquinas no relacionadas hay n tareas y m máquinas que trabajan a la vez. La máquina j tarda pᵢⱼ en hacer la tarea i, y ese tiempo depende de la pareja: una máquina puede ser rápida con unas tareas y lenta con otras. Cada tarea se hace entera en una sola máquina, y se quiere que todo termine lo antes posible, es decir, minimizar el makespan Cmax, la mayor de las cargas de las máquinas. En la notación de Graham et al. (1979) es el problema R‖Cmax. Es NP-difícil, e incluso aproximarlo con garantías es delicado (Lenstra, Shmoys y Tardos, 1990). Aparece al repartir pedidos entre líneas de producción, trabajos entre procesadores o expedientes entre equipos.',
      'El mismo problema admite dos formalizaciones naturales. La de programación lineal entera usa una variable binaria yᵢⱼ por cada pareja tarea–máquina y una restricción por tarea, Σⱼ yᵢⱼ = 1, para que cada tarea vaya a exactamente una máquina. Esta, en cambio, usa una variable entera por tarea, aᵢ ∈ {1, …, m}: la máquina que la hace. Con ella la restricción desaparece, porque cada aᵢ es un único número: el dominio de la variable ha absorbido la restricción. La otra formalización, con su codificación como matriz binaria, se puede ver en la página hermana de esta.',
      'El vector de enteros copia esa variable: el gen i es la máquina de la tarea i. Cumple las tres propiedades que Talbi (2009) pide a una representación: es completa (toda asignación se puede escribir), conexa (cambiando genes se llega de una asignación a cualquier otra) y eficiente. Además, los mⁿ cromosomas son asignaciones factibles y cada asignación tiene un solo cromosoma: no hay que penalizar, ni reparar, ni hay redundancia. Chu y Beasley (1997) usaron esta codificación para el problema de asignación generalizada precisamente por eso.',
      'La localidad también es buena: cambiar un gen mueve una tarea de máquina, que es el cambio más pequeño posible en el plan, y solo altera la carga de dos máquinas. Con la matriz binaria, en cambio, cambiar un solo bit de una asignación factible siempre la vuelve infactible.',
      'Que los genes sean enteros no quiere decir que sean cantidades. Eiben y Smith (2015) distinguen entre atributos ordinales, cuyo orden tiene sentido (el número de unidades que se fabrican), y atributos nominales o categóricos, que son solo etiquetas. El número de máquina es nominal: la máquina 3 no está «más cerca» de la 2 que de la 1. Por eso aquí la mutación adecuada es el reinicio aleatorio, que cambia el gen por otra máquina cualquiera, y no la mutación de desplazamiento (creep), que suma o resta una cantidad pequeña; y el cruce aritmético, que promedia los padres, no tiene sentido. Los cruces de uno o dos puntos y el uniforme sí funcionan, porque solo copian genes.',
      'La codificación solo absorbe las restricciones que su estructura expresa. Si las máquinas tuvieran además una capacidad, como en el problema de asignación generalizada, habría vectores de enteros infactibles y volverían la penalización y la reparación, como en la mochila. Y si las máquinas fueran idénticas, renombrarlas daría m! cromosomas para cada plan: la redundancia del viajante reaparecería.',
      'Coste: decodificar y evaluar un cromosoma lleva un tiempo O(n + m). Encontrar el óptimo es NP-difícil; con estos tamaños la herramienta lo encuentra recorriendo las mⁿ asignaciones, como mucho 4⁸ = 65 536.',
    ],
    en: [
      'In the unrelated parallel machine assignment problem there are n tasks and m machines working at the same time. Machine j takes pᵢⱼ to do task i, and that time depends on the pair: a machine may be fast with some tasks and slow with others. Each task is done entirely on a single machine, and we want everything to finish as early as possible, that is, to minimise the makespan Cmax, the largest of the machine loads. In the notation of Graham et al. (1979) it is the R‖Cmax problem. It is NP-hard, and even approximating it with guarantees is delicate (Lenstra, Shmoys and Tardos, 1990). It arises when sharing orders among production lines, jobs among processors or cases among teams.',
      'The same problem admits two natural formalisations. The integer linear programming one uses a binary variable yᵢⱼ for each task–machine pair and one constraint per task, Σⱼ yᵢⱼ = 1, so that each task goes to exactly one machine. This one, instead, uses one integer variable per task, aᵢ ∈ {1, …, m}: the machine that does it. With it the constraint disappears, because each aᵢ is a single number: the domain of the variable has absorbed the constraint. The other formalisation, with its binary matrix encoding, can be seen on the sister page of this one.',
      'The integer vector copies that variable: gene i is the machine of task i. It meets the three properties Talbi (2009) asks of a representation: it is complete (every assignment can be written), connected (changing genes leads from one assignment to any other) and efficient. Moreover, all mⁿ chromosomes are feasible assignments and each assignment has a single chromosome: there is no need to penalise or repair, and there is no redundancy. Chu and Beasley (1997) used this encoding for the generalised assignment problem precisely for that reason.',
      'Locality is good too: changing one gene moves one task to another machine, which is the smallest possible change in the plan, and only alters the load of two machines. With the binary matrix, on the other hand, changing a single bit of a feasible assignment always makes it infeasible.',
      'That the genes are integers does not mean they are quantities. Eiben and Smith (2015) distinguish between ordinal attributes, whose order is meaningful (the number of units produced), and nominal or categorical attributes, which are just labels. The machine number is nominal: machine 3 is not “closer” to machine 2 than to machine 1. That is why the right mutation here is random resetting, which replaces the gene by any other machine, and not creep mutation, which adds or subtracts a small amount; and arithmetic crossover, which averages the parents, makes no sense. One- and two-point and uniform crossover do work, because they only copy genes.',
      'The encoding only absorbs the constraints that its structure expresses. If the machines also had a capacity, as in the generalised assignment problem, there would be infeasible integer vectors and penalty and repair would come back, as in the knapsack. And if the machines were identical, renaming them would give m! chromosomes for each plan: the redundancy of the travelling salesman would reappear.',
      'Cost: decoding and evaluating a chromosome takes O(n + m) time. Finding the optimum is NP-hard; with these sizes the tool finds it by going through all mⁿ assignments, at most 4⁸ = 65,536.',
    ],
  };

  const variants = {
    int: {
      name: { es: 'Vector de enteros', en: 'Integer vector' },
      desc: { es: 'El gen i es la máquina de la tarea i.', en: 'Gene i is the machine of task i.' },
    },
  };

  const sub = (a, b) => `<msub><mi>${a}</mi>${b}</msub>`;
  const mi = (x) => `<mi>${x}</mi>`;
  const set1m = '<mo>{</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>m</mi><mo>}</mo>';
  const formalization = {
    rows: [
      { id: 'vars', label: { es: 'Variables', en: 'Variables' },
        math: `<math>${sub('a', mi('i'))}<mo>∈</mo>${set1m}<mo>,</mo><mspace width="0.6em"></mspace><mi>i</mi><mo>=</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>n</mi></math>` },
      { id: 'obj', label: { es: 'Objetivo', en: 'Objective' },
        math: `<math><mo>min</mo><mspace width="0.3em"></mspace>${sub('C', mi('max'))}<mo>=</mo><munder><mo>max</mo><mi>j</mi></munder><munder><mo>∑</mo><mrow><mi>i</mi><mo>:</mo>${sub('a', mi('i'))}<mo>=</mo><mi>j</mi></mrow></munder>${sub('p', '<mrow><mi>i</mi><mi>j</mi></mrow>')}</math>` },
      { id: 'cons', label: { es: 'Restricción', en: 'Constraint' },
        math: `<math><mtext>ninguna explícita: cada </mtext>${sub('a', mi('i'))}<mtext> es una sola máquina</mtext></math>`,
        mathEn: `<math><mtext>none explicit: each </mtext>${sub('a', mi('i'))}<mtext> is a single machine</mtext></math>` },
      { id: 'space', label: { es: 'Espacio de búsqueda', en: 'Search space' },
        math: `<math><mi>a</mi><mo>∈</mo><msup><mrow>${set1m}</mrow><mi>n</mi></msup><mo>,</mo><mspace width="0.6em"></mspace><mo>|</mo><msup><mrow>${set1m}</mrow><mi>n</mi></msup><mo>|</mo><mo>=</mo><msup><mi>m</mi><mi>n</mi></msup></math>` },
    ],
  };

  const narration = {
    es: {
      problem: 'Hay {n} tareas y {m} máquinas distintas que trabajan a la vez. La tabla da el tiempo que tarda cada máquina en cada tarea: una misma tarea puede ser rápida en una máquina y lenta en otra. Cada tarea se hace en una sola máquina, y queremos que todo termine lo antes posible.',
      formVars: 'Primero, qué se decide: en qué máquina se hace cada tarea. Hay una variable entera por tarea, aᵢ ∈ {1, …, {m}}, la máquina de la tarea i; son {n} variables.',
      formObj: 'Segundo, qué se quiere: minimizar el makespan, Cmax, el momento en que termina la última máquina. La carga de una máquina es la suma de los tiempos de sus tareas, y Cmax es la mayor de las cargas.',
      formCons: 'Tercero, qué no se puede: hacer una tarea en dos máquinas o dejarla sin hacer. Con esta variable no hace falta escribirlo: cada aᵢ es un único número, así que cada tarea tiene exactamente una máquina. El dominio de la variable absorbe la restricción.',
      formSpace: 'Hay {pow} = {total} asignaciones posibles ({m} máquinas para cada una de las {n} tareas), y todas son factibles. El mejor makespan posible, la línea discontinua, es {opt}.',
      encode: 'Codificación: el cromosoma es la propia asignación, {chrom}. El gen i es la máquina de la tarea i, y en la tabla se resalta su tiempo. Haz clic en un gen para pasar su tarea a la máquina siguiente.',
      decodeIntro: 'Decodificar es pasar del cromosoma al plan de trabajo: recorremos las tareas en orden y cada una se pone a la cola de su máquina.',
      decodeTask: 'Gen {i} = {j}: la tarea {i} va a la máquina {j}, que tarda {p} en hacerla. La máquina {j} tiene ahora una carga de {load}.',
      decodeDone: 'Cargas de las máquinas: {loads}. El makespan es la mayor, {cmax} (máquina {crit}). El óptimo, la línea discontinua, es {opt}: este plan tarda un {gap} % más.',
      decodeDoneOpt: 'Cargas de las máquinas: {loads}. El makespan es la mayor, {cmax} (máquina {crit}), y es el óptimo: ningún plan termina antes.',
      validInt: 'Validez: cualquier vector de enteros entre 1 y m es una asignación factible, porque cada gen da una sola máquina a su tarea. Los {total} cromosomas son soluciones, y la aptitud de este es su makespan, {cmax}. Ni penalizar ni reparar: la codificación ha absorbido la restricción.',
      nominal: 'Los genes son enteros, pero no cantidades: la máquina 3 no está «más cerca» de la 2 que de la 1. Son etiquetas (un entero nominal), así que no tienen sentido operadores pensados para enteros ordinales, como sumar o restar 1 a un gen o promediar dos padres. Para mutar, se cambia el gen por otra de las {m} máquinas, cualquiera.',
    },
    en: {
      problem: 'There are {n} tasks and {m} different machines working at the same time. The table gives the time each machine takes on each task: the same task may be fast on one machine and slow on another. Each task is done on a single machine, and we want everything to finish as early as possible.',
      formVars: 'First, what is decided: on which machine each task is done. There is one integer variable per task, aᵢ ∈ {1, …, {m}}, the machine of task i; there are {n} variables.',
      formObj: 'Second, what we want: to minimise the makespan, Cmax, the time at which the last machine finishes. The load of a machine is the sum of the times of its tasks, and Cmax is the largest of the loads.',
      formCons: 'Third, what cannot be done: doing a task on two machines or leaving it undone. With this variable there is no need to write it down: each aᵢ is a single number, so each task has exactly one machine. The domain of the variable absorbs the constraint.',
      formSpace: 'There are {pow} = {total} possible assignments ({m} machines for each of the {n} tasks), and all of them are feasible. The best possible makespan, the dashed line, is {opt}.',
      encode: 'Encoding: the chromosome is the assignment itself, {chrom}. Gene i is the machine of task i, and its time is highlighted in the table. Click a gene to move its task to the next machine.',
      decodeIntro: 'Decoding means going from the chromosome to the work plan: we go through the tasks in order and each one joins the queue of its machine.',
      decodeTask: 'Gene {i} = {j}: task {i} goes to machine {j}, which takes {p} to do it. Machine {j} now has a load of {load}.',
      decodeDone: 'Machine loads: {loads}. The makespan is the largest, {cmax} (machine {crit}). The optimum, the dashed line, is {opt}: this plan takes {gap}% longer.',
      decodeDoneOpt: 'Machine loads: {loads}. The makespan is the largest, {cmax} (machine {crit}), and it is the optimum: no plan finishes earlier.',
      validInt: 'Validity: any vector of integers between 1 and m is a feasible assignment, because each gene gives its task a single machine. All {total} chromosomes are solutions, and the fitness of this one is its makespan, {cmax}. No penalty and no repair: the encoding has absorbed the constraint.',
      nominal: 'The genes are integers, but not quantities: machine 3 is not “closer” to machine 2 than to machine 1. They are labels (a nominal integer), so operators designed for ordinal integers, such as adding or subtracting 1 from a gene or averaging two parents, make no sense. To mutate, the gene is replaced by another of the {m} machines, any of them.',
    },
  };

  const P = {
    es: {
      sig: 'EVALUAR_ASIGNACIÓN(a, p)',
      init: 'para j = 1, …, m: carga[j] ← 0',
      forI: 'para i = 1, …, n:',
      add: 'carga[a[i]] ← carga[a[i]] + p[i, a[i]]',
      max: 'Cmax ← máx { carga[1], …, carga[m] }',
      ret: 'devolver Cmax        // siempre factible: nada que reparar',
    },
    en: {
      sig: 'EVALUATE_ASSIGNMENT(a, p)',
      init: 'for j = 1, …, m: load[j] ← 0',
      forI: 'for i = 1, …, n:',
      add: 'load[a[i]] ← load[a[i]] + p[i, a[i]]',
      max: 'Cmax ← max { load[1], …, load[m] }',
      ret: 'return Cmax        // always feasible: nothing to repair',
    },
  };

  function pseudocode(lang) {
    const T = P[lang] || P.es;
    return [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'init', indent: 1, text: T.init },
      { id: 'forI', indent: 1, text: T.forI },
      { id: 'add', indent: 2, text: T.add },
      { id: 'max', indent: 1, text: T.max },
      { id: 'ret', indent: 1, text: T.ret },
    ];
  }

  const keywords = { es: ['para', 'devolver'], en: ['for', 'return'] };
  const stepLines = {
    problem: ['sig'], formVars: ['sig'], formObj: ['sig'], formCons: ['sig'], formSpace: ['sig'], encode: ['sig'],
    decodeIntro: ['init'],
    decodeTask: ['forI', 'add'],
    decodeDone: ['max'],
    validInt: ['ret'],
    nominal: ['sig'],
  };
  const fnName = { python: 'assignment_fitness', javascript: 'assignmentFitness' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'assignment_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""


def machine_loads(a, p):
    """{{docLoads}}"""
    m = len(p[0])
    loads = [0] * m
    for i, machine in enumerate(a):
        loads[machine - 1] += p[i][machine - 1]  # {{oneMachine}}
    return loads


def assignment_fitness(a, p):
    """{{docFitness}}"""
    return max(machine_loads(a, p)), list(a)


if __name__ == "__main__":
    # {{example}}
    p = [[2, 8, 1], [9, 3, 9], [3, 9, 1], [6, 4, 4], [8, 4, 5], [4, 6, 2]]
    print(machine_loads([1, 2, 2, 1, 3, 2], p))  # [8, 18, 5]
    print(assignment_fitness([1, 2, 2, 1, 3, 2], p))  # (18, [1, 2, 2, 1, 3, 2])
    print(assignment_fitness([1, 2, 1, 2, 3, 3], p))  # (7, [1, 2, 1, 2, 3, 3])
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'assignment-fitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docLoads}} */
function machineLoads(a, p) {
  const loads = new Array(p[0].length).fill(0);
  a.forEach((machine, i) => {
    loads[machine - 1] += p[i][machine - 1]; // {{oneMachine}}
  });
  return loads;
}

/** {{docFitness}} */
function assignmentFitness(a, p) {
  const loads = machineLoads(a, p);
  return { makespan: Math.max(...loads), loads, assignment: a.slice() };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { machineLoads, assignmentFitness };
  if (require.main === module) {
    // {{example}}
    const p = [[2, 8, 1], [9, 3, 9], [3, 9, 1], [6, 4, 4], [8, 4, 5], [4, 6, 2]];
    console.log(machineLoads([1, 2, 2, 1, 3, 2], p)); // [8, 18, 5]
    console.log(assignmentFitness([1, 2, 2, 1, 3, 2], p).makespan); // 18
    console.log(assignmentFitness([1, 2, 1, 2, 3, 3], p).makespan); // 7
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Asignación de tareas a máquinas no relacionadas (R||Cmax) con un vector de enteros: evaluación.',
      ref: 'Referencias: Chu, P. C. y Beasley, J. E. (1997); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docLoads: 'Carga de cada máquina: a[i] es la máquina (de 1 a m) de la tarea i + 1 y p[i][j] el tiempo de la tarea i + 1 en la máquina j + 1.',
      oneMachine: 'cada tarea suma su tiempo en una sola máquina',
      docFitness: 'Aptitud (makespan, a minimizar) del cromosoma a: la mayor de las cargas. Todo vector de enteros entre 1 y m es factible. Devuelve el makespan y la asignación evaluada.',
      example: 'Ejemplo: seis tareas y tres máquinas; la segunda asignación es óptima',
    },
    en: {
      title: 'Assignment of tasks to unrelated machines (R||Cmax) with an integer vector: evaluation.',
      ref: 'References: Chu, P. C. & Beasley, J. E. (1997); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docLoads: 'Load of each machine: a[i] is the machine (from 1 to m) of task i + 1 and p[i][j] the time of task i + 1 on machine j + 1.',
      oneMachine: 'each task adds its time to a single machine',
      docFitness: 'Fitness (makespan, to be minimised) of chromosome a: the largest of the loads. Every vector of integers between 1 and m is feasible. Returns the makespan and the evaluated assignment.',
      example: 'Example: six tasks and three machines; the second assignment is optimal',
    },
  };

  const references = [
    C.ref('chuBeasley', {
      es: 'Algoritmo genético para el problema de asignación generalizada que codifica la solución como un vector de enteros, con el agente de cada tarea en su gen, de modo que cada tarea queda asignada exactamente una vez. Las capacidades sí pueden violarse, y las trata con una heurística de reparación.',
      en: 'Genetic algorithm for the generalised assignment problem that encodes the solution as an integer vector, with the agent of each task in its gene, so that every task is assigned exactly once. Capacities can still be violated, and are handled with a repair heuristic.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la representación de las soluciones y sus propiedades deseables (completitud, conexidad, eficiencia), y el manejo de restricciones.',
      en: 'The course’s reference textbook. Covers solution representation and its desirable properties (completeness, connexity, efficiency), and constraint handling.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso, con problemas de asignación y secuenciación. Trata la codificación de las soluciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference, with assignment and sequencing problems. Covers the encoding of solutions in chapter 8, on genetic algorithms.',
    }),
    C.ref('eiben', {
      es: 'Distingue los enteros ordinales de los nominales (categóricos) y explica qué mutaciones y cruces tienen sentido en cada caso: reinicio aleatorio frente a desplazamiento.',
      en: 'Distinguishes ordinal from nominal (categorical) integers and explains which mutations and crossovers make sense in each case: random resetting versus creep.',
    }),
    C.ref('graham1979', {
      es: 'Clasificación de los problemas de secuenciación y programación de máquinas, con la notación α‖β‖γ que da nombre a este problema: R‖Cmax.',
      en: 'Classification of machine sequencing and scheduling problems, with the α‖β‖γ notation that names this problem: R‖Cmax.',
    }),
    C.ref('lenstra1990', {
      es: 'Muestra que, salvo que P = NP, R‖Cmax no se puede aproximar con un factor menor que 3/2, y da un algoritmo de aproximación de factor 2 basado en programación lineal.',
      en: 'Shows that, unless P = NP, R‖Cmax cannot be approximated within a factor below 3/2, and gives a factor-2 approximation algorithm based on linear programming.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'assignment-int', explanation, variants, formalization, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['assignment-int'] = api;
})(typeof self !== 'undefined' ? self : this);
