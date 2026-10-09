/*
 * Vista D3 de la mochila: los objetos (peso w y valor v), el cromosoma (un gen por objeto, que se
 * puede pulsar para cambiarlo) y la mochila como una barra de capacidad donde se van apilando los
 * objetos que entran; lo que se pasa de W se marca como exceso.
 * Dibuja un paso de la traza de js/problems/knapsack-bits.js.
 */
(function (root) {
  'use strict';

  const VW = 980;
  const LEFT = 128;
  const RIGHT = 24;
  const Y = { items: 14, itemH: 84, genes: 124, bag: 214, bagH: 42, summary: 290 };
  const VH = 312;

  function createKnapsackView(opts) {
    const d3 = root.d3;
    const svg = d3.select(opts.svg);
    const t = opts.t;              // (key, params) => texto
    const fmt = opts.fmt;          // número → texto en el idioma actual
    const onToggle = opts.onToggle;

    svg.attr('viewBox', `0 0 ${VW} ${VH}`).attr('preserveAspectRatio', 'xMidYMin meet');
    svg.selectAll('g.layer').remove();
    const defs = svg.selectAll('defs').data([0]).join('defs');
    defs.selectAll('pattern#excessHatch').data([0]).join((e) => {
      const p = e.append('pattern').attr('id', 'excessHatch').attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 8).attr('height', 8).attr('patternTransform', 'rotate(45)');
      p.append('rect').attr('width', 8).attr('height', 8).attr('class', 'excess-bg');
      p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 8).attr('class', 'excess-line');
      return p;
    });
    const gLabels = svg.append('g').attr('class', 'layer row-labels');
    const gItems = svg.append('g').attr('class', 'layer items');
    const gGenes = svg.append('g').attr('class', 'layer genes');
    const gBag = svg.append('g').attr('class', 'layer bag');
    const gSummary = svg.append('g').attr('class', 'layer summary');

    let inst = null;
    let step = null;

    function geom() {
      const n = inst.weights.length;
      const col = Math.min(74, (VW - LEFT - RIGHT) / n);
      const card = col - 10;
      const gene = Math.min(46, col - 14);
      const x = (i) => LEFT + i * col + col / 2;
      const total = Math.max(inst.weights.reduce((a, b) => a + b, 0), inst.capacity);
      const unit = (VW - LEFT - RIGHT) / total;
      return { n, col, card, gene, x, unit };
    }

    function setProblem(next) { inst = next; }

    function rowLabels() {
      const rows = [
        { key: 'rowItems', y: Y.items + Y.itemH / 2 },
        { key: 'rowChromosome', y: Y.genes + 23, hide: !step || step.stage < 3 },
        { key: 'rowKnapsack', y: Y.bag + Y.bagH / 2 },
      ];
      gLabels.selectAll('text').data(rows).join('text')
        .attr('class', 'row-label').attr('x', LEFT - 16).attr('y', (d) => d.y).attr('dy', '0.35em')
        .attr('text-anchor', 'end').attr('opacity', (d) => (d.hide ? 0 : 1)).text((d) => t(d.key));
    }

    function itemClass(i) {
      const c = ['item'];
      if (step.bag.indexOf(i) !== -1) c.push('in');
      if (step.removed.indexOf(i) !== -1) c.push('removed');
      if (step.skipped.indexOf(i) !== -1) c.push('skipped');
      if (step.focus.indexOf(i) !== -1) c.push('focus');
      if (step.stage >= 4 && i >= step.revealed && !(step.stage === 5)) c.push('pending');
      return c.join(' ');
    }

    function drawItems(dur) {
      const g = geom();
      const data = inst.weights.map((w, i) => ({ i, w, v: inst.values[i] }));
      const sel = gItems.selectAll('g.item').data(data, (d) => d.i).join((enter) => {
        const e = enter.append('g');
        e.append('rect').attr('class', 'item-rect').attr('rx', 9);
        e.append('text').attr('class', 'item-idx');
        e.append('text').attr('class', 'item-w');
        e.append('text').attr('class', 'item-v');
        e.append('text').attr('class', 'item-tag');
        return e;
      });
      sel.attr('class', (d) => itemClass(d.i));
      sel.select('.item-rect').transition().duration(dur)
        .attr('x', (d) => g.x(d.i) - g.card / 2).attr('y', Y.items).attr('width', g.card).attr('height', Y.itemH);
      sel.select('.item-idx').attr('x', (d) => g.x(d.i)).attr('y', Y.items + 18).attr('text-anchor', 'middle').text((d) => d.i + 1);
      sel.select('.item-w').attr('x', (d) => g.x(d.i)).attr('y', Y.items + 44).attr('text-anchor', 'middle').text((d) => `w ${d.w}`);
      sel.select('.item-v').attr('x', (d) => g.x(d.i)).attr('y', Y.items + 68).attr('text-anchor', 'middle').text((d) => `v ${d.v}`);
      sel.select('.item-tag').attr('x', (d) => g.x(d.i)).attr('y', Y.items + Y.itemH + 14).attr('text-anchor', 'middle')
        .text((d) => (step.skipped.indexOf(d.i) !== -1 ? t('tagSkipped') : step.removed.indexOf(d.i) !== -1 ? t('tagRemoved') : ''));
    }

    function drawGenes(dur) {
      const g = geom();
      const visible = step.stage >= 3;
      const data = step.genes.map((b, i) => ({ i, b }));
      const sel = gGenes.selectAll('g.gene').data(data, (d) => d.i).join((enter) => {
        const e = enter.append('g').attr('class', 'gene').attr('role', 'button').attr('tabindex', 0);
        e.append('rect').attr('class', 'gene-rect').attr('rx', 8);
        e.append('text').attr('class', 'gene-num');
        e.on('click', (ev, d) => onToggle(d.i));
        e.on('keydown', (ev, d) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); onToggle(d.i); }
        });
        return e;
      });
      sel.attr('class', (d) => {
        const c = ['gene', 'gene-btn', d.b ? 'one' : 'zero'];
        if (step.changed.indexOf(d.i) !== -1) c.push('changed');
        if (step.focus.indexOf(d.i) !== -1) c.push('active');
        if (step.stage === 4 && d.i >= step.revealed && step.type !== 'decodeIntro') c.push('dim');
        return c.join(' ');
      })
        .attr('tabindex', visible ? 0 : -1)
        .attr('aria-hidden', visible ? null : 'true')
        .attr('aria-label', (d) => t('geneAria', { pos: d.i + 1, b: d.b }))
        .style('pointer-events', visible ? null : 'none');
      sel.transition().duration(dur).attr('opacity', visible ? 1 : 0);
      sel.select('.gene-rect').attr('x', (d) => g.x(d.i) - g.gene / 2).attr('y', Y.genes).attr('width', g.gene).attr('height', g.gene);
      sel.select('.gene-num').attr('x', (d) => g.x(d.i)).attr('y', Y.genes + g.gene / 2).attr('dy', '0.36em')
        .attr('text-anchor', 'middle').text((d) => d.b);
    }

    function drawBag(dur) {
      const g = geom();
      const W = inst.capacity;
      const x0 = LEFT;
      const capX = x0 + W * g.unit;
      // Capacidad: la zona útil de la mochila
      gBag.selectAll('rect.bag-track').data([0]).join('rect').attr('class', 'bag-track')
        .attr('x', x0).attr('y', Y.bag).attr('height', Y.bagH).attr('rx', 6)
        .transition().duration(dur).attr('width', W * g.unit);
      // Objetos dentro, apilados en el orden en que entran
      let acc = 0;
      const segs = step.bag.map((i) => { const s = { i, x: x0 + acc * g.unit, w: inst.weights[i] * g.unit }; acc += inst.weights[i]; return s; });
      const sel = gBag.selectAll('g.seg').data(segs, (d) => d.i).join((enter) => {
        const e = enter.append('g').attr('class', 'seg');
        e.append('rect').attr('class', 'seg-rect').attr('y', Y.bag + 3).attr('height', Y.bagH - 6).attr('rx', 4)
          .attr('x', (d) => d.x).attr('width', 0);
        e.append('text').attr('class', 'seg-label').attr('y', Y.bag + Y.bagH / 2).attr('dy', '0.36em').attr('text-anchor', 'middle');
        return e;
      });
      sel.classed('focus', (d) => step.focus.indexOf(d.i) !== -1);
      sel.select('.seg-rect').transition().duration(dur).attr('x', (d) => d.x + 1).attr('width', (d) => Math.max(0, d.w - 2));
      sel.select('.seg-label').attr('x', (d) => d.x + d.w / 2).text((d) => (d.w >= 18 ? d.i + 1 : ''));
      // Exceso por encima de W
      const over = Math.max(0, acc - W);
      gBag.selectAll('rect.excess').data([0]).join('rect').attr('class', 'excess')
        .attr('y', Y.bag - 4).attr('height', Y.bagH + 8).attr('rx', 4).attr('x', capX)
        .transition().duration(dur).attr('width', over * g.unit).attr('opacity', over > 0 ? 1 : 0);
      // Marca de la capacidad
      const cap = gBag.selectAll('g.cap').data([0]).join((e) => {
        const c = e.append('g').attr('class', 'cap');
        c.append('line').attr('class', 'cap-line');
        c.append('text').attr('class', 'cap-label').attr('text-anchor', 'middle');
        return c;
      });
      cap.select('.cap-line').attr('x1', capX).attr('x2', capX).attr('y1', Y.bag - 12).attr('y2', Y.bag + Y.bagH + 8);
      cap.select('.cap-label').attr('x', capX).attr('y', Y.bag - 17).text(`W = ${W}`);
    }

    function drawSummary() {
      const showNumbers = step.stage >= 4;
      const parts = [];
      if (showNumbers) {
        parts.push({ cls: step.weight > inst.capacity ? 'sum-over' : 'sum-ok', text: t('sumWeight', { weight: step.weight, W: inst.capacity }) });
        parts.push({ cls: '', text: t('sumValue', { value: step.value }) });
        if (step.result) parts.push({ cls: 'sum-fit', text: t('sumFitness', { fitness: fmt(step.result.fitness) }) });
      }
      const text = gSummary.selectAll('text').data([0]).join('text').attr('class', 'summary').attr('x', LEFT).attr('y', Y.summary);
      text.selectAll('tspan').data(parts).join('tspan').attr('class', (d) => d.cls)
        .text((d, k) => (k ? '   ·   ' : '') + d.text);
    }

    function show(next, o) {
      step = next;
      const dur = o && o.animate ? (o.duration || 320) : 0;
      rowLabels();
      drawItems(dur);
      drawGenes(dur);
      drawBag(dur);
      drawSummary();
    }

    return { setProblem, show, refreshLabels: () => { if (step) show(step); } };
  }

  (root.GAX = root.GAX || {}).createKnapsackView = createKnapsackView;
})(typeof self !== 'undefined' ? self : this);
