/*
 * Contenido docente de la optimización de una función continua con un vector de reales.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Optimizar una función continua es buscar el punto más bajo (o más alto) de una superficie: las variables son números reales y cada una puede tomar infinitos valores dentro de unos límites. La herramienta usa dos funciones de prueba clásicas de dos variables, para poder dibujarlas como un mapa. La de Himmelblau (1972) es suave y tiene cuatro mínimos globales, todos con valor 0. La de Rastrigin, en la versión de n variables de Mühlenbein, Schomisch y Born (1991), es una parábola cubierta de ondulaciones, con una rejilla de mínimos locales y un único mínimo global en el origen: es la pesadilla de una búsqueda local.',
      'La formalización es directa: dos variables reales, una función objetivo que minimizar y una restricción de caja, a ≤ xᵢ ≤ b, que delimita la región en la que tiene sentido buscar. El espacio de búsqueda es un continuo, con infinitos puntos; en el ordenador, los números en coma flotante de doble precisión, con unas quince cifras significativas.',
      'La codificación real copia las variables: el cromosoma es el propio punto, un gen real por variable, y genotipo y fenotipo coinciden. Los primeros algoritmos genéticos codificaban todo en binario (Holland, 1975; Goldberg, 1989), pero para problemas continuos la representación real se impuso pronto: Janikow y Michalewicz (1991) la compararon con la binaria y obtuvieron resultados más precisos y más rápidos, y las estrategias evolutivas trabajaban con reales desde el principio (Rechenberg, 1973). Herrera, Lozano y Verdegay (1998) revisan sus operadores.',
      'Cumple las propiedades que Talbi (2009) pide a una representación: es completa (cualquier punto de la caja se puede escribir, con la precisión de la máquina), conexa y eficiente, y su localidad es la mejor posible: cambiar un poco un gen mueve el punto un poco, en la dirección de esa variable. Por eso aquí tienen sentido la mutación gaussiana, que suma un ruido pequeño a un gen, y los cruces que combinan los valores de los padres, como el aritmético o el BLX-α: el gen es una cantidad ordinal, no una etiqueta como el número de máquina de la asignación. En la herramienta los genes se redondean a centésimas solo para que la narración muestre exactamente los números que se usan.',
      'La contrapartida es que nada impide que un gen se salga de la caja: una mutación gaussiana o un cruce que extrapola más allá de los padres pueden dejar xᵢ por debajo de a o por encima de b. Hay tres tratamientos habituales. Acotar (proyectar) lleva cada gen que se sale al límite más cercano; es lo más sencillo, pero todos los puntos que se salen por el mismo lado acaban en el mismo punto del borde, y la población se acumula allí: ayuda si el óptimo está en el borde y estorba si no. Reflejar hace rebotar el gen en el límite, tanto como se había pasado, y no amontona puntos en el borde. Penalizar no cambia el punto: lo evalúa tal cual y le suma λ · d, con d la distancia a la caja.',
      'Penalizar exige poder calcular f fuera de la caja. En estas funciones de prueba se puede, pero en un problema real a menudo no: una longitud negativa o una dosis imposible no tienen un valor que evaluar. La alternativa es diseñar los operadores para que no se salgan nunca, por ejemplo una mutación acotada, que es la idea del decodificador de la mochila: elegir operadores que solo produzcan soluciones válidas. Tanto al acotar como al reflejar se puede escribir el punto corregido en el cromosoma (aprendizaje lamarckiano) o usarlo solo para evaluar (efecto Baldwin); la herramienta hace lo segundo, como Orvosh y Davis (1993) en su estudio sobre cuándo reparar.',
      'Coste: decodificar un vector de reales no cuesta nada, porque el cromosoma ya es la solución, y comprobar la caja es O(n). Lo caro es evaluar f, que en problemas reales puede ser una simulación de minutos u horas.',
    ],
    en: [
      'Optimising a continuous function means looking for the lowest (or highest) point of a surface: the variables are real numbers and each can take infinitely many values within certain bounds. The tool uses two classic test functions of two variables, so that they can be drawn as a map. The Himmelblau function (Himmelblau, 1972) is smooth and has four global minima, all with value 0. The Rastrigin function, in the n-variable version by Mühlenbein, Schomisch and Born (1991), is a paraboloid covered in ripples, with a grid of local minima and a single global minimum at the origin: a nightmare for local search.',
      'The formalisation is straightforward: two real variables, an objective function to minimise and a box constraint, a ≤ xᵢ ≤ b, which bounds the region where it makes sense to search. The search space is a continuum, with infinitely many points; on a computer, it is the set of double-precision floating-point numbers, with about fifteen significant digits.',
      'The real encoding copies the variables: the chromosome is the point itself, one real gene per variable, and genotype and phenotype coincide. The first genetic algorithms encoded everything in binary (Holland, 1975; Goldberg, 1989), but for continuous problems the real representation soon took over: Janikow and Michalewicz (1991) compared it with binary encoding and obtained faster, more precise results, and evolution strategies had worked with real numbers from the start (Rechenberg, 1973). Herrera, Lozano and Verdegay (1998) review its operators.',
      'It has the properties that Talbi (2009) requires of a representation: it is complete (any point in the box can be represented, to machine precision), connected and efficient, and its locality is as good as it gets: changing a gene a little moves the point a little, in the direction of that variable. That is why Gaussian mutation, which adds a small amount of noise to a gene, and crossovers that combine the parents’ values, such as arithmetic or BLX-α crossover, make sense here: the gene is an ordinal quantity, not a label like the machine number in the assignment problem. In the tool, genes are rounded to hundredths only so that the narration shows exactly the numbers being used.',
      'The downside is that nothing prevents a gene from leaving the box: a Gaussian mutation or a crossover that extrapolates beyond the parents can leave xᵢ below a or above b. There are three common ways of dealing with this. Clamping (projection) moves each gene that leaves the box to the nearest bound; it is the simplest, but all points that leave on the same side end up at the same point on the boundary, and the population piles up there: this helps if the optimum lies on the boundary and hinders if it does not. Reflecting bounces the gene off the bound by the same amount it overshot, and does not pile points up on the boundary. Penalising does not change the point: it evaluates it as it is and adds λ · d, where d is the distance to the box.',
      'Penalising requires being able to compute f outside the box. This is possible with these test functions, but often not in a real problem: a negative length or an impossible dose has no value to evaluate. The alternative is to design the operators so that they never leave the box, for example with a bounded mutation; this is the same idea as the knapsack decoder: choosing operators that only produce valid solutions. With both clamping and reflecting, the corrected point can be written back into the chromosome (Lamarckian learning) or used only for evaluation (Baldwin effect); the tool does the latter, as did Orvosh and Davis (1993) in their study of when to repair.',
      'Cost: decoding a real vector costs nothing, because the chromosome is already the solution, and checking the box is O(n). The expensive part is evaluating f, which in real problems may be a simulation lasting minutes or hours.',
    ],
  };

  const variants = {
    clamp: {
      name: { es: 'Acotar', en: 'Clamp' },
      desc: { es: 'Cada gen que se sale de [a, b] se lleva al límite más cercano.', en: 'Each gene that leaves [a, b] is moved to the nearest bound.' },
    },
    reflect: {
      name: { es: 'Reflejar', en: 'Reflect' },
      desc: { es: 'Cada gen que se sale rebota en el límite que ha cruzado, tanto como se había pasado (otra vez, si hace falta).', en: 'Each gene that leaves the box bounces off the bound it crossed, by the same amount it overshot (repeatedly, if needed).' },
    },
    penalty: {
      name: { es: 'Penalizar', en: 'Penalise' },
      desc: { es: 'El punto se evalúa tal cual y se le suma λ · d, con d = Σᵢ máx(0, a − xᵢ, xᵢ − b), la distancia a la caja.', en: 'The point is evaluated as it is and λ · d is added, where d = Σᵢ max(0, a − xᵢ, xᵢ − b) is the distance to the box.' },
    },
  };

  const formalization = {
    rows: [
      C.fnRows.vars, C.fnRows.obj, C.fnRows.cons,
      { id: 'space', label: { es: 'Espacio de búsqueda', en: 'Search space' },
        math: (lang) => `<math><mi>x</mi><mo>∈</mo><msup><mrow><mo>[</mo><mi>a</mi><mo>,</mo><mi>b</mi><mo>]</mo></mrow><mn>2</mn></msup><mo>⊂</mo><msup><mi mathvariant="normal">ℝ</mi><mn>2</mn></msup><mo>,</mo><mspace width="0.6em"></mspace><mtext>${lang === 'en' ? 'a continuum' : 'un continuo'}</mtext></math>` },
    ],
  };

  const narration = {
    es: {
      problemHimmelblau: 'Buscamos el punto más bajo de una superficie: la función de Himmelblau en el cuadrado [{a}, {b}]². En el mapa, cuanto más intenso es el azul, más bajo. Tiene cuatro valles igual de profundos, y no hay una fórmula que dé el mínimo directamente: hay que buscarlo.',
      problemRastrigin: 'Buscamos el punto más bajo de una superficie: la función de Rastrigin en el cuadrado [{a}, {b}]². En el mapa, cuanto más intenso es el azul, más bajo. Es un cuenco cubierto de ondulaciones: una rejilla de mínimos locales y un solo mínimo global, en el centro.',
      formVars: 'Primero, qué se decide: dos números reales, x₁ y x₂, las coordenadas del punto. A diferencia de la mochila o de la asignación, cada variable puede tomar infinitos valores.',
      formObjHimmelblau: 'Segundo, qué se quiere: minimizar f(x₁, x₂) = (x₁² + x₂ − 11)² + (x₁ + x₂² − 7)². Como es una suma de cuadrados, nunca baja de 0, y vale 0 justo donde los dos paréntesis se anulan a la vez.',
      formObjRastrigin: 'Segundo, qué se quiere: minimizar f(x₁, x₂) = 20 + Σᵢ (xᵢ² − 10 cos 2πxᵢ). El término xᵢ² da la forma de cuenco, y el coseno añade un mínimo local cerca de cada punto de coordenadas enteras.',
      formCons: 'Tercero, qué no se puede: salirse de la caja. Cada variable tiene que quedar entre a = {a} y b = {b}; es la única restricción.',
      formSpaceHimmelblau: 'El espacio de búsqueda es el cuadrado [{a}, {b}]², un continuo con infinitos puntos. El mínimo vale 0 y se alcanza en cuatro puntos, las estrellas: (3; 2) y otros tres sin una expresión sencilla.',
      formSpaceRastrigin: 'El espacio de búsqueda es el cuadrado [{a}, {b}]², un continuo con infinitos puntos. El mínimo vale 0 y está en el origen, la estrella; alrededor hay decenas de mínimos locales en los que una búsqueda local se quedaría atrapada.',
      encode: 'Codificación: el cromosoma es el propio punto, ({x1}; {x2}), un gen real por variable. Genotipo y fenotipo coinciden. Arrastra el punto por el mapa para cambiar los genes.',
      decodeIntro: 'Decodificar aquí es casi inmediato, porque cada gen es directamente el valor de su variable. Aun así, veámoslo gen a gen.',
      decodeGene1: 'Gen 1 = {x}: es x₁, la coordenada horizontal (la recta vertical del mapa).',
      decodeGene2: 'Gen 2 = {x}: es x₂, la coordenada vertical (la recta horizontal). Donde se cruzan las dos rectas está el punto.',
      decodeDone: 'El punto ({x1}; {x2}) está a una altura f = {fx}. El óptimo vale {opt}, en las estrellas: cualquier punto más alto se puede mejorar.',
      decodeDoneOut: 'El punto ({x1}; {x2}) está fuera de la caja. La fórmula de f se puede calcular igualmente (da {fx}), pero el punto no es una solución factible: la etapa de validez decide qué hacer con él.',
      validIn: 'Validez: los dos genes están entre {a} y {b}, así que el punto es factible y su aptitud es f = {fx}. Los tres tratamientos de la caja no tienen nada que hacer; prueba a arrastrar el punto fuera.',
      localityReal: 'La codificación real tiene una localidad perfecta: cambiar un poco un gen mueve el punto un poco, en la dirección de esa variable. Por eso tienen sentido la mutación gaussiana, que suma un ruido pequeño, y los cruces que promedian los valores de los padres: el gen es una cantidad, no una etiqueta como el número de máquina de la asignación.',
      validOut1: 'Validez: el gen 1 (x₁) se sale de [{a}, {b}]; el punto está a una distancia d = {d} de la caja. Con reales, esto pasa en cuanto una mutación gaussiana o un cruce que extrapola empujan un gen más allá del límite.',
      validOut2: 'Validez: el gen 2 (x₂) se sale de [{a}, {b}]; el punto está a una distancia d = {d} de la caja. Con reales, esto pasa en cuanto una mutación gaussiana o un cruce que extrapola empujan un gen más allá del límite.',
      validOutBoth: 'Validez: los dos genes se salen de [{a}, {b}]; sumando lo que se pasa cada uno, el punto está a una distancia d = {d} de la caja. Con reales, esto pasa en cuanto una mutación gaussiana o un cruce que extrapola empujan los genes más allá de los límites.',
      clamp: 'Acotar: cada gen que se sale se lleva al límite más cercano, de modo que ({x1}; {x2}) se evalúa como ({c1}; {c2}), con f = {fc}. Es lo más sencillo, pero todos los puntos que se salen por el mismo lado acaban en el mismo punto del borde, y la población se acumula allí.',
      reflect: 'Reflejar: el gen que se sale rebota en el límite, como en un espejo, tanto como se había pasado, de modo que ({x1}; {x2}) se evalúa como ({c1}; {c2}), con f = {fc}. A diferencia de acotar, no amontona puntos en el borde.',
      penalty: 'Penalizar: el punto no se cambia. Se evalúa tal cual, f = {fx}, y se le suma λ · d = {lambda} · {d} = {pen}: aptitud {fit}. Exige poder calcular f fuera de la caja, que en un problema real puede no tener sentido (una longitud negativa, una dosis imposible).',
    },
    en: {
      problemHimmelblau: 'We are looking for the lowest point of a surface: the Himmelblau function on the square [{a}, {b}]². On the map, the more intense the blue, the lower the point. It has four equally deep valleys, and no formula gives the minimum directly: it has to be searched for.',
      problemRastrigin: 'We are looking for the lowest point of a surface: the Rastrigin function on the square [{a}, {b}]². On the map, the more intense the blue, the lower the point. It is a bowl covered in ripples: a grid of local minima and a single global minimum, in the centre.',
      formVars: 'First, what is decided: two real numbers, x₁ and x₂, the coordinates of the point. Unlike in the knapsack or assignment problems, each variable can take infinitely many values.',
      formObjHimmelblau: 'Second, what we want: to minimise f(x₁, x₂) = (x₁² + x₂ − 11)² + (x₁ + x₂² − 7)². Being a sum of squares, it never goes below 0, and it is 0 exactly where both brackets vanish at once.',
      formObjRastrigin: 'Second, what we want: to minimise f(x₁, x₂) = 20 + Σᵢ (xᵢ² − 10 cos 2πxᵢ). The xᵢ² term gives the bowl shape, and the cosine adds a local minimum near every point with integer coordinates.',
      formCons: 'Third, what cannot be done: leaving the box. Each variable must stay between a = {a} and b = {b}; this is the only constraint.',
      formSpaceHimmelblau: 'The search space is the square [{a}, {b}]², a continuum with infinitely many points. The minimum is 0 and is reached at four points, the stars: (3; 2) and three others with no simple closed form.',
      formSpaceRastrigin: 'The search space is the square [{a}, {b}]², a continuum with infinitely many points. The minimum is 0 and lies at the origin, the star; around it there are dozens of local minima in which a local search would get trapped.',
      encode: 'Encoding: the chromosome is the point itself, ({x1}; {x2}), one real gene per variable. Genotype and phenotype coincide. Drag the point across the map to change the genes.',
      decodeIntro: 'Decoding is almost immediate here, because each gene is directly the value of its variable. Even so, let us go through it gene by gene.',
      decodeGene1: 'Gene 1 = {x}: this is x₁, the horizontal coordinate (the vertical line on the map).',
      decodeGene2: 'Gene 2 = {x}: this is x₂, the vertical coordinate (the horizontal line). The point lies where the two lines cross.',
      decodeDone: 'The point ({x1}; {x2}) is at a height f = {fx}. The optimum is {opt}, at the stars: any higher point can be improved.',
      decodeDoneOut: 'The point ({x1}; {x2}) is outside the box. The formula for f can still be computed (it gives {fx}), but the point is not a feasible solution: the validity stage decides what to do with it.',
      validIn: 'Validity: both genes are between {a} and {b}, so the point is feasible and its fitness is f = {fx}. None of the three box treatments has anything to do; try dragging the point outside the box.',
      localityReal: 'The real encoding has perfect locality: changing a gene a little moves the point a little, in the direction of that variable. That is why Gaussian mutation, which adds a small amount of noise, and crossovers that average the parents’ values make sense: the gene is a quantity, not a label like the machine number in the assignment problem.',
      validOut1: 'Validity: gene 1 (x₁) leaves [{a}, {b}]; the point is at a distance d = {d} from the box. With real-valued genes, this happens whenever a Gaussian mutation or an extrapolating crossover pushes a gene beyond the bound.',
      validOut2: 'Validity: gene 2 (x₂) leaves [{a}, {b}]; the point is at a distance d = {d} from the box. With real-valued genes, this happens whenever a Gaussian mutation or an extrapolating crossover pushes a gene beyond the bound.',
      validOutBoth: 'Validity: both genes leave [{a}, {b}]; adding up how far each one overshoots, the point is at a distance d = {d} from the box. With real-valued genes, this happens whenever a Gaussian mutation or an extrapolating crossover pushes the genes beyond the bounds.',
      clamp: 'Clamping: each gene that leaves the box is moved to the nearest bound, so ({x1}; {x2}) is evaluated as ({c1}; {c2}), with f = {fc}. This is the simplest treatment, but all points that leave on the same side end up at the same point on the boundary, and the population piles up there.',
      reflect: 'Reflecting: the gene that leaves the box bounces off the bound, as in a mirror, by the same amount it overshot, so ({x1}; {x2}) is evaluated as ({c1}; {c2}), with f = {fc}. Unlike clamping, it does not pile points up on the boundary.',
      penalty: 'Penalising: the point is not changed. It is evaluated as it is, f = {fx}, and λ · d = {lambda} · {d} = {pen} is added, giving a fitness of {fit}. It requires being able to compute f outside the box, which in a real problem may make no sense (a negative length, an impossible dose).',
    },
  };

  const P = {
    es: {
      sig: (vr) => (vr === 'penalty' ? 'EVALUAR_REAL(x, f, a, b, λ)' : 'EVALUAR_REAL(x, f, a, b)'),
      dec: '(x₁, x₂) ← (gen 1, gen 2)        // el cromosoma es el punto',
      check: 'si algún xᵢ < a o xᵢ > b:',
      clamp: 'para i = 1, 2: xᵢ ← mín(b, máx(a, xᵢ))',
      reflect: 'para i = 1, 2: mientras xᵢ < a o xᵢ > b:',
      reflect2: 'si xᵢ < a: xᵢ ← 2a − xᵢ;  si no: xᵢ ← 2b − xᵢ',
      penalty: 'd ← Σᵢ máx(0, a − xᵢ, xᵢ − b)        // 0 si x está dentro',
      ret: 'devolver f(x₁, x₂)',
      retPen: 'devolver f(x₁, x₂) + λ · d',
    },
    en: {
      sig: (vr) => (vr === 'penalty' ? 'EVALUATE_REAL(x, f, a, b, λ)' : 'EVALUATE_REAL(x, f, a, b)'),
      dec: '(x₁, x₂) ← (gene 1, gene 2)        // the chromosome is the point',
      check: 'if any xᵢ < a or xᵢ > b:',
      clamp: 'for i = 1, 2: xᵢ ← min(b, max(a, xᵢ))',
      reflect: 'for i = 1, 2: while xᵢ < a or xᵢ > b:',
      reflect2: 'if xᵢ < a: xᵢ ← 2a − xᵢ;  else: xᵢ ← 2b − xᵢ',
      penalty: 'd ← Σᵢ max(0, a − xᵢ, xᵢ − b)        // 0 if x is inside',
      ret: 'return f(x₁, x₂)',
      retPen: 'return f(x₁, x₂) + λ · d',
    },
  };

  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const vr = variant || 'clamp';
    const lines = [
      { id: 'sig', indent: 0, text: T.sig(vr) },
      { id: 'dec', indent: 1, text: T.dec },
    ];
    if (vr === 'penalty') {
      lines.push({ id: 'check', indent: 1, text: T.penalty }, { id: 'ret', indent: 1, text: T.retPen });
      return lines;
    }
    lines.push({ id: 'check', indent: 1, text: T.check });
    if (vr === 'reflect') lines.push({ id: 'treat', indent: 2, text: T.reflect }, { id: 'treat2', indent: 3, text: T.reflect2 });
    else lines.push({ id: 'treat', indent: 2, text: T.clamp });
    lines.push({ id: 'ret', indent: 1, text: T.ret });
    return lines;
  }

  const keywords = { es: ['para', 'si no', 'si', 'mientras', 'devolver'], en: ['for', 'if', 'else', 'while', 'return'] };
  const stepLines = {
    problem: ['sig'], formVars: ['sig'], formObj: ['sig'], formCons: ['sig'], formSpace: ['sig'], encode: ['sig'],
    decodeIntro: ['dec'],
    decodeGene: ['dec'],
    decodeDone: ['ret'],
    validIn: ['check', 'ret'],
    localityReal: ['dec'],
    validOut: ['check'],
    clamp: ['treat'],
    reflect: ['treat', 'treat2'],
    penalty: ['check', 'ret'],
  };
  const fnName = { python: 'real_fitness', javascript: 'realFitness' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'real_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def himmelblau(x1, x2):
    return (x1 * x1 + x2 - 11) ** 2 + (x1 + x2 * x2 - 7) ** 2


def rastrigin(x1, x2):
    return 20 + (x1 * x1 - 10 * math.cos(2 * math.pi * x1)) + (x2 * x2 - 10 * math.cos(2 * math.pi * x2))


# {{docFunctions}}
FUNCTIONS = {"himmelblau": (himmelblau, -5.0, 5.0), "rastrigin": (rastrigin, -5.12, 5.12)}


def clamp(x, a, b):
    """{{docClamp}}"""
    lo, hi = round(a * 100), round(b * 100)
    return [min(hi, max(lo, round(v * 100))) / 100 for v in x]


def reflect(x, a, b):
    """{{docReflect}}"""
    lo, hi = round(a * 100), round(b * 100)
    out = []
    for v in x:
        c = round(v * 100)  # {{cents}}
        while c < lo or c > hi:
            c = 2 * lo - c if c < lo else 2 * hi - c
        out.append(c / 100)
    return out


def distance_outside(x, a, b):
    """{{docDistance}}"""
    return sum(max(0, a - v, v - b) for v in x)


def real_fitness(x, fn="himmelblau", method="clamp", lam=10.0):
    """{{docFitness}}"""
    f, a, b = FUNCTIONS[fn]
    if method == "penalty":
        return f(*x) + lam * distance_outside(x, a, b), list(x)
    point = reflect(x, a, b) if method == "reflect" else clamp(x, a, b)
    return f(*point), point


if __name__ == "__main__":
    # {{example}}
    print(real_fitness([3.0, 2.0]))  # (0.0, [3.0, 2.0])
    print(real_fitness([5.8, 1.2], "himmelblau", "clamp"))  # f(5, 1.2)
    print(real_fitness([5.8, 1.2], "himmelblau", "reflect"))  # f(4.2, 1.2)
    print(real_fitness([5.8, 1.2], "himmelblau", "penalty", 10.0))  # f(5.8, 1.2) + 10 * 0.8
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'real-fitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

const himmelblau = (x1, x2) => (x1 * x1 + x2 - 11) ** 2 + (x1 + x2 * x2 - 7) ** 2;
const rastrigin = (x1, x2) => 20 + (x1 * x1 - 10 * Math.cos(2 * Math.PI * x1)) + (x2 * x2 - 10 * Math.cos(2 * Math.PI * x2));

// {{docFunctions}}
const FUNCTIONS = { himmelblau: [himmelblau, -5, 5], rastrigin: [rastrigin, -5.12, 5.12] };

/** {{docClamp}} */
function clamp(x, a, b) {
  const lo = Math.round(a * 100);
  const hi = Math.round(b * 100);
  return x.map((v) => Math.min(hi, Math.max(lo, Math.round(v * 100))) / 100);
}

/** {{docReflect}} */
function reflect(x, a, b) {
  const lo = Math.round(a * 100);
  const hi = Math.round(b * 100);
  return x.map((v) => {
    let c = Math.round(v * 100); // {{cents}}
    while (c < lo || c > hi) c = c < lo ? 2 * lo - c : 2 * hi - c;
    return c / 100;
  });
}

/** {{docDistance}} */
function distanceOutside(x, a, b) {
  return x.reduce((s, v) => s + Math.max(0, a - v, v - b), 0);
}

/** {{docFitness}} */
function realFitness(x, fn = 'himmelblau', method = 'clamp', lam = 10) {
  const [f, a, b] = FUNCTIONS[fn];
  if (method === 'penalty') return { fitness: f(x[0], x[1]) + lam * distanceOutside(x, a, b), point: x.slice() };
  const point = method === 'reflect' ? reflect(x, a, b) : clamp(x, a, b);
  return { fitness: f(point[0], point[1]), point };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { himmelblau, rastrigin, clamp, reflect, distanceOutside, realFitness };
  if (require.main === module) {
    // {{example}}
    console.log(realFitness([3, 2]).fitness); // 0
    console.log(realFitness([5.8, 1.2], 'himmelblau', 'clamp')); // f(5, 1.2)
    console.log(realFitness([5.8, 1.2], 'himmelblau', 'reflect')); // f(4.2, 1.2)
    console.log(realFitness([5.8, 1.2], 'himmelblau', 'penalty', 10)); // f(5.8, 1.2) + 10 * 0.8
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Optimización de una función continua de dos variables con un vector de reales: evaluación con los límites de la caja.',
      ref: 'Referencias: Janikow, C. Z. y Michalewicz, Z. (1991); Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docFunctions: 'Cada función, con su caja [a, b] para las dos variables. Las dos se minimizan; su mínimo global vale 0.',
      docClamp: 'Acotar: cada gen fuera de [a, b] se lleva al límite más cercano (en centésimas, como la herramienta).',
      docReflect: 'Reflejar: cada gen fuera de [a, b] rebota en el límite que ha cruzado, tantas veces como haga falta.',
      cents: 'en centésimas enteras: el resultado es exacto',
      docDistance: 'Distancia a la caja: lo que se sale cada gen, sumado; 0 si el punto está dentro.',
      docFitness: 'Aptitud (a minimizar) del cromosoma x = [x1, x2]. method = "clamp" o "reflect": f del punto corregido. method = "penalty": f del punto tal cual + lam · distancia a la caja. Devuelve la aptitud y el punto evaluado.',
      example: 'Ejemplo: un mínimo de Himmelblau y un punto que se sale por la derecha',
    },
    en: {
      title: 'Optimisation of a continuous function of two variables with a real-valued vector: evaluation with box-bound handling.',
      ref: 'References: Janikow, C. Z. & Michalewicz, Z. (1991); Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docFunctions: 'Each function, with its box [a, b] for both variables. Both are minimised; their global minimum is 0.',
      docClamp: 'Clamp: each gene outside [a, b] is taken to the nearest bound (working in hundredths, as the tool does).',
      docReflect: 'Reflect: each gene outside [a, b] bounces off the bound it crossed, as many times as needed.',
      cents: 'in integer hundredths, so the result is exact',
      docDistance: 'Distance to the box: the sum of how far each gene lies outside it; 0 if the point is inside.',
      docFitness: 'Fitness (to be minimised) of the chromosome x = [x1, x2]. method = "clamp" or "reflect": f of the corrected point. method = "penalty": f of the point as it is + lam · distance to the box. Returns the fitness and the evaluated point.',
      example: 'Example: a minimum of the Himmelblau function and a point that leaves the box on the right',
    },
  };

  const references = [
    C.ref('janikowMichalewicz', {
      es: 'Comparan experimentalmente la codificación binaria y la de coma flotante en problemas continuos: la real resulta más rápida, más precisa y más fácil de adaptar con operadores propios.',
      en: 'They experimentally compare binary and floating-point encodings on continuous problems: the real-valued one proves faster, more precise and easier to tailor with its own operators.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la representación de las soluciones (incluida la real y la binaria de variables continuas), sus propiedades deseables y el manejo de restricciones.',
      en: 'The course’s reference textbook. Covers solution representation (including real and binary encodings of continuous variables), its desirable properties and constraint handling.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la codificación de las soluciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers the encoding of solutions in chapter 8, on genetic algorithms.',
    }),
    C.ref('michalewicz', {
      es: 'Dedica un capítulo a la representación binaria frente a la de coma flotante en optimización numérica, con operadores para cada una y el tratamiento de los límites de las variables.',
      en: 'Devotes a chapter to binary versus floating-point representation in numerical optimisation, with operators for each and the handling of variable bounds.',
    }),
    C.ref('herrera', {
      es: 'Revisión de los algoritmos genéticos con codificación real: operadores de cruce (aritmético, BLX-α…), de mutación y herramientas para analizar su comportamiento.',
      en: 'Review of real-coded genetic algorithms: crossover operators (arithmetic, BLX-α…), mutation operators and tools to analyse their behaviour.',
    }),
    C.ref('himmelblau1972', {
      es: 'Libro de programación no lineal en el que aparece la función de prueba con cuatro mínimos globales que lleva su nombre.',
      en: 'Nonlinear programming book that presents the test function bearing his name, with its four global minima.',
    }),
    C.ref('muhlenbein1991', {
      es: 'Algoritmo genético paralelo probado sobre funciones clásicas; introduce la versión de n variables de la función de Rastrigin que se usa hoy.',
      en: 'Parallel genetic algorithm tested on classic functions; introduces the n-variable version of the Rastrigin function that is used today.',
    }),
    C.ref('orvoshDavis', {
      es: 'Estudian cuándo conviene escribir en el cromosoma la solución reparada y cuándo usarla solo para evaluar.',
      en: 'They study when it pays to write the repaired solution back into the chromosome and when to use it only for evaluation.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'function-real', explanation, variants, formalization, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['function-real'] = api;
})(typeof self !== 'undefined' ? self : this);
