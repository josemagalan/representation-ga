/*
 * Contenido docente de la asignación de tareas a máquinas con una matriz binaria.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'El problema es el mismo que en la página del vector de enteros: n tareas, m máquinas no relacionadas, el tiempo pᵢⱼ de la tarea i en la máquina j, y el objetivo de minimizar el makespan Cmax, la mayor de las cargas (R‖Cmax en la notación de Graham et al., 1979). Lo que cambia es la formalización, y con ella la codificación.',
      'La formalización clásica de programación lineal entera usa una variable binaria por pareja: yᵢⱼ = 1 si la tarea i se hace en la máquina j. La restricción de que cada tarea vaya a exactamente una máquina hay que escribirla, Σⱼ yᵢⱼ = 1 para cada tarea, y el makespan suele expresarse con una variable auxiliar C y una restricción por máquina, Σᵢ pᵢⱼ yᵢⱼ ≤ C, que es lo que permite a un resolvedor lineal tratar el máximo. Aquí se muestra directamente como el máximo de las cargas.',
      'La matriz binaria copia esas variables: n · m bits, un gen por variable. Es la codificación «binaria» del problema, y su espacio de búsqueda tiene 2ⁿᵐ cromosomas, de los que solo mⁿ son factibles. Con 6 tareas y 3 máquinas son 729 de 262 144, menos del 0,3 %; con 8 tareas y 4 máquinas, uno de cada 65 536. Un cromosoma al azar es casi siempre infactible. Es el mismo fenómeno que en la mochila, pero aquí lo produce la codificación, no el problema: el vector de enteros representa exactamente las mismas asignaciones sin ningún cromosoma infactible.',
      'Leída tal cual, una matriz infactible describe un plan imposible: una tarea sin ningún 1 no se hace, y una tarea con varios se hace varias veces. Lo primero acorta el makespan, así que, si no se corrige, el algoritmo aprende que lo mejor es no hacer las tareas. Hay que penalizar, reparar o decodificar (Michalewicz, 1996; Coello Coello, 2002).',
      'Penalización: la aptitud es el makespan de la matriz tal cual más λ · v, donde v = Σᵢ |Σⱼ yᵢⱼ − 1| mide cuánto se aparta cada tarea de tener un único 1. Si λ es pequeña, una matriz infactible puede mejorar al óptimo. Hay una cota sencilla: añadir una tarea olvidada a su máquina más rápida aumenta el makespan como mucho en mínⱼ pᵢⱼ, y quitar unos sobrantes no lo aumenta, así que con λ ≥ máxᵢ mínⱼ pᵢⱼ ninguna matriz infactible mejora al óptimo.',
      'Reparación: tarea a tarea, una fila sin unos se lleva a la máquina más rápida para esa tarea, y una fila con varios se queda con el de menor tiempo. Muchas matrices se reparan en la misma asignación: para cada tarea, valen todas las filas que contienen su máquina y ninguna más rápida, y la fila vacía si es la más rápida de todas. Es redundancia, como la del decodificador de la mochila, y además el algoritmo pasa casi todo su tiempo en matrices que no son planes.',
      'La localidad es mala: cambiar un solo bit de una matriz factible la vuelve siempre infactible, porque deja una tarea sin máquina o con dos. Mover una tarea de máquina exige cambiar dos bits de la misma fila a la vez. La mutación de bits y el cruce uniforme estándar producen casi siempre hijos infactibles; habría que diseñar operadores que trabajen fila a fila, que es lo mismo que volver al vector de enteros. La lección general: cuando una codificación puede absorber una restricción, suele compensar usarla.',
      'Coste: decodificar y evaluar una matriz lleva un tiempo O(n · m), y la reparación también.',
    ],
    en: [
      'The problem is the same as on the integer vector page: n tasks, m unrelated machines, the time pᵢⱼ of task i on machine j, and the goal of minimising the makespan Cmax, the largest of the loads (R‖Cmax in the notation of Graham et al., 1979). What changes is the formalisation, and with it the encoding.',
      'The classic integer linear programming formalisation uses one binary variable per task–machine pair: yᵢⱼ = 1 if task i is done on machine j. The constraint that each task goes to exactly one machine has to be written explicitly, Σⱼ yᵢⱼ = 1 for each task, and the makespan is usually expressed with an auxiliary variable C and one constraint per machine, Σᵢ pᵢⱼ yᵢⱼ ≤ C, which is what allows a linear solver to handle the maximum. Here it is shown directly as the maximum of the loads.',
      'The binary matrix mirrors those variables: n · m bits, one gene per variable. It is the “binary” encoding of the problem, and its search space has 2ⁿᵐ chromosomes, of which only mⁿ are feasible. With 6 tasks and 3 machines that is 729 out of 262,144, less than 0.3%; with 8 tasks and 4 machines, one in 65,536. A random chromosome is almost always infeasible. It is the same phenomenon as in the knapsack, but here it is caused by the encoding, not by the problem: the integer vector represents exactly the same assignments without a single infeasible chromosome.',
      'Read as is, an infeasible matrix describes an impossible plan: a task without any 1 is not done, and a task with several is done several times. The former shortens the makespan, so, if this is not corrected, the algorithm learns that the best strategy is to leave tasks undone. The matrix must therefore be penalised, repaired or decoded (Michalewicz, 1996; Coello Coello, 2002).',
      'Penalty: the fitness is the makespan of the matrix read as is plus λ · v, where v = Σᵢ |Σⱼ yᵢⱼ − 1| measures how far each task is from having a single 1. If λ is small, an infeasible matrix can beat the optimum. There is a simple bound: adding a forgotten task to its fastest machine increases the makespan by at most minⱼ pᵢⱼ, and removing surplus ones does not increase it, so with λ ≥ maxᵢ minⱼ pᵢⱼ no infeasible matrix beats the optimum.',
      'Repair: task by task, a row with no ones has its task sent to the fastest machine for that task, and a row with several keeps only the one with the shortest time. Many matrices are repaired into the same assignment: for each task, any row that contains its machine and no faster one will do, and so will the empty row if it is the fastest of all. This is redundancy, like that of the knapsack decoder, and, on top of that, the algorithm spends almost all its time on matrices that are not plans.',
      'Locality is poor: changing a single bit of a feasible matrix always makes it infeasible, because it leaves a task with no machine or with two. Moving a task to another machine requires changing two bits of the same row at once. Standard bit-flip mutation and uniform crossover almost always produce infeasible children; one would have to design operators that work row by row, which amounts to returning to the integer vector. The general lesson: when an encoding can absorb a constraint, it usually pays to use it.',
      'Cost: decoding and evaluating a matrix takes O(n · m) time, and so does repair.',
    ],
  };

  const variants = {
    repair: {
      name: { es: 'Reparación', en: 'Repair' },
      desc: {
        es: 'Cada tarea sin unos va a su máquina más rápida; cada tarea con varios se queda en la más rápida de ellas.',
        en: 'Each task with no ones goes to its fastest machine; each task with several stays on the fastest of them.',
      },
    },
    penalty: {
      name: { es: 'Penalización', en: 'Penalty' },
      desc: {
        es: 'La matriz no cambia; su aptitud es el makespan leído tal cual más λ · v, donde v mide cuánto se incumple la restricción.',
        en: 'The matrix does not change; its fitness is the makespan read as is plus λ · v, where v measures how much the constraint is violated.',
      },
    },
  };

  const sub = (a, b) => `<msub><mi>${a}</mi>${b}</msub>`;
  const ij = '<mrow><mi>i</mi><mi>j</mi></mrow>';
  const sumI = '<munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover>';
  const sumJ = '<munderover><mo>∑</mo><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mi>m</mi></munderover>';
  const formalization = {
    rows: [
      { id: 'vars', label: { es: 'Variables', en: 'Variables' },
        math: `<math>${sub('y', ij)}<mo>∈</mo><mo>{</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>}</mo><mo>,</mo><mspace width="0.6em"></mspace><mi>i</mi><mo>=</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>n</mi><mo>;</mo><mspace width="0.4em"></mspace><mi>j</mi><mo>=</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>m</mi></math>` },
      { id: 'obj', label: { es: 'Objetivo', en: 'Objective' },
        math: `<math><mo>min</mo><mspace width="0.3em"></mspace>${sub('C', '<mi>max</mi>')}<mo>=</mo><munder><mo>max</mo><mi>j</mi></munder>${sumI}${sub('p', ij)}<mo>⁢</mo>${sub('y', ij)}</math>` },
      { id: 'cons', label: { es: 'Restricción', en: 'Constraint' },
        math: `<math>${sumJ}${sub('y', ij)}<mo>=</mo><mn>1</mn><mo>,</mo><mspace width="0.6em"></mspace><mi>i</mi><mo>=</mo><mn>1</mn><mo>,</mo><mo>…</mo><mo>,</mo><mi>n</mi></math>` },
      { id: 'space', label: { es: 'Espacio de búsqueda', en: 'Search space' },
        math: '<math><mi>y</mi><mo>∈</mo><msup><mrow><mo>{</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>}</mo></mrow><mrow><mi>n</mi><mo>×</mo><mi>m</mi></mrow></msup><mo>,</mo><mspace width="0.6em"></mspace><msup><mn>2</mn><mrow><mi>n</mi><mi>m</mi></mrow></msup><mtext> cromosomas, </mtext><msup><mi>m</mi><mi>n</mi></msup><mtext> factibles</mtext></math>',
        mathEn: '<math><mi>y</mi><mo>∈</mo><msup><mrow><mo>{</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>}</mo></mrow><mrow><mi>n</mi><mo>×</mo><mi>m</mi></mrow></msup><mo>,</mo><mspace width="0.6em"></mspace><msup><mn>2</mn><mrow><mi>n</mi><mi>m</mi></mrow></msup><mtext> chromosomes, </mtext><msup><mi>m</mi><mi>n</mi></msup><mtext> feasible</mtext></math>' },
    ],
  };

  const narration = {
    es: {
      problem: 'Hay {n} tareas y {m} máquinas distintas que trabajan a la vez. La tabla da el tiempo que tarda cada máquina en cada tarea: una misma tarea puede ser rápida en una máquina y lenta en otra. Cada tarea se hace en una sola máquina, y queremos que todo termine lo antes posible.',
      formVars: 'Primero, qué se decide. Hay una variable binaria por cada pareja tarea–máquina: yᵢⱼ vale 1 si la tarea i se hace en la máquina j y 0 si no. Son {n} × {m} = {nm} variables.',
      formObj: 'Segundo, qué se quiere: minimizar el makespan. La carga de la máquina j es Σᵢ pᵢⱼ yᵢⱼ, la suma de los tiempos de las tareas que tiene, y el makespan, Cmax, es la mayor de las cargas.',
      formCons: 'Tercero, qué no se puede: cada tarea tiene que ir a exactamente una máquina. Con estas variables hay que escribirlo: Σⱼ yᵢⱼ = 1, una restricción para cada una de las {n} tareas.',
      formSpace: 'Todas las matrices de ceros y unos forman el espacio de búsqueda: {pow} = {total}. Solo {mn} = {feasible} cumplen la restricción (el {share} %): las que tienen un único 1 por tarea. El mejor makespan posible, la línea discontinua, es {opt}.',
      encode: 'Codificación: un gen por variable, {nm} bits. El cromosoma es {chrom}, en grupos de una tarea con un bit por máquina; en el dibujo, cada grupo es la columna de su tarea. Haz clic en un bit para cambiarlo.',
      decodeIntro: 'Decodificar es pasar del cromosoma al plan de trabajo. Leemos la matriz tal cual, tarea a tarea: cada 1 pone la tarea en la cola de su máquina.',
      decodeOne: 'Tarea {i}: un solo 1, en la máquina {j}, que tarda {p}. La máquina {j} tiene ahora una carga de {load}.',
      decodeNone: 'Tarea {i}: ningún 1. Leída tal cual, la tarea {i} no se hace en ninguna máquina.',
      decodeMany: 'Tarea {i}: {k} unos, en las máquinas {list}. Leída tal cual, la tarea {i} se hace {k} veces, una en cada una de esas máquinas.',
      decodeDone: 'Cargas de las máquinas: {loads}. El makespan es {cmax}; el óptimo, la línea discontinua, es {opt}: este plan tarda un {gap} % más.',
      decodeDoneOpt: 'Cargas de las máquinas: {loads}. El makespan es {cmax}, y es el óptimo: ningún plan termina antes.',
      decodeDoneBad: 'Cargas leídas tal cual: {loads}, con un makespan de {cmax}, frente a un óptimo de {opt}. Pero esta matriz no es un plan que se pueda llevar a cabo, así que esa cifra no significa nada todavía.',
      feasible: 'Validez: cada tarea tiene exactamente un 1, así que la matriz es factible y su aptitud es su makespan, {cmax}. Es la misma asignación que el vector de enteros {vec}.',
      locality: 'Pero fíjate en la localidad: cambiar cualquiera de los {nm} bits de esta matriz la vuelve infactible, porque deja una tarea sin máquina o con dos. Para mover una tarea de máquina hay que cambiar dos bits a la vez, y la mutación de bits y el cruce uniforme darán casi siempre hijos infactibles.',
      infeasibleBoth: 'Validez: la matriz es infactible. Tareas sin máquina: {none}. Tareas en varias máquinas: {many}. Incumple la restricción en v = {v}, la suma de lo que se aparta cada tarea de tener un único 1.',
      infeasibleNone: 'Validez: la matriz es infactible. Tareas sin máquina: {none}. Incumple la restricción en v = {v}, una por cada tarea sin hacer.',
      infeasibleMany: 'Validez: la matriz es infactible. Tareas en varias máquinas: {many}. Incumple la restricción en v = {v}, el número de unos que sobran.',
      penalty: 'Penalización: la aptitud es el makespan de la matriz leída tal cual más λ · v = {cmax} + {lambda} · {v} = {fitness}. La matriz no cambia.',
      penaltyBeats: 'Cuidado: esta matriz infactible tiene aptitud {fitness}, menos que el óptimo, {opt}. El algoritmo la preferiría a cualquier plan válido, porque dejar tareas sin hacer acorta el makespan. Con λ ≥ {bound}, el mayor de los tiempos mínimos de cada tarea, eso ya no puede pasar.',
      penaltyBelow: 'Su aptitud, {fitness}, no mejora el óptimo, {opt}. Con λ ≥ {bound}, el mayor de los tiempos mínimos de cada tarea, ninguna matriz infactible lo mejora; baja λ para ver qué pasa por debajo.',
      repairIntro: 'Reparación: recorremos las tareas y dejamos un único 1 en cada una. Si no tiene ninguno, va a la máquina más rápida para ella; si tiene varios, se queda en la más rápida de esas.',
      repairNone: 'Tarea {i}: sin máquina. La más rápida para ella es la {j}, que tarda {p}: su bit pasa a 1.',
      repairMany: 'Tarea {i}: está en las máquinas {list}. Se queda en la más rápida de ellas, la {j}, que tarda {p}; los demás unos pasan a 0.',
      repairDone: 'Matriz reparada: {chrom}, la asignación {vec}. Es factible y su makespan, {cmax}, es su aptitud; el óptimo es {opt}. Se han reparado {k} tareas.',
      repairRedundancy: 'El precio es la redundancia: {count} de las {total} matrices se reparan en esta misma asignación, y el algoritmo no las distingue. Casi todo lo que explora son matrices que no son planes.',
    },
    en: {
      problem: 'There are {n} tasks and {m} different machines working at the same time. The table gives the time each machine takes on each task: the same task may be quick on one machine and slow on another. Each task is done on a single machine, and we want everything to finish as early as possible.',
      formVars: 'First, what is decided. There is one binary variable for each task–machine pair: yᵢⱼ is 1 if task i is done on machine j and 0 otherwise. There are {n} × {m} = {nm} variables.',
      formObj: 'Second, what we want: to minimise the makespan. The load of machine j is Σᵢ pᵢⱼ yᵢⱼ, the sum of the processing times of its tasks, and the makespan, Cmax, is the largest of the loads.',
      formCons: 'Third, what is not allowed: each task must go to exactly one machine. With these variables it has to be written explicitly: Σⱼ yᵢⱼ = 1, one constraint for each of the {n} tasks.',
      formSpace: 'All the matrices of zeros and ones together make up the search space: {pow} = {total}. Only {mn} = {feasible} satisfy the constraint ({share}%): those with a single 1 per task. The best possible makespan, the dashed line, is {opt}.',
      encode: 'Encoding: one gene per variable, {nm} bits. The chromosome is {chrom}, in groups, one per task, with one bit per machine; in the diagram, each group is its task’s column. Click a bit to change it.',
      decodeIntro: 'Decoding means going from the chromosome to the work plan. We read the matrix as it is, task by task: each 1 adds the task to the queue of that machine.',
      decodeOne: 'Task {i}: a single 1, on machine {j}, which takes {p}. Machine {j} now has a load of {load}.',
      decodeNone: 'Task {i}: no 1 at all. Read as is, task {i} is not done on any machine.',
      decodeMany: 'Task {i}: {k} ones, on machines {list}. Read as is, task {i} is done {k} times, once on each of those machines.',
      decodeDone: 'Machine loads: {loads}. The makespan is {cmax}; the optimum, the dashed line, is {opt}: this plan takes {gap}% longer.',
      decodeDoneOpt: 'Machine loads: {loads}. The makespan is {cmax}, and it is the optimum: no plan finishes earlier.',
      decodeDoneBad: 'Loads with the matrix read as is: {loads}, a makespan of {cmax}, compared with an optimum of {opt}. But this matrix is not a plan that can be carried out, so that figure means nothing yet.',
      feasible: 'Validity: each task has exactly one 1, so the matrix is feasible and its fitness is its makespan, {cmax}. It is the same assignment as the integer vector {vec}.',
      locality: 'But look at locality: changing any of the {nm} bits of this matrix makes it infeasible, because it leaves a task with no machine or with two. Moving a task to another machine requires changing two bits at once, and bit-flip mutation and uniform crossover will almost always produce infeasible children.',
      infeasibleBoth: 'Validity: the matrix is infeasible. Tasks with no machine: {none}. Tasks on several machines: {many}. It violates the constraint by v = {v}, the sum of how far each task is from having a single 1.',
      infeasibleNone: 'Validity: the matrix is infeasible. Tasks with no machine: {none}. It violates the constraint by v = {v}, one for each task left undone.',
      infeasibleMany: 'Validity: the matrix is infeasible. Tasks on several machines: {many}. It violates the constraint by v = {v}, the number of surplus ones.',
      penalty: 'Penalty: the fitness is the makespan of the matrix read as is plus λ · v = {cmax} + {lambda} · {v} = {fitness}. The matrix does not change.',
      penaltyBeats: 'Careful: this infeasible matrix has a fitness of {fitness}, lower than the optimum, {opt}. The algorithm would prefer it to any valid plan, because leaving tasks undone shortens the makespan. With λ ≥ {bound}, the largest of the tasks’ minimum processing times, this can no longer happen.',
      penaltyBelow: 'Its fitness, {fitness}, does not beat the optimum, {opt}. With λ ≥ {bound}, the largest of the tasks’ minimum processing times, no infeasible matrix beats it; lower λ below that value to see what happens.',
      repairIntro: 'Repair: we go through the tasks and leave a single 1 in each. If a task has none, it goes to its fastest machine; if it has several, it stays on the fastest of those.',
      repairNone: 'Task {i}: no machine. Its fastest machine is machine {j}, which takes {p}: its bit becomes 1.',
      repairMany: 'Task {i}: it is on machines {list}. It stays on the fastest of them, machine {j}, which takes {p}; the other ones become 0.',
      repairDone: 'Repaired matrix: {chrom}, the assignment {vec}. It is feasible and its makespan, {cmax}, is its fitness; the optimum is {opt}. {k} tasks have been repaired.',
      repairRedundancy: 'The price is redundancy: {count} of the {total} matrices are repaired into this same assignment, and the algorithm cannot tell them apart. Almost everything it explores consists of matrices that are not plans.',
    },
  };

  const P = {
    es: {
      sig: (vr) => (vr === 'penalty' ? 'EVALUAR_MATRIZ(y, p, λ)' : 'EVALUAR_MATRIZ(y, p)'),
      checkRepair: 'si alguna tarea no tiene exactamente un 1: y ← REPARAR(y, p)',
      checkPenalty: 'v ← Σᵢ |Σⱼ y[i, j] − 1|        // 0 si y es factible',
      init: 'para j = 1, …, m: carga[j] ← 0',
      forI: 'para i = 1, …, n, para j = 1, …, m:',
      add: 'si y[i, j] = 1: carga[j] ← carga[j] + p[i, j]',
      max: 'Cmax ← máx { carga[1], …, carga[m] }',
      pen: 'devolver Cmax + λ · v',
      ret: 'devolver Cmax',
      rsig: 'REPARAR(y, p)',
      rfor: 'para i = 1, …, n:',
      rones: 'J ← { j : y[i, j] = 1 }',
      rif: 'si |J| ≠ 1:',
      rpick: 'j* ← la máquina de J (de todas, si J = ∅) con menor p[i, j]; a igualdad, la de menor índice',
      rset: 'y[i, ·] ← 0;  y[i, j*] ← 1',
      rret: 'devolver y',
    },
    en: {
      sig: (vr) => (vr === 'penalty' ? 'EVALUATE_MATRIX(y, p, λ)' : 'EVALUATE_MATRIX(y, p)'),
      checkRepair: 'if some task does not have exactly one 1: y ← REPAIR(y, p)',
      checkPenalty: 'v ← Σᵢ |Σⱼ y[i, j] − 1|        // 0 if y is feasible',
      init: 'for j = 1, …, m: load[j] ← 0',
      forI: 'for i = 1, …, n, for j = 1, …, m:',
      add: 'if y[i, j] = 1: load[j] ← load[j] + p[i, j]',
      max: 'Cmax ← max { load[1], …, load[m] }',
      pen: 'return Cmax + λ · v',
      ret: 'return Cmax',
      rsig: 'REPAIR(y, p)',
      rfor: 'for i = 1, …, n:',
      rones: 'J ← { j : y[i, j] = 1 }',
      rif: 'if |J| ≠ 1:',
      rpick: 'j* ← the machine in J (among all machines, if J = ∅) with the smallest p[i, j]; ties go to the lowest index',
      rset: 'y[i, ·] ← 0;  y[i, j*] ← 1',
      rret: 'return y',
    },
  };

  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const vr = variant || 'repair';
    const pen = vr === 'penalty';
    const main = [
      { id: 'sig', indent: 0, text: T.sig(vr) },
      { id: 'check', indent: 1, text: pen ? T.checkPenalty : T.checkRepair },
      { id: 'init', indent: 1, text: T.init },
      { id: 'forI', indent: 1, text: T.forI },
      { id: 'add', indent: 2, text: T.add },
      { id: 'max', indent: 1, text: T.max },
      pen ? { id: 'pen', indent: 1, text: T.pen } : { id: 'ret', indent: 1, text: T.ret },
    ];
    if (pen) return main;
    return main.concat([
      { id: 'blank', indent: 0, text: '' },
      { id: 'rsig', indent: 0, text: T.rsig },
      { id: 'rfor', indent: 1, text: T.rfor },
      { id: 'rones', indent: 2, text: T.rones },
      { id: 'rif', indent: 2, text: T.rif },
      { id: 'rpick', indent: 3, text: T.rpick },
      { id: 'rset', indent: 3, text: T.rset },
      { id: 'rret', indent: 1, text: T.rret },
    ]);
  }

  const keywords = { es: ['para', 'si', 'devolver', 'no tiene'], en: ['for', 'if', 'return', 'does not have'] };
  const stepLines = {
    problem: ['sig'], formVars: ['sig'], formObj: ['sig'], formCons: ['sig'], formSpace: ['sig'], encode: ['sig'],
    decodeIntro: ['init'],
    decodeOne: ['forI', 'add'],
    decodeNone: ['forI'],
    decodeMany: ['forI', 'add'],
    decodeDone: ['max'],
    feasible: ['check', 'max'],
    locality: ['sig'],
    infeasible: ['check'],
    penalty: ['pen'],
    penaltyCompare: ['pen'],
    repairIntro: ['check', 'rsig'],
    repairFix: ['rfor', 'rones', 'rif', 'rpick', 'rset'],
    repairDone: ['rret'],
    repairRedundancy: ['rret'],
  };
  const fnName = { python: 'matrix_fitness', javascript: 'matrixFitness' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'matrix_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""


def machine_loads(y, p):
    """{{docLoads}}"""
    loads = [0] * len(p[0])
    for i, row in enumerate(y):
        for j, bit in enumerate(row):
            if bit:
                loads[j] += p[i][j]  # {{asIs}}
    return loads


def violations(y):
    """{{docViolations}}"""
    return sum(abs(sum(row) - 1) for row in y)


def repair(y, p):
    """{{docRepair}}"""
    fixed = []
    for i, row in enumerate(y):
        ones = [j for j, bit in enumerate(row) if bit]
        if len(ones) == 1:
            fixed.append(list(row))
            continue
        candidates = ones or list(range(len(row)))
        best = min(candidates, key=lambda j: (p[i][j], j))  # {{tie}}
        fixed.append([1 if j == best else 0 for j in range(len(row))])
    return fixed


def matrix_fitness(y, p, method="repair", lam=1.0):
    """{{docFitness}}"""
    if method == "penalty":
        return max(machine_loads(y, p)) + lam * violations(y), [list(row) for row in y]
    fixed = repair(y, p)
    return max(machine_loads(fixed, p)), fixed


if __name__ == "__main__":
    # {{example}}
    p = [[2, 8, 1], [9, 3, 9], [3, 9, 1], [6, 4, 4], [8, 4, 5], [4, 6, 2]]
    y = [[0, 1, 0], [0, 1, 1], [0, 0, 0], [1, 0, 0], [1, 0, 0], [1, 1, 0]]
    print(matrix_fitness(y, p, "repair"))  # (18, [[0, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0], [1, 0, 0], [1, 0, 0]])
    print(matrix_fitness(y, p, "penalty", 1.0))  # (21.0, ...): Cmax 18 + 1 * 3
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'matrix-fitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docLoads}} */
function machineLoads(y, p) {
  const loads = new Array(p[0].length).fill(0);
  y.forEach((row, i) => row.forEach((bit, j) => {
    if (bit) loads[j] += p[i][j]; // {{asIs}}
  }));
  return loads;
}

/** {{docViolations}} */
function violations(y) {
  return y.reduce((s, row) => s + Math.abs(row.reduce((a, b) => a + b, 0) - 1), 0);
}

/** {{docRepair}} */
function repair(y, p) {
  return y.map((row, i) => {
    const ones = row.map((bit, j) => (bit ? j : -1)).filter((j) => j >= 0);
    if (ones.length === 1) return row.slice();
    const candidates = ones.length ? ones : row.map((_, j) => j);
    const best = candidates.reduce((b, j) => (p[i][j] < p[i][b] ? j : b)); // {{tie}}
    return row.map((_, j) => (j === best ? 1 : 0));
  });
}

/** {{docFitness}} */
function matrixFitness(y, p, method = 'repair', lam = 1) {
  if (method === 'penalty') {
    return { fitness: Math.max(...machineLoads(y, p)) + lam * violations(y), matrix: y.map((row) => row.slice()) };
  }
  const fixed = repair(y, p);
  return { fitness: Math.max(...machineLoads(fixed, p)), matrix: fixed };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { machineLoads, violations, repair, matrixFitness };
  if (require.main === module) {
    // {{example}}
    const p = [[2, 8, 1], [9, 3, 9], [3, 9, 1], [6, 4, 4], [8, 4, 5], [4, 6, 2]];
    const y = [[0, 1, 0], [0, 1, 1], [0, 0, 0], [1, 0, 0], [1, 0, 0], [1, 1, 0]];
    console.log(matrixFitness(y, p, 'repair').fitness); // 18
    console.log(matrixFitness(y, p, 'penalty', 1).fitness); // 21: Cmax 18 + 1 * 3
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Asignación de tareas a máquinas no relacionadas (R||Cmax) con una matriz binaria: evaluación con reparación o con penalización.',
      ref: 'Referencias: Chu, P. C. y Beasley, J. E. (1997); Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docLoads: 'Carga de cada máquina leyendo la matriz tal cual: y[i][j] = 1 si la tarea i + 1 se hace en la máquina j + 1; p[i][j] es su tiempo.',
      asIs: 'una tarea sin unos no suma nada; una con varios suma en cada máquina',
      docViolations: 'Cuánto se incumple la restricción: suma, para cada tarea, de lo que se aparta de tener un único 1.',
      docRepair: 'Deja un único 1 por tarea: sin unos, en su máquina más rápida; con varios, en la más rápida de ellas.',
      tie: 'a igualdad de tiempo, la máquina de menor índice',
      docFitness: 'Aptitud (a minimizar) de la matriz y. method = "repair": makespan de la matriz reparada. method = "penalty": makespan leído tal cual + lam · violaciones. Devuelve la aptitud y la matriz evaluada.',
      example: 'Ejemplo: seis tareas, tres máquinas y una matriz con tareas sin máquina y en varias',
    },
    en: {
      title: 'Task-to-machine assignment with unrelated machines (R||Cmax) encoded as a binary matrix: evaluation with repair or with a penalty.',
      ref: 'References: Chu, P. C. & Beasley, J. E. (1997); Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docLoads: 'Load of each machine, with the matrix read as is: y[i][j] = 1 if task i + 1 is done on machine j + 1; p[i][j] is its processing time.',
      asIs: 'a task with no ones adds nothing; one with several adds its time to each of those machines',
      docViolations: 'How much the constraint is violated: the sum, over the tasks, of how far each is from having a single 1.',
      docRepair: 'Leaves a single 1 per task: a task with no ones goes to its fastest machine; one with several stays on the fastest of them.',
      tie: 'ties are broken in favour of the lowest machine index',
      docFitness: 'Fitness (to be minimised) of matrix y. method = "repair": makespan of the repaired matrix. method = "penalty": makespan read as is + lam · violations. Returns the fitness and the evaluated matrix.',
      example: 'Example: six tasks, three machines and a matrix with some tasks on no machine and some on several',
    },
  };

  const references = [
    C.ref('chuBeasley', {
      es: 'Algoritmo genético para el problema de asignación generalizada. Prefiere un vector de enteros, en el que cada tarea queda asignada exactamente una vez, a una representación binaria tarea–agente que tendría que comprobar esa restricción; las capacidades las trata con reparación.',
      en: 'Genetic algorithm for the generalised assignment problem. It prefers an integer vector, in which every task is assigned exactly once, to a binary task–agent representation that would have to check that constraint; capacities are handled with repair.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la representación de las soluciones, sus propiedades deseables y las estrategias para manejar restricciones: rechazo, penalización, reparación y decodificadores.',
      en: 'The course’s reference textbook. Covers solution representation, its desirable properties and the strategies for handling constraints: rejection, penalty, repair and decoders.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso, con problemas de asignación y secuenciación. Trata la codificación de las soluciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference, with assignment and sequencing problems. Covers the encoding of solutions in chapter 8, on genetic algorithms.',
    }),
    C.ref('michalewicz', {
      es: 'Usa representaciones matriciales con restricciones, como en el problema de transporte, y compara penalizar, reparar y decodificar.',
      en: 'Uses constrained matrix representations, as in the transportation problem, and compares penalising, repairing and decoding.',
    }),
    C.ref('coello', {
      es: 'Revisión de las técnicas de manejo de restricciones en algoritmos evolutivos, con especial atención a las funciones de penalización.',
      en: 'Survey of constraint-handling techniques in evolutionary algorithms, with special attention to penalty functions.',
    }),
    C.ref('graham1979', {
      es: 'Clasificación de los problemas de secuenciación y programación de máquinas, con la notación α‖β‖γ que da nombre a este problema: R‖Cmax.',
      en: 'Classification of machine sequencing and scheduling problems, with the α‖β‖γ notation that names this problem: R‖Cmax.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'assignment-matrix', explanation, variants, formalization, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['assignment-matrix'] = api;
})(typeof self !== 'undefined' ? self : this);
