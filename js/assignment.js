/*
 * Núcleo común del problema de asignación de tareas a máquinas no relacionadas (R‖Cmax), que
 * comparten las dos codificaciones (vector de enteros y matriz binaria).
 *
 * Instancia: { p } con p[i][j] el tiempo de la tarea i + 1 en la máquina j + 1 (enteros de 1 a 9).
 * Asignación: a = (a₁, …, aₙ), aᵢ ∈ {1, …, m}, la máquina de la tarea i.
 * Matriz: y[i][j] ∈ {0, 1}; 1 si la tarea i + 1 se hace en la máquina j + 1.
 * Carga de la máquina j: suma de los tiempos de sus tareas; makespan (Cmax): la mayor carga.
 * Óptimo exacto por enumeración de las mⁿ asignaciones (como mucho 4⁸ = 65 536).
 *
 * Funciona tanto en el navegador (window.GAX.assignment) como en Node.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rng.js') : root.GAX.rng;

  const LIMITS = { nMin: 5, nMax: 8, mMin: 2, mMax: 4, pMax: 9 };
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const power = (base, exp) => `${base}${String(exp).split('').map((d) => SUP[d]).join('')}`;

  // ---------- Instancias y cromosomas ----------

  function randomInstance(seed, n, m) {
    const r = R.mulberry32((Math.imul((seed >>> 0) || 1, 2654435761) ^ 0x3c6ef372) >>> 0);
    return { p: Array.from({ length: n }, () => Array.from({ length: m }, () => R.randInt(r, 1, LIMITS.pMax))) };
  }

  /** Asignación aleatoria (cada tarea a una máquina al azar), de un flujo distinto al de la instancia. */
  function randomAssignment(seed, n, m) {
    const r = R.mulberry32((Math.imul((seed >>> 0) || 1, 2246822519) ^ 0x1b873593) >>> 0);
    return Array.from({ length: n }, () => R.randInt(r, 1, m));
  }

  const sizes = (inst) => ({ n: inst.p.length, m: inst.p.length ? inst.p[0].length : 0 });

  /** Clave de error de i18n, o null. */
  function validateInstance(inst) {
    if (!inst || !Array.isArray(inst.p)) return 'errTasksCount';
    const { n, m } = sizes(inst);
    if (n < LIMITS.nMin || n > LIMITS.nMax) return 'errTasksCount';
    if (m < LIMITS.mMin || m > LIMITS.mMax) return 'errMachinesCount';
    if (!inst.p.every((row) => Array.isArray(row) && row.length === m)) return 'errTimesShape';
    if (!inst.p.every((row) => row.every((v) => Number.isInteger(v) && v >= 1 && v <= 99))) return 'errTimes';
    return null;
  }

  // ---------- Evaluación ----------

  function loads(inst, a) {
    const { m } = sizes(inst);
    const L = Array(m).fill(0);
    a.forEach((j, i) => { L[j - 1] += inst.p[i][j - 1]; });
    return L;
  }

  /** Cargas de una matriz leída tal cual: cada 1 suma su tiempo (una tarea sin unos no suma nada). */
  function matrixLoads(inst, y) {
    const { m } = sizes(inst);
    const L = Array(m).fill(0);
    y.forEach((row, i) => row.forEach((b, j) => { if (b) L[j] += inst.p[i][j]; }));
    return L;
  }

  const cmaxOf = (L) => Math.max(0, ...L);
  const makespan = (inst, a) => cmaxOf(loads(inst, a));
  /** Máquinas (1…m) cuya carga es el makespan. */
  const critical = (L) => { const c = cmaxOf(L); return L.map((v, j) => (v === c ? j + 1 : 0)).filter(Boolean); };

  // ---------- Conversiones entre codificaciones ----------

  const toMatrix = (a, m) => a.map((j) => Array.from({ length: m }, (_, k) => (k === j - 1 ? 1 : 0)));
  const rowOnes = (row) => row.map((b, j) => (b ? j + 1 : 0)).filter(Boolean);
  const isFeasibleMatrix = (y) => y.every((row) => rowOnes(row).length === 1);
  /** Vector de enteros de una matriz factible (null si alguna fila no tiene exactamente un 1). */
  const fromMatrix = (y) => (isFeasibleMatrix(y) ? y.map((row) => rowOnes(row)[0]) : null);
  /** Infracciones: v = Σᵢ │Σⱼ yᵢⱼ − 1│. */
  const violations = (y) => y.reduce((s, row) => s + Math.abs(rowOnes(row).length - 1), 0);

  /** ¿Es la máquina j mejor que la k para la tarea i? Menor tiempo; a igualdad, menor índice. */
  const beats = (inst, i, j, k) => inst.p[i][j - 1] < inst.p[i][k - 1] || (inst.p[i][j - 1] === inst.p[i][k - 1] && j < k);
  /** La mejor máquina (1…m) para la tarea i entre las candidatas (todas, si no se dan). */
  function fastest(inst, i, among) {
    const cands = among && among.length ? among : inst.p[i].map((_, j) => j + 1);
    return cands.reduce((best, j) => (beats(inst, i, j, best) ? j : best));
  }

  // ---------- Óptimo y espacio de búsqueda ----------

  /** { makespan, assignment, count }: el óptimo, la primera asignación óptima en orden lexicográfico y cuántas hay. */
  function optimum(inst) {
    const { n, m } = sizes(inst);
    const a = Array(n).fill(1);
    let best = Infinity;
    let arg = null;
    let count = 0;
    for (;;) {
      const c = makespan(inst, a);
      if (c < best) { best = c; arg = a.slice(); count = 1; } else if (c === best) count++;
      let k = n - 1;
      while (k >= 0 && a[k] === m) { a[k] = 1; k--; }
      if (k < 0) break;
      a[k]++;
    }
    return { makespan: best, assignment: arg, count };
  }

  /** Cota de λ: con λ ≥ máxᵢ mínⱼ pᵢⱼ, ninguna matriz penalizada mejora al óptimo. */
  const lambdaBound = (inst) => Math.max(...inst.p.map((row) => Math.min(...row)));

  const api = {
    LIMITS, power, sizes, randomInstance, randomAssignment, validateInstance,
    loads, matrixLoads, cmaxOf, makespan, critical,
    toMatrix, fromMatrix, rowOnes, isFeasibleMatrix, violations, beats, fastest,
    optimum, lambdaBound,
  };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).assignment = api;
})(typeof self !== 'undefined' ? self : this);
