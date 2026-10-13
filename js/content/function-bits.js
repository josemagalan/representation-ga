/*
 * Contenido docente de la optimización de una función continua con una cadena binaria (estándar o Gray).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'El problema es el mismo que en la página del vector de reales: el punto más bajo de una función de dos variables (Himmelblau o Rastrigin) dentro de la caja [a, b]². Lo que cambia es la codificación. Los algoritmos genéticos clásicos de Holland (1975) y Goldberg (1989) trabajaban siempre con cadenas de bits, y para un problema continuo eso obliga a discretizar: cada variable se escribe con k bits, que dan 2ᵏ valores posibles repartidos a intervalos iguales entre a y b.',
      'Decodificar una variable tiene dos pasos. Primero, sus k bits se leen como un entero z entre 0 y 2ᵏ − 1, sumando los pesos (potencias de 2) de los unos; el primer bit es el de más peso. Después, z se lleva a la caja: x = a + z · Δ, con Δ = (b − a)/(2ᵏ − 1). Con dos variables, el cromosoma tiene 2k bits y solo puede representar los 2ᵏ × 2ᵏ puntos de una rejilla.',
      'La codificación absorbe la restricción de la caja: toda cadena decodifica a un punto entre a y b, así que no hay cromosomas infactibles ni hace falta acotar, reflejar o penalizar, como sí ocurre con los reales. El precio es la precisión. Los puntos representables están separados Δ, y el óptimo puede no ser uno de ellos: en Rastrigin, con 2ᵏ valores repartidos simétricamente, el 0 queda siempre entre dos, y en Himmelblau ningún mínimo cae en la rejilla. Michalewicz (1996) da la regla para elegir k: si se quieren p decimales, hacen falta 2ᵏ − 1 ≥ (b − a) · 10ᵖ. Cada bit más divide Δ aproximadamente por dos, pero alarga el cromosoma y el espacio de búsqueda.',
      'El otro problema es la localidad. En binario estándar, dos enteros consecutivos pueden diferir en todos sus bits: de 01111 (15) a 10000 (16) hay que cambiar cinco. Es un salto de Hamming (Hamming cliff): puntos vecinos en el espacio de búsqueda con cromosomas muy lejanos, de modo que la mutación de un bit no puede dar ese paso pequeño. Y al revés, cambiar el bit más significativo mueve el punto casi media caja. La representación no respeta la distancia del problema, una de las propiedades que Talbi (2009) pide a una buena representación.',
      'El código Gray reflejado evita el primer defecto: dos enteros consecutivos difieren siempre en un solo bit. Se pasa de binario a Gray con g₁ = b₁ y gⱼ = bⱼ₋₁ ⊕ bⱼ (⊕ es el «o exclusivo»), y de Gray a binario con b₁ = g₁ y bⱼ = bⱼ₋₁ ⊕ gⱼ, bit a bit. Caruana y Schaffer (1988) mostraron que con Gray un algoritmo genético rinde mejor en muchas funciones de prueba, precisamente porque la mutación de un bit puede dar el paso al vecino. Pero Gray no arregla el segundo defecto: un solo bit puede seguir llevando muy lejos (cambiar el primero lleva de z a 2ᵏ − 1 − z, su simétrico).',
      'Los puntos representables son los mismos en binario estándar y en Gray; lo que cambia es qué cromosomas son vecinos. Por eso la elección del código no altera el espacio de búsqueda, sino el paisaje que ven los operadores. Esta es una de las razones por las que hoy, para variables continuas, se prefiere la codificación real (Janikow y Michalewicz, 1991; Herrera, Lozano y Verdegay, 1998), que tiene la precisión de la máquina y una localidad perfecta, aunque obliga a tratar los genes que se salen de la caja.',
      'Coste: decodificar cuesta O(k) por variable (la conversión de Gray es otra pasada de k operaciones) y no hay que comprobar nada. Con estos tamaños, la herramienta encuentra el mejor punto representable recorriendo la rejilla.',
    ],
    en: [
      'The problem is the same as on the real-valued vector page: the lowest point of a two-variable function (Himmelblau or Rastrigin) within the box [a, b]². What changes is the encoding. The classic genetic algorithms of Holland (1975) and Goldberg (1989) always worked with bit strings, and for a continuous problem this requires discretisation: each variable is written with k bits, which give 2ᵏ possible values evenly spaced between a and b.',
      'Decoding a variable has two steps. First, its k bits are read as an integer z between 0 and 2ᵏ − 1, by adding up the weights (powers of 2) of the bits that are 1; the first bit is the most significant. Then z is mapped into the box: x = a + z · Δ, with Δ = (b − a)/(2ᵏ − 1). With two variables, the chromosome has 2k bits and can only represent the 2ᵏ × 2ᵏ points of a grid.',
      'The encoding absorbs the box constraint: every string decodes to a point between a and b, so there are no infeasible chromosomes and no need to clamp, reflect or penalise, as is the case with real-valued vectors. The price is precision. The representable points are Δ apart, and the optimum may not be one of them: for the Rastrigin function, with 2ᵏ values spread symmetrically, 0 always falls between two of them, and for the Himmelblau function no minimum lies on the grid. Michalewicz (1996) gives the rule for choosing k: for a precision of p decimal places, k must satisfy 2ᵏ − 1 ≥ (b − a) · 10ᵖ. Each extra bit roughly halves Δ, but makes the chromosome longer and the search space larger.',
      'The other problem is locality. In standard binary, two consecutive integers may differ in all their bits: going from 01111 (15) to 10000 (16) requires changing all five bits. This is a Hamming cliff: neighbouring points in the search space whose chromosomes are far apart, so that a one-bit mutation cannot take that small step. Conversely, changing the most significant bit moves the point almost half the width of the box. The representation does not preserve the problem’s notion of distance, which Talbi (2009) lists among the properties of a good representation.',
      'The reflected Gray code avoids the first flaw: two consecutive integers always differ in a single bit. Binary is converted to Gray with g₁ = b₁ and gⱼ = bⱼ₋₁ ⊕ bⱼ (⊕ is “exclusive or”), and Gray into binary with b₁ = g₁ and bⱼ = bⱼ₋₁ ⊕ gⱼ, bit by bit. Caruana and Schaffer (1988) showed that with Gray code a genetic algorithm performs better on many test functions, precisely because a one-bit mutation can take the step to the neighbouring value. But Gray code does not fix the second flaw: a single bit flip can still move the point very far (flipping the first bit takes z to 2ᵏ − 1 − z, its mirror image).',
      'The representable points are the same in standard binary and in Gray; what changes is which chromosomes are neighbours. That is why the choice of code alters not the search space but the fitness landscape the operators see. This is one of the reasons why the real encoding is preferred today for continuous variables (Janikow and Michalewicz, 1991; Herrera, Lozano and Verdegay, 1998): it has machine precision and perfect locality, although it requires handling genes that leave the box.',
      'Cost: decoding costs O(k) per variable (the Gray conversion adds another pass of k operations) and there is nothing to check. With these sizes, the tool finds the best representable point by exhaustively scanning the grid.',
    ],
  };

  const variants = {
    standard: {
      name: { es: 'Binario estándar', en: 'Standard binary' },
      desc: { es: 'Cada grupo de k bits es el entero z en binario natural, el primer bit el de más peso.', en: 'Each group of k bits is the integer z in standard binary, with the first bit the most significant.' },
    },
    gray: {
      name: { es: 'Código Gray', en: 'Gray code' },
      desc: { es: 'Cada grupo de k bits es z en código Gray reflejado: dos valores consecutivos de z difieren en un solo bit.', en: 'Each group of k bits is z in reflected Gray code: two consecutive values of z differ in a single bit.' },
    },
  };

  const formalization = {
    rows: [
      C.fnRows.vars, C.fnRows.obj, C.fnRows.cons,
      { id: 'space', label: { es: 'Espacio de búsqueda', en: 'Search space' },
        math: (lang) => `<math><msub><mi>x</mi><mi>i</mi></msub><mo>∈</mo><mo>{</mo><mi>a</mi><mo>+</mo><mi>z</mi><mi>Δ</mi><mo>:</mo><mi>z</mi><mo>=</mo><mn>0</mn><mo>,</mo><mo>…</mo><mo>,</mo><msup><mn>2</mn><mi>k</mi></msup><mo>−</mo><mn>1</mn><mo>}</mo><mo>,</mo><mspace width="0.4em"></mspace><mi>Δ</mi><mo>=</mo><mfrac><mrow><mi>b</mi><mo>−</mo><mi>a</mi></mrow><mrow><msup><mn>2</mn><mi>k</mi></msup><mo>−</mo><mn>1</mn></mrow></mfrac><mo>;</mo><mspace width="0.6em"></mspace><msup><mn>2</mn><mrow><mn>2</mn><mi>k</mi></mrow></msup><mspace width="0.3em"></mspace><mtext>${lang === 'en' ? 'points' : 'puntos'}</mtext></math>` },
    ],
  };

  const narration = {
    es: {
      problemHimmelblau: 'Buscamos el punto más bajo de una superficie: la función de Himmelblau en el cuadrado [{a}, {b}]². En el mapa, cuanto más intenso es el azul, más bajo. Tiene cuatro valles igual de profundos, y no hay una fórmula que dé el mínimo directamente: hay que buscarlo.',
      problemRastrigin: 'Buscamos el punto más bajo de una superficie: la función de Rastrigin en el cuadrado [{a}, {b}]². En el mapa, cuanto más intenso es el azul, más bajo. Es un cuenco cubierto de ondulaciones: una rejilla de mínimos locales y un solo mínimo global, en el centro.',
      formVars: 'Primero, qué se decide: dos números reales, x₁ y x₂, las coordenadas del punto. Cada uno puede tomar infinitos valores, pero un cromosoma de bits solo puede escribir unos pocos.',
      formObjHimmelblau: 'Segundo, qué se quiere: minimizar f(x₁, x₂) = (x₁² + x₂ − 11)² + (x₁ + x₂² − 7)². Como es una suma de cuadrados, nunca baja de 0, y vale 0 justo donde los dos paréntesis se anulan a la vez.',
      formObjRastrigin: 'Segundo, qué se quiere: minimizar f(x₁, x₂) = 20 + Σᵢ (xᵢ² − 10 cos 2πxᵢ). El término xᵢ² da la forma de cuenco, y el coseno añade un mínimo local cerca de cada punto de coordenadas enteras.',
      formCons: 'Tercero, qué no se puede: salirse de la caja. Cada variable tiene que quedar entre a = {a} y b = {b}; es la única restricción.',
      formSpaceBits: 'Con k = {k} bits por variable, cada xᵢ solo puede tomar {n} valores, separados Δ = {delta}: los puntos del mapa forman una rejilla de {pow} = {total} puntos. Los mínimos globales, las estrellas, valen 0, pero ¿caen en la rejilla?',
      encode: 'Codificación: el cromosoma tiene 2k = {nb} bits. Los {k} primeros, {g1}, codifican x₁, y los {k} siguientes, {g2}, codifican x₂, en binario estándar: el primer bit de cada grupo es el de más peso. Haz clic en un bit para cambiarlo.',
      encodeGray: 'Codificación: el cromosoma tiene 2k = {nb} bits. Los {k} primeros, {g1}, codifican x₁, y los {k} siguientes, {g2}, codifican x₂, en código Gray: no se pueden leer como un número binario sin convertirlos antes. Haz clic en un bit para cambiarlo.',
      decodeIntro: 'Decodificar es pasar de bits a números reales: cada grupo de {k} bits se lee como un entero z entre 0 y {n1}, y z se lleva a la caja [{a}, {b}] repartiendo los valores a intervalos iguales.',
      decodeIntroGray: 'Decodificar es pasar de bits a números reales, en tres pasos por variable: los bits Gray se convierten a binario, el binario se lee como un entero z entre 0 y {n1}, y z se lleva a la caja [{a}, {b}] a intervalos iguales.',
      decodeGray: 'Variable {v}: los bits Gray {gray} se convierten a binario. El primero se copia, y cada uno de los siguientes es el «o exclusivo» (⊕) del bit binario anterior y su bit Gray: 1 si son distintos, 0 si son iguales. Sale {bin}.',
      decodeInt: 'Variable {v}: el binario {bin} se lee como un entero sumando los pesos de los unos (encima de cada bit): z = {sum} = {z}.',
      decodeScale: 'Variable {v}: z = {z} se lleva a la caja: {v} = a + z · Δ = {a} + {z} · {delta} = {x} (la recta del mapa).',
      decodeDone: 'Los bits decodifican al punto ({x1}; {x2}), con f = {fx}. El óptimo vale {opt}, pero con estos bits el mejor punto al que se puede llegar vale {best}.',
      decodeDoneBest: 'Los bits decodifican al punto ({x1}; {x2}), con f = {fx}: es el mejor punto de la rejilla. Aun así no llega al óptimo, {opt}, que queda entre los puntos representables.',
      validBits: 'Validez: las {total} cadenas de {nb} bits decodifican todas a un punto de la caja [{a}, {b}]²: no hay cromosomas infactibles ni hace falta acotar. La codificación ha absorbido la restricción, como el vector de enteros en la asignación.',
      precisionHimmelblau: 'Pero solo son representables los puntos de la rejilla, separados Δ = {delta}. El mejor de ellos, el círculo verde, es ({bx1}; {bx2}) y vale {best}, no 0: ningún mínimo cae exactamente en la rejilla. Con un bit más por variable, Δ bajaría a {half}: cada bit divide el error aproximadamente por dos.',
      precisionRastrigin: 'Pero solo son representables los puntos de la rejilla, separados Δ = {delta}. El origen, donde está el óptimo, no es uno de ellos: con 2ᵏ valores repartidos simétricamente, el 0 queda siempre entre dos. El mejor punto representable, el círculo verde, es ({bx1}; {bx2}) y vale {best}. Con un bit más por variable, Δ bajaría a {half}.',
      hammingStandard: 'Localidad: los puntos rosas son los cromosomas a un bit de distancia; cambiar el primer bit de una variable mueve el punto {jump}, casi media caja. Y al revés: para pasar de z = {z} a su vecino de la rejilla, z = {z2}, hay que cambiar {h} bits de {v} (recuadros verdes). Es un salto de Hamming: puntos vecinos con cromosomas lejanos.',
      hammingStandardOne: 'Localidad: los puntos rosas son los cromosomas a un bit de distancia; cambiar el primer bit de una variable mueve el punto {jump}, casi media caja. Desde aquí, el vecino de la rejilla, z = {z2}, está a un solo bit de {v} (recuadro verde), pero no siempre es así: de 01111 a 10000 hay que cambiar los cinco bits. Prueba otros puntos.',
      hammingGray: 'Localidad: con el código Gray, los vecinos de la rejilla están siempre a un bit: para pasar de z = {z} a z = {z2} basta cambiar un bit de {v} (recuadro verde). Pero lo contrario no se cumple: los puntos rosas, a un bit de distancia, pueden caer lejos. Cambiar el primer bit de x₁ lleva de z = {z} a z = {zm}, su simétrico.',
    },
    en: {
      problemHimmelblau: 'We are looking for the lowest point of a surface: the Himmelblau function on the square [{a}, {b}]². On the map, the more intense the blue, the lower the point. It has four equally deep valleys, and no formula gives the minimum directly: it has to be searched for.',
      problemRastrigin: 'We are looking for the lowest point of a surface: the Rastrigin function on the square [{a}, {b}]². On the map, the more intense the blue, the lower the point. It is a bowl covered in ripples: a grid of local minima and a single global minimum, in the centre.',
      formVars: 'First, what is decided: two real numbers, x₁ and x₂, the coordinates of the point. Each can take infinitely many values, but a bit-string chromosome can only represent a few of them.',
      formObjHimmelblau: 'Second, what we want: to minimise f(x₁, x₂) = (x₁² + x₂ − 11)² + (x₁ + x₂² − 7)². Being a sum of squares, it never goes below 0, and it is 0 exactly where both brackets vanish at once.',
      formObjRastrigin: 'Second, what we want: to minimise f(x₁, x₂) = 20 + Σᵢ (xᵢ² − 10 cos 2πxᵢ). The xᵢ² term gives the bowl shape, and the cosine adds a local minimum near every point with integer coordinates.',
      formCons: 'Third, what cannot be done: leaving the box. Each variable must stay between a = {a} and b = {b}; this is the only constraint.',
      formSpaceBits: 'With k = {k} bits per variable, each xᵢ can only take {n} values, Δ = {delta} apart: the points on the map form a grid of {pow} = {total} points. The global minima, the stars, have value 0, but do they lie on the grid?',
      encode: 'Encoding: the chromosome has 2k = {nb} bits. The first {k}, {g1}, encode x₁, and the next {k}, {g2}, encode x₂, in standard binary: the first bit of each group is the most significant. Click a bit to flip it.',
      encodeGray: 'Encoding: the chromosome has 2k = {nb} bits. The first {k}, {g1}, encode x₁, and the next {k}, {g2}, encode x₂, in Gray code: they cannot be read as a binary number without converting them first. Click a bit to flip it.',
      decodeIntro: 'Decoding means going from bits to real numbers: each group of {k} bits is read as an integer z between 0 and {n1}, and z is mapped into the box [{a}, {b}], with the values evenly spaced.',
      decodeIntroGray: 'Decoding means going from bits to real numbers, in three steps per variable: the Gray bits are converted to binary, the binary string is read as an integer z between 0 and {n1}, and z is mapped into the box [{a}, {b}] at equal intervals.',
      decodeGray: 'Variable {v}: the Gray bits {gray} are converted to binary. The first one is copied, and each of the following is the “exclusive or” (⊕) of the previous binary bit and its Gray bit: 1 if they differ, 0 if they are equal. The result is {bin}.',
      decodeInt: 'Variable {v}: the binary string {bin} is read as an integer by adding up the weights of the bits that are 1 (shown above each bit): z = {sum} = {z}.',
      decodeScale: 'Variable {v}: z = {z} is mapped into the box: {v} = a + z · Δ = {a} + {z} · {delta} = {x} (the line on the map).',
      decodeDone: 'The bits decode to the point ({x1}; {x2}), with f = {fx}. The optimum is {opt}, but with these bits the best point that can be reached has f = {best}.',
      decodeDoneBest: 'The bits decode to the point ({x1}; {x2}), with f = {fx}: it is the best point on the grid. Even so, it does not reach the optimum, {opt}, which lies between representable points.',
      validBits: 'Validity: all {total} strings of {nb} bits decode to a point in the box [{a}, {b}]²: there are no infeasible chromosomes and no need to clamp. The encoding has absorbed the constraint, like the integer vector in the assignment problem.',
      precisionHimmelblau: 'But only the grid points are representable, Δ = {delta} apart. The best of them, the green circle, is ({bx1}; {bx2}) and has f = {best}, not 0: no minimum falls exactly on the grid. With one more bit per variable, Δ would drop to {half}: each extra bit roughly halves the error.',
      precisionRastrigin: 'But only the grid points are representable, Δ = {delta} apart. The origin, where the optimum lies, is not one of them: with 2ᵏ values spread symmetrically, 0 always falls between two of them. The best representable point, the green circle, is ({bx1}; {bx2}) and has f = {best}. With one more bit per variable, Δ would drop to {half}.',
      hammingStandard: 'Locality: the pink points are the chromosomes one bit away; changing the first bit of a variable moves the point {jump}, almost half the width of the box. And conversely: to go from z = {z} to its grid neighbour, z = {z2}, {h} bits of {v} must change (green boxes). This is a Hamming cliff: neighbouring points whose chromosomes are far apart.',
      hammingStandardOne: 'Locality: the pink points are the chromosomes one bit away; changing the first bit of a variable moves the point {jump}, almost half the width of the box. From here, the grid neighbour, z = {z2}, is a single bit of {v} away (green box), but that is not always the case: from 01111 to 10000 all five bits must change. Try other points.',
      hammingGray: 'Locality: with Gray code, the grid neighbours are always one bit away: to go from z = {z} to z = {z2} it is enough to change one bit of {v} (green box). But the converse does not hold: the pink points, one bit away, may land far away. Changing the first bit of x₁ takes z = {z} to z = {zm}, its mirror image.',
    },
  };

  const P = {
    es: {
      sig: 'DECODIFICAR_Y_EVALUAR(c, k, f, a, b)',
      forI: 'para i = 1, 2:',
      take: (g) => (g ? 'g ← los k bits de la variable i' : 'bin ← los k bits de la variable i'),
      gray1: 'bin[1] ← g[1]',
      gray2: 'para j = 2, …, k: bin[j] ← bin[j − 1] ⊕ g[j]',
      int: 'z ← Σⱼ bin[j] · 2ᵏ⁻ʲ        // de 0 a 2ᵏ − 1',
      scale: 'xᵢ ← a + z · (b − a) / (2ᵏ − 1)',
      ret: 'devolver f(x₁, x₂)        // toda cadena cae dentro de la caja',
    },
    en: {
      sig: 'DECODE_AND_EVALUATE(c, k, f, a, b)',
      forI: 'for i = 1, 2:',
      take: (g) => (g ? 'g ← the k bits of variable i' : 'bin ← the k bits of variable i'),
      gray1: 'bin[1] ← g[1]',
      gray2: 'for j = 2, …, k: bin[j] ← bin[j − 1] ⊕ g[j]',
      int: 'z ← Σⱼ bin[j] · 2ᵏ⁻ʲ        // from 0 to 2ᵏ − 1',
      scale: 'xᵢ ← a + z · (b − a) / (2ᵏ − 1)',
      ret: 'return f(x₁, x₂)        // every string falls inside the box',
    },
  };

  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const gray = variant === 'gray';
    const lines = [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'forI', indent: 1, text: T.forI },
      { id: 'take', indent: 2, text: T.take(gray) },
    ];
    if (gray) lines.push({ id: 'gray1', indent: 2, text: T.gray1 }, { id: 'gray2', indent: 2, text: T.gray2 });
    lines.push(
      { id: 'int', indent: 2, text: T.int },
      { id: 'scale', indent: 2, text: T.scale },
      { id: 'ret', indent: 1, text: T.ret },
    );
    return lines;
  }

  const keywords = { es: ['para', 'devolver'], en: ['for', 'return'] };
  const stepLines = {
    problem: ['sig'], formVars: ['sig'], formObj: ['sig'], formCons: ['sig'], formSpace: ['scale'], encode: ['sig'],
    decodeIntro: ['forI', 'take'],
    decodeGray: ['gray1', 'gray2'],
    decodeInt: ['int'],
    decodeScale: ['scale'],
    decodeDone: ['ret'],
    validBits: ['ret'],
    precision: ['scale'],
    hamming: ['take'],
  };
  const fnName = { python: 'bits_fitness', javascript: 'bitsFitness' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'bits_fitness.py',
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


def gray_to_binary(g):
    """{{docGray}}"""
    b = [g[0]]
    for bit in g[1:]:
        b.append(b[-1] ^ bit)
    return b


def bits_to_int(bits):
    """{{docInt}}"""
    z = 0
    for bit in bits:
        z = 2 * z + bit
    return z


def decode(bits, k, a, b, code="standard"):
    """{{docDecode}}"""
    point = []
    for i in range(2):
        group = list(bits[i * k:(i + 1) * k])
        if code == "gray":
            group = gray_to_binary(group)
        z = bits_to_int(group)
        point.append(a + z * (b - a) / (2 ** k - 1))  # {{scale}}
    return point


def bits_fitness(bits, fn="himmelblau", k=5, code="standard"):
    """{{docFitness}}"""
    f, a, b = FUNCTIONS[fn]
    point = decode(bits, k, a, b, code)
    return f(*point), point


if __name__ == "__main__":
    # {{example}}
    c = [1, 1, 0, 0, 1, 1, 0, 0, 1, 1]
    print(bits_fitness(c, "himmelblau", 5, "standard"))  # z = 25, 19
    print(bits_fitness(c, "himmelblau", 5, "gray"))  # z = 17, 29
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'bits-fitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

const himmelblau = (x1, x2) => (x1 * x1 + x2 - 11) ** 2 + (x1 + x2 * x2 - 7) ** 2;
const rastrigin = (x1, x2) => 20 + (x1 * x1 - 10 * Math.cos(2 * Math.PI * x1)) + (x2 * x2 - 10 * Math.cos(2 * Math.PI * x2));

// {{docFunctions}}
const FUNCTIONS = { himmelblau: [himmelblau, -5, 5], rastrigin: [rastrigin, -5.12, 5.12] };

/** {{docGray}} */
function grayToBinary(g) {
  const b = [g[0]];
  for (let j = 1; j < g.length; j++) b.push(b[j - 1] ^ g[j]);
  return b;
}

/** {{docInt}} */
function bitsToInt(bits) {
  return bits.reduce((z, bit) => 2 * z + bit, 0);
}

/** {{docDecode}} */
function decode(bits, k, a, b, code = 'standard') {
  const point = [];
  for (let i = 0; i < 2; i++) {
    let group = bits.slice(i * k, (i + 1) * k);
    if (code === 'gray') group = grayToBinary(group);
    const z = bitsToInt(group);
    point.push(a + z * (b - a) / (2 ** k - 1)); // {{scale}}
  }
  return point;
}

/** {{docFitness}} */
function bitsFitness(bits, fn = 'himmelblau', k = 5, code = 'standard') {
  const [f, a, b] = FUNCTIONS[fn];
  const point = decode(bits, k, a, b, code);
  return { fitness: f(point[0], point[1]), point };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { himmelblau, rastrigin, grayToBinary, bitsToInt, decode, bitsFitness };
  if (require.main === module) {
    // {{example}}
    const c = [1, 1, 0, 0, 1, 1, 0, 0, 1, 1];
    console.log(bitsFitness(c, 'himmelblau', 5, 'standard')); // z = 25, 19
    console.log(bitsFitness(c, 'himmelblau', 5, 'gray')); // z = 17, 29
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Optimización de una función continua de dos variables con una cadena binaria (estándar o Gray): decodificación y evaluación.',
      ref: 'Referencias: Caruana, R. A. y Schaffer, J. D. (1988); Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docFunctions: 'Cada función, con su caja [a, b] para las dos variables. Las dos se minimizan; su mínimo global vale 0.',
      docGray: 'Gray reflejado a binario: el primer bit se copia y cada uno de los siguientes es el XOR del binario anterior y su bit Gray.',
      docInt: 'Entero de un número binario, el primer bit el de más peso.',
      docDecode: 'Los k primeros bits son x1 y los k siguientes x2; cada grupo da un entero z de 0 a 2^k - 1, que se lleva a [a, b].',
      scale: 'a intervalos iguales de (b - a) / (2^k - 1)',
      docFitness: 'Aptitud (a minimizar) de la cadena de 2k bits: f del punto decodificado. Toda cadena cae dentro de la caja. Devuelve la aptitud y el punto.',
      example: 'Ejemplo: la misma cadena leída en binario estándar y en código Gray',
    },
    en: {
      title: 'Optimisation of a continuous function of two variables with a bit string (standard binary or Gray code): decoding and evaluation.',
      ref: 'References: Caruana, R. A. & Schaffer, J. D. (1988); Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      docFunctions: 'Each function, with its box [a, b] for both variables. Both are minimised; their global minimum is 0.',
      docGray: 'Reflected Gray to binary: the first bit is copied and each of the following is the XOR of the previous binary bit and its Gray bit.',
      docInt: 'Integer value of a binary number, with the first bit the most significant.',
      docDecode: 'The first k bits are x1 and the next k are x2; each group gives an integer z from 0 to 2^k - 1, which is mapped into [a, b].',
      scale: 'at equal intervals of (b - a) / (2^k - 1)',
      docFitness: 'Fitness (to be minimised) of the 2k-bit string: f of the decoded point. Every string falls inside the box. Returns the fitness and the point.',
      example: 'Example: the same string read in standard binary and in Gray code',
    },
  };

  const references = [
    C.ref('caruanaSchaffer', {
      es: 'Comparan la codificación binaria estándar y la Gray en un algoritmo genético: los saltos de Hamming del binario introducen un sesgo oculto, y el código Gray rinde mejor en muchas funciones de prueba.',
      en: 'They compare standard binary and Gray encodings in a genetic algorithm: the Hamming cliffs of binary introduce a hidden bias, and Gray code performs better on many test functions.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la representación de las soluciones, sus propiedades deseables (entre ellas la localidad) y la codificación binaria y Gray de variables continuas.',
      en: 'The course’s reference textbook. Covers solution representation, its desirable properties (locality among them) and the binary and Gray encoding of continuous variables.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la codificación de las soluciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers the encoding of solutions in chapter 8, on genetic algorithms.',
    }),
    C.ref('goldberg', {
      es: 'El manual clásico de los algoritmos genéticos con cadenas binarias, con la decodificación de parámetros reales en k bits y la concatenación de varias variables.',
      en: 'The classic textbook on genetic algorithms with binary strings, including how to decode real parameters from k bits and how to concatenate several variables.',
    }),
    C.ref('michalewicz', {
      es: 'Da la regla para elegir el número de bits según la precisión deseada y compara la representación binaria con la de coma flotante.',
      en: 'Gives the rule for choosing the number of bits according to the desired precision and compares binary with floating-point representation.',
    }),
    C.ref('janikowMichalewicz', {
      es: 'Comparación experimental de la codificación binaria y la real en problemas continuos, favorable a la real.',
      en: 'Experimental comparison of binary and real encodings on continuous problems, in favour of the real one.',
    }),
    C.ref('himmelblau1972', {
      es: 'Libro de programación no lineal en el que aparece la función de prueba con cuatro mínimos globales que lleva su nombre.',
      en: 'Nonlinear programming book that presents the test function bearing his name, with its four global minima.',
    }),
    C.ref('muhlenbein1991', {
      es: 'Algoritmo genético paralelo probado sobre funciones clásicas; introduce la versión de n variables de la función de Rastrigin que se usa hoy.',
      en: 'Parallel genetic algorithm tested on classic functions; introduces the n-variable version of the Rastrigin function that is used today.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'function-bits', explanation, variants, formalization, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['function-bits'] = api;
})(typeof self !== 'undefined' ? self : this);
