/*
 * Vista D3 del viajante: el cromosoma (un gen por lugar de la secuencia; dos clics intercambian
 * dos genes), el mapa de ciudades donde se va dibujando el circuito al decodificar, y un resumen
 * con la longitud recorrida y la del óptimo. Dibuja un paso de la traza de js/problems/tsp-perm.js.
 */
(function (root) {
  'use strict';

  const VW = 980;
  const LEFT = 128;
  const RIGHT = 24;
  const Y = { pos: 16, genes: 26, map: 104 };
  const MAP = 340;
  const VH = Y.map + MAP + 10;

  function createTspView(opts) {
    const d3 = root.d3;
    const svg = d3.select(opts.svg);
    const t = opts.t;
    const fmt = opts.fmt;
    const onSwap = opts.onSwap;

    svg.attr('viewBox', `0 0 ${VW} ${VH}`).attr('preserveAspectRatio', 'xMidYMin meet');
    svg.selectAll('g.layer').remove();
    const gLabels = svg.append('g').attr('class', 'layer row-labels');
    const gGenes = svg.append('g').attr('class', 'layer genes');
    const gMapBg = svg.append('g').attr('class', 'layer map-bg');
    const gOpt = svg.append('g').attr('class', 'layer route-opt');
    const gEdges = svg.append('g').attr('class', 'layer route-edges');
    const gCities = svg.append('g').attr('class', 'layer route-cities');
    const gSummary = svg.append('g').attr('class', 'layer summary');

    let inst = null;
    let optTour = null;
    let step = null;
    let picked = null;

    const MX = (c) => LEFT + 14 + (c[0] / 100) * (MAP - 28);
    const MY = (c) => Y.map + 14 + (c[1] / 100) * (MAP - 28);
    const at = (city) => inst.coords[city - 1];

    function setProblem(next, opt) { inst = next; optTour = opt; picked = null; }

    function geom() {
      const n = inst.coords.length;
      const col = Math.min(74, (VW - LEFT - RIGHT) / n);
      const gene = Math.min(50, col - 12);
      return { n, col, gene, x: (i) => LEFT + i * col + col / 2 };
    }

    function rowLabels() {
      const rows = [
        { key: 'rowChromosome', y: Y.genes + 25, hide: step.stage < 3 || step.hideGenes },
        { key: 'rowMap', y: Y.map + 18 },
      ];
      gLabels.selectAll('text').data(rows).join('text').attr('class', 'row-label')
        .attr('x', LEFT - 16).attr('y', (d) => d.y).attr('dy', '0.35em').attr('text-anchor', 'end')
        .attr('opacity', (d) => (d.hide ? 0 : 1)).text((d) => t(d.key));
    }

    function drawGenes(dur) {
      const g = geom();
      const visible = step.stage >= 3 && !step.hideGenes;
      const live = visible && !step.practice;   // practicando, el cromosoma no se edita
      const seen = new Map();
      const data = step.genes.map((c, i) => {
        const rep = seen.has(c);
        seen.set(c, true);
        return { i, c, rep };
      });
      const sel = gGenes.selectAll('g.gene').data(data, (d) => d.i).join((enter) => {
        const e = enter.append('g').attr('role', 'button');
        e.append('text').attr('class', 'gene-pos');
        e.append('rect').attr('class', 'gene-rect').attr('rx', 8);
        e.append('text').attr('class', 'gene-num');
        e.on('click', (ev, d) => pick(d.i));
        e.on('keydown', (ev, d) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); pick(d.i); }
        });
        return e;
      });
      sel.attr('class', (d) => {
        const c = ['gene', 'gene-btn', 'perm'];
        if (d.rep && (step.stage < 4 || d.i < step.revealed)) c.push('repeat');
        if (step.changed.indexOf(d.i) !== -1) c.push('changed');
        if (step.focus.indexOf(d.i) !== -1) c.push('active');
        if (picked === d.i) c.push('picked');
        if (step.stage === 4 && d.i >= step.revealed && step.type !== 'decodeIntro') c.push('dim');
        return c.join(' ');
      })
        .attr('tabindex', live ? 0 : -1)
        .attr('role', live ? 'button' : 'img')
        .attr('aria-hidden', visible ? null : 'true')
        .attr('aria-pressed', (d) => (live ? (picked === d.i ? 'true' : 'false') : null))
        .attr('aria-label', (d) => t(live ? 'permGeneAria' : 'permGeneAriaStatic', { pos: d.i + 1, city: d.c }))
        .style('pointer-events', live ? null : 'none');
      sel.transition().duration(dur).attr('opacity', visible ? 1 : 0);
      sel.select('.gene-pos').attr('x', (d) => g.x(d.i)).attr('y', Y.pos).attr('text-anchor', 'middle').text((d) => d.i + 1);
      sel.select('.gene-rect').attr('x', (d) => g.x(d.i) - g.gene / 2).attr('y', Y.genes).attr('width', g.gene).attr('height', g.gene);
      sel.select('.gene-num').attr('x', (d) => g.x(d.i)).attr('y', Y.genes + g.gene / 2).attr('dy', '0.36em')
        .attr('text-anchor', 'middle').text((d) => d.c);
    }

    function pick(i) {
      if (step.practice) return;
      if (picked === null) { picked = i; show(step); return; }
      const a = picked;
      picked = null;
      if (a === i) { show(step); return; }
      onSwap(a, i);
    }

    function drawMap(dur) {
      gMapBg.selectAll('rect').data([0]).join('rect').attr('class', 'map-bg-rect')
        .attr('x', LEFT).attr('y', Y.map).attr('width', MAP).attr('height', MAP).attr('rx', 12);
      // Óptimo, discontinuo
      const showOpt = step.showOpt && optTour;
      gOpt.selectAll('polygon').data(showOpt ? [optTour] : []).join('polygon').attr('class', 'route-optimal')
        .attr('points', (tour) => tour.map((c) => `${MX(at(c))},${MY(at(c))}`).join(' '));
      // Tramos del circuito decodificado hasta ahora
      const genes = step.genes;
      const n = genes.length;
      const k = step.stage >= 4 ? step.revealed : 0;
      const edges = [];
      const seen = new Set(k ? [genes[0]] : []);
      for (let i = 1; i < k; i++) {
        edges.push({ id: `e${i}`, a: genes[i - 1], b: genes[i], kind: seen.has(genes[i]) ? 'repeat' : 'go', focus: step.focus.indexOf(i) !== -1 && step.stage === 4 });
        seen.add(genes[i]);
      }
      if (step.closed && step.stage >= 4) edges.push({ id: 'close', a: genes[n - 1], b: genes[0], kind: 'close', focus: step.type === 'decodeClose' });
      gEdges.selectAll('line.route-edge').data(edges, (d) => `${d.id}:${d.a}-${d.b}`).join(
        (enter) => enter.append('line')
          .attr('x1', (d) => MX(at(d.a))).attr('y1', (d) => MY(at(d.a)))
          .attr('x2', (d) => MX(at(d.a))).attr('y2', (d) => MY(at(d.a)))
          .call((e) => e.transition().duration(dur).attr('x2', (d) => MX(at(d.b))).attr('y2', (d) => MY(at(d.b)))),
        (update) => update.attr('x1', (d) => MX(at(d.a))).attr('y1', (d) => MY(at(d.a))).attr('x2', (d) => MX(at(d.b))).attr('y2', (d) => MY(at(d.b))),
      ).attr('class', (d) => `route-edge tour-${d.kind}${d.focus ? ' focus' : ''}`);
      // Ciudades
      const visited = new Map();
      for (let i = 0; i < k; i++) visited.set(genes[i], (visited.get(genes[i]) || 0) + 1);
      const ended = step.closed && step.stage >= 4;
      const cities = inst.coords.map((_, i) => i + 1);
      const sel = gCities.selectAll('g.city').data(cities, (c) => c).join((enter) => {
        const e = enter.append('g').attr('class', 'city');
        e.append('circle').attr('r', 13);
        e.append('text').attr('dy', '0.35em');
        e.on('click', (ev, c) => { if (step.pickCities && opts.onCity) opts.onCity(c); });
        e.on('keydown', (ev, c) => {
          if ((ev.key === 'Enter' || ev.key === ' ') && step.pickCities && opts.onCity) { ev.preventDefault(); ev.stopPropagation(); opts.onCity(c); }
        });
        return e;
      });
      const pickable = !!step.pickCities;
      const route = step.userRoute || [];
      sel.attr('tabindex', pickable ? 0 : null).attr('role', pickable ? 'button' : null)
        .attr('aria-label', (c) => (pickable ? t('cityPickAria', { city: c }) : null))
        .classed('pickable', pickable)
        .classed('user-visited', (c) => route.indexOf(c) !== -1);
      sel.attr('transform', (c) => `translate(${MX(at(c))},${MY(at(c))})`)
        .attr('class', (c) => {
          const cls = ['city', 'big'];
          if (visited.get(c)) cls.push('visited');
          if (visited.get(c) > 1) cls.push('repeated');
          if (ended && !visited.get(c)) cls.push('missing');
          if (step.stage >= 4 && k && c === genes[0]) cls.push('start');
          return cls.join(' ');
        });
      sel.select('text').text((c) => c);
      // Circuito que marca el estudiante al practicar (ciudad a ciudad; se cierra al completarlo)
      const user = [];
      for (let i = 1; i < route.length; i++) user.push({ id: `u${i}`, a: route[i - 1], b: route[i] });
      if (route.length === n && n > 1) user.push({ id: 'uclose', a: route[n - 1], b: route[0], close: true });
      gEdges.selectAll('line.user-edge').data(user, (d) => `${d.id}:${d.a}-${d.b}`).join('line')
        .attr('class', (d) => `user-edge${d.close ? ' close' : ''}`)
        .attr('x1', (d) => MX(at(d.a))).attr('y1', (d) => MY(at(d.a))).attr('x2', (d) => MX(at(d.b))).attr('y2', (d) => MY(at(d.b)));
    }

    function drawSummary() {
      const x0 = LEFT + MAP + 36;
      const lines = [];
      if (step.practice) {
        gSummary.selectAll('text').remove();
        return;
      }
      if (step.stage >= 4) lines.push({ cls: 'sum-main', text: t('tourSoFar', { len: fmt(Math.round(step.length * 10) / 10) }) });
      if (step.stage >= 2 && step.showOpt) lines.push({ cls: 'sum-opt', text: t('tourOptimal', { len: fmt(Math.round(opts.optimumLength() * 10) / 10) }) });
      if (step.result) lines.push({ cls: 'sum-fit', text: t('tourFitness', { len: fmt(Math.round(step.result.fitness * 10) / 10) }) });
      gSummary.selectAll('text').data(lines).join('text').attr('class', (d) => `summary ${d.cls}`)
        .attr('x', x0).attr('y', (d, i) => Y.map + 30 + i * 30).text((d) => d.text);
    }

    function show(next, o) {
      step = next;
      const dur = o && o.animate ? (o.duration || 320) : 0;
      rowLabels();
      drawGenes(dur);
      drawMap(dur);
      drawSummary();
    }

    return { setProblem, show, refreshLabels: () => { if (step) show(step); }, clearPick: () => { picked = null; } };
  }

  (root.GAX = root.GAX || {}).createTspView = createTspView;
})(typeof self !== 'undefined' ? self : this);
