/*
 * Mapas de rutas para los operadores de permutación: cada gen es una ciudad y cada cromosoma,
 * una ruta circular del viajante. Dos mapas: la ruta del padre y la del mutante, que se forma
 * paso a paso (solo los tramos entre posiciones consecutivas ya colocadas) sobre la del padre,
 * tenue. Los tramos del mutante se distinguen según estuvieran o no en el padre.
 */
(function (root) {
  'use strict';
  const d3 = root.d3;
  const W = 300;
  const H = 220;
  const PAD = 16;

  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  function edgeSet(p) {
    const s = new Set();
    for (let i = 0; i < p.length; i++) s.add(key(p[i], p[(i + 1) % p.length]));
    return s;
  }

  function createRouteMaps(el, opts) {
    const t = opts.t;              // (key, params) => texto
    const fmt = opts.formatLength; // número => texto
    const lengthOf = opts.tourLength;
    let problem = null;            // { parent, cities }
    let current = null;

    const maps = el.svgs.map((svgEl) => {
      const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
      return {
        svg,
        gParent: svg.append('g').attr('class', 'route-parents'),
        gEdges: svg.append('g').attr('class', 'route-edges'),
        gCities: svg.append('g').attr('class', 'route-cities'),
      };
    });

    const X = (c) => PAD + (c[0] / 100) * (W - 2 * PAD);
    const Y = (c) => PAD + (c[1] / 100) * (H - 2 * PAD);
    const closed = (route) => route.map((g) => `${X(problem.cities[g])},${Y(problem.cities[g])}`).join(' ');

    function setProblem(p) {
      problem = p;
      // Mapa 0: la ruta del padre, completa. Mapa 1: la del padre, tenue, de fondo.
      maps.forEach((m, k) => {
        m.gParent.selectAll('polygon')
          .data([p.parent])
          .join('polygon')
          .attr('class', k === 0 ? 'route-parent route-parent-main' : 'route-parent route-p1')
          .attr('points', closed);
      });
    }

    function drawCities(m, placed, missing) {
      const { cities } = problem;
      const genes = Object.keys(cities).map(Number);
      const cityG = m.gCities.selectAll('g.city')
        .data(genes, (g) => g)
        .join((enter) => {
          const c = enter.append('g').attr('class', 'city');
          c.append('circle').attr('r', 9);
          c.append('text').attr('dy', '0.35em');
          return c;
        });
      cityG.attr('transform', (g) => `translate(${X(cities[g])},${Y(cities[g])})`)
        .classed('visited', (g) => placed.has(g))
        .classed('missing', (g) => missing.indexOf(g) !== -1);
      cityG.select('text').text((g) => g);
    }

    function show(step) {
      current = step;
      if (!problem) return;
      const { parent, cities } = problem;
      const n = parent.length;
      const pe = edgeSet(parent);
      const lp = lengthOf(parent, cities);

      // Padre
      drawCities(maps[0], new Set(parent), []);
      el.caps[0].textContent = t('routeParentLen', { len: fmt(lp) });
      maps[0].svg.attr('aria-label', t('routeParentSvg'));

      // Mutante
      const m = maps[1];
      const row = step.child.map((g) => (g ? g.v : null));
      const edges = [];
      for (let i = 0; i < n; i++) {
        const a = row[i];
        const b = row[(i + 1) % n];
        if (a == null || b == null || a === b) continue;
        const kk = key(a, b);
        edges.push({ id: `${i}:${kk}`, a, b, kept: pe.has(kk) });
      }
      m.gEdges.selectAll('line')
        .data(edges, (d) => d.id)
        .join('line')
        .attr('class', (d) => `route-edge ${d.kept ? 'kept' : 'new'}`)
        .attr('x1', (d) => X(cities[d.a])).attr('y1', (d) => Y(cities[d.a]))
        .attr('x2', (d) => X(cities[d.b])).attr('y2', (d) => Y(cities[d.b]));

      const placed = new Set(row.filter((v) => v != null));
      const complete = row.every((v) => v != null);
      const missing = complete ? parent.filter((g) => !placed.has(g)) : [];
      drawCities(m, placed, missing);

      let head;
      if (!complete) head = t('routeMutantBuilding');
      else if (missing.length) {
        const count = new Map();
        row.forEach((v) => count.set(v, (count.get(v) || 0) + 1));
        const rep = [...count.keys()].filter((v) => count.get(v) > 1).sort((a, b) => a - b);
        head = t('routeInvalid', { rep: rep.join(', '), miss: missing.sort((a, b) => a - b).join(', ') });
      } else {
        const lm = lengthOf(row, cities);
        const diff = lm - lp;
        const fresh = edges.filter((d) => !d.kept).length;
        head = Math.abs(diff) < 0.05
          ? t('routeMutantSame', { len: fmt(lm), k: fresh })
          : t(diff < 0 ? 'routeMutantShorter' : 'routeMutantLonger', { len: fmt(lm), d: fmt(Math.abs(diff)), k: fresh });
      }
      el.caps[1].textContent = head;
      m.svg.attr('aria-label', t('routeMutantSvg'));
    }

    function refresh() { if (current) show(current); }

    return { setProblem, show, refresh };
  }

  (root.GAX = root.GAX || {}).createRouteMaps = createRouteMaps;
})(typeof self !== 'undefined' ? self : this);
