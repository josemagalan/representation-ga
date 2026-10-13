/*
 * Vista D3 de la optimización de una función continua, común a las dos codificaciones:
 *   · el cromosoma: dos genes reales o 2k bits (k por variable), con la fila del binario cuando el
 *     código es Gray y, debajo de cada variable, lo que va saliendo de la decodificación (z y x);
 *   · el mapa de contorno de la función (más intenso cuanto más bajo), con la caja [a, b]², los
 *     mínimos globales, la rejilla de puntos representables (binaria, k ≤ 6), las rectas de la
 *     decodificación, el punto, su tratamiento si está fuera de la caja y sus vecinos a un bit;
 *   · un panel con f(x), el óptimo y, en binaria, Δ y el mejor punto representable.
 * Reales: el punto se arrastra (o se mueve con las flechas); binaria: un clic cambia un bit, y un
 * clic en el mapa lleva al punto representable más cercano.
 * Dibuja un paso de la traza de js/problems/function-real.js o function-bits.js.
 */
(function (root) {
  'use strict';

  const VW = 980;
  const LEFT = 128;
  const RIGHT = 24;
  const S = 400;            // lado del mapa
  const G = 110;            // resolución de la malla del contorno
  const LEVELS = 14;
  const SUBS = ['₁', '₂'];

  function createFunctionView(opts) {
    const d3 = root.d3;
    const Fn = root.GAX.func;
    const svg = d3.select(opts.svg);
    const t = opts.t;
    const fx = opts.fmtCoord;
    const ff = opts.fmtF;
    const mode = opts.mode;          // 'real' | 'bits'
    const isReal = mode === 'real';

    svg.attr('preserveAspectRatio', 'xMidYMin meet');
    svg.selectAll('g.layer').remove();
    const defs = svg.selectAll('defs').data([0]).join('defs');
    defs.selectAll('pattern#outHatch').data([0]).join((e) => {
      const p = e.append('pattern').attr('id', 'outHatch').attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 9).attr('height', 9).attr('patternTransform', 'rotate(45)');
      p.append('rect').attr('width', 9).attr('height', 9).attr('class', 'out-bg');
      p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 9).attr('class', 'out-line');
      return p;
    });
    defs.selectAll('marker#treatHead').data([0]).join((e) => {
      const m = e.append('marker').attr('id', 'treatHead').attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5)
        .attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto-start-reverse');
      m.append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('class', 'treat-head');
      return m;
    });
    defs.selectAll('linearGradient#fScale').data([0]).join((e) => {
      const g = e.append('linearGradient').attr('id', 'fScale');
      g.append('stop').attr('offset', '0%').attr('class', 'fscale-lo');
      g.append('stop').attr('offset', '100%').attr('class', 'fscale-hi');
      return g;
    });
    const gLabels = svg.append('g').attr('class', 'layer row-labels');
    const gChrom = svg.append('g').attr('class', 'layer genes');
    const gMap = svg.append('g').attr('class', 'layer fmap');
    const gContour = gMap.append('g').attr('class', 'contours');
    const gGrid = gMap.append('g').attr('class', 'lattice');
    const gAxes = gMap.append('g').attr('class', 'faxes');
    const gMarks = gMap.append('g').attr('class', 'fmarks');
    const hit = gMap.append('rect').attr('class', 'map-hit');
    const gPoint = gMap.append('g').attr('class', 'fpoints');
    const gPanel = svg.append('g').attr('class', 'layer fpanel');

    let fnId = 'himmelblau';
    let k = 5;
    let step = null;
    let contourKey = null;
    let geo = null;

    function setProblem(id, kk) { fnId = id; k = kk || k; }

    function domain() {
      const F = Fn.fnOf(fnId);
      const L = F.b - F.a;
      const pad = isReal ? Fn.LIMITS.margin * L : 0.035 * L;
      return [F.a - pad, F.b + pad];
    }

    function geom() {
      const top = 26;
      let chromBottom;
      let cell = 0;
      if (isReal) chromBottom = top + 70;
      else {
        const W = VW - LEFT - RIGHT - 30;
        cell = Math.min(40, Math.floor(W / (2 * k)) - 4);
        chromBottom = top + 18 + cell + (step && step.code === 'gray' ? cell + 16 : 0) + 34;
      }
      const mapTop = chromBottom + 34;
      const mapX = LEFT + 36;
      const [lo, hi] = domain();
      const sx = d3.scaleLinear().domain([lo, hi]).range([mapX, mapX + S]);
      const sy = d3.scaleLinear().domain([lo, hi]).range([mapTop + S, mapTop]);
      return { top, cell, chromBottom, mapTop, mapX, lo, hi, sx, sy, panelX: mapX + S + 54, vh: mapTop + S + 54 };
    }

    // ---------- Etiquetas de fila ----------
    function rowLabels(g) {
      const rows = [
        { key: 'rowChromosome', y: g.top + (isReal ? 34 : 18 + g.cell / 2), hide: step.stage < 3 || step.hideGenes },
        { key: 'rowLandscape', y: g.mapTop + 12 },
      ];
      if (!isReal && step.code === 'gray') rows.splice(1, 0, { key: 'rowBinary', y: g.top + 18 + g.cell + 16 + g.cell / 2, hide: step.stage < 4 || step.hideGenes });
      gLabels.selectAll('text').data(rows, (d) => d.key).join('text').attr('class', 'row-label')
        .attr('x', LEFT - 16).attr('y', (d) => d.y).attr('dy', '0.35em').attr('text-anchor', 'end')
        .attr('opacity', (d) => (d.hide ? 0 : 1)).text((d) => t(d.key));
    }

    // ---------- Cromosoma ----------
    function keyHandler(ev, d) {
      if ((ev.key === 'Enter' || ev.key === ' ') && !step.practice) { ev.preventDefault(); ev.stopPropagation(); if (opts.onBit) opts.onBit(d.j); }
    }

    function drawRealGenes(g, dur) {
      const visible = step.stage >= 3 && !step.hideGenes;
      const W = 150;
      const H = 48;
      const x0 = LEFT + 36;
      const data = step.genes.map((v, i) => {
        const F = Fn.fnOf(fnId);
        return { i, v, out: v < F.a || v > F.b };
      });
      const sel = gChrom.selectAll('g.gene').data(data, (d) => d.i).join((enter) => {
        const e = enter.append('g');
        e.append('text').attr('class', 'gene-pos');
        e.append('rect').attr('class', 'gene-rect').attr('rx', 8);
        e.append('text').attr('class', 'gene-num');
        return e;
      });
      const dimmed = (i) => step.stage === 4 && step.type !== 'decodeIntro' && i >= step.revealed;
      sel.attr('class', (d) => `gene real${d.out ? ' out' : ''}${step.focus.indexOf(d.i) !== -1 ? ' active' : ''}${dimmed(d.i) ? ' dim' : ''}`)
        .attr('aria-hidden', visible ? null : 'true');
      sel.transition().duration(dur).attr('opacity', visible ? 1 : 0);
      sel.select('.gene-pos').attr('x', (d) => x0 + d.i * (W + 24) + W / 2).attr('y', g.top - 6).attr('text-anchor', 'middle')
        .text((d) => t(d.i === 0 ? 'geneX1' : 'geneX2'));
      sel.select('.gene-rect').attr('x', (d) => x0 + d.i * (W + 24)).attr('y', g.top).attr('width', W).attr('height', H);
      sel.select('.gene-num').attr('x', (d) => x0 + d.i * (W + 24) + W / 2).attr('y', g.top + H / 2).attr('dy', '0.36em')
        .attr('text-anchor', 'middle').text((d) => fx(d.v));
      gChrom.selectAll('text.chrom-note').data(visible ? [0] : []).join('text').attr('class', 'chrom-note')
        .attr('x', x0 + 2 * (W + 24) + 6).attr('y', g.top + H / 2).attr('dy', '0.36em')
        .text(t('realNote'));
    }

    function bitX(g, j) {
      const gap = 30;
      const grp = j < k ? 0 : 1;
      return LEFT + 36 + j * (g.cell + 4) + grp * gap;
    }

    function drawBits(g, dur) {
      const visible = step.stage >= 3 && !step.hideGenes;
      const live = visible && !step.practice;   // practicando, el cromosoma no se edita
      const cliffBits = [];
      if (step.cliff) {
        const i = step.cliff.i;
        step.cliff.target.forEach((b, j) => { if (b !== step.genes[i * k + j]) cliffBits.push(i * k + j); });
      }
      const dimmed = (j) => step.stage === 4 && step.type !== 'decodeIntro' && step.type !== 'decodeDone' && step.focus.indexOf(j) === -1;
      const data = step.genes.map((b, j) => ({ id: `b${j}`, j, v: b }));
      const sel = gChrom.selectAll('g.gene.bit').data(data, (d) => d.id).join((enter) => {
        const e = enter.append('g').attr('role', 'button');
        e.append('rect').attr('class', 'gene-rect').attr('rx', 5);
        e.append('text').attr('class', 'gene-num');
        e.on('click', (ev, d) => { if (opts.onBit && !step.practice) opts.onBit(d.j); });
        e.on('keydown', keyHandler);
        return e;
      });
      sel.attr('class', (d) => {
        const c = ['gene', 'bit', 'gene-btn', d.v ? 'one' : 'zero'];
        if (cliffBits.indexOf(d.j) !== -1) c.push('cliff');
        if (step.focus.indexOf(d.j) !== -1 && step.stage === 4) c.push('active');
        if (dimmed(d.j)) c.push('dim');
        return c.join(' ');
      })
        .attr('tabindex', live ? 0 : -1)
        .attr('role', live ? 'button' : 'img')
        .attr('aria-hidden', visible ? null : 'true')
        .attr('aria-label', (d) => t(live ? 'bitGeneAria' : 'bitGeneAriaStatic', { pos: d.j + 1, b: d.v, i: d.j < k ? '₁' : '₂' }))
        .style('pointer-events', live ? null : 'none');
      sel.transition().duration(dur).attr('opacity', visible ? 1 : 0);
      const y0 = g.top + 18;
      sel.select('.gene-rect').attr('x', (d) => bitX(g, d.j)).attr('y', y0).attr('width', g.cell).attr('height', g.cell);
      sel.select('.gene-num').attr('x', (d) => bitX(g, d.j) + g.cell / 2).attr('y', y0 + g.cell / 2).attr('dy', '0.36em')
        .attr('text-anchor', 'middle').style('font-size', `${Math.min(18, g.cell * 0.55)}px`).text((d) => d.v);
      // Etiquetas de grupo (x₁, x₂) o pesos de la variable que se decodifica
      const heads = [];
      [0, 1].forEach((i) => {
        if (step.type === 'decodeInt' && step.active === i) {
          for (let j = 0; j < k; j++) heads.push({ id: `w${j}`, x: bitX(g, i * k + j) + g.cell / 2, text: String(Math.pow(2, k - 1 - j)), cls: 'bit-weight' });
        } else {
          heads.push({ id: `h${i}`, x: bitX(g, i * k) + (k * (g.cell + 4) - 4) / 2, text: t(i === 0 ? 'geneX1' : 'geneX2'), cls: 'gene-pos' });
        }
      });
      gChrom.selectAll('text.bit-head').data(visible ? heads : [], (d) => d.id).join('text')
        .attr('class', (d) => `bit-head ${d.cls}`).attr('x', (d) => d.x).attr('y', g.top + 8).attr('text-anchor', 'middle')
        .style('font-size', (d) => (d.cls === 'bit-weight' ? `${Math.min(13, g.cell * 0.42)}px` : null)).text((d) => d.text);
      // Fila del binario (Gray)
      const binY = y0 + g.cell + 16;
      const bins = [];
      if (step.code === 'gray' && step.stage >= 4 && visible) {
        [0, 1].forEach((i) => { if (step.bin[i]) step.bin[i].forEach((b, j) => bins.push({ id: `n${i}-${j}`, j: i * k + j, v: b })); });
      }
      const bsel = gChrom.selectAll('g.gene.binbit').data(bins, (d) => d.id).join((enter) => {
        const e = enter.append('g');
        e.append('rect').attr('class', 'gene-rect').attr('rx', 5);
        e.append('text').attr('class', 'gene-num');
        return e;
      });
      bsel.attr('class', (d) => `gene binbit ${d.v ? 'one' : 'zero'}${step.focus.indexOf(d.j) !== -1 && step.stage === 4 ? ' active' : ''}`);
      bsel.select('.gene-rect').attr('x', (d) => bitX(g, d.j)).attr('y', binY).attr('width', g.cell).attr('height', g.cell);
      bsel.select('.gene-num').attr('x', (d) => bitX(g, d.j) + g.cell / 2).attr('y', binY + g.cell / 2).attr('dy', '0.36em')
        .attr('text-anchor', 'middle').style('font-size', `${Math.min(18, g.cell * 0.55)}px`).text((d) => d.v);
      // Lo decodificado bajo cada variable
      const notes = [];
      const noteY = (step.code === 'gray' ? binY + g.cell : y0 + g.cell) + 22;
      [0, 1].forEach((i) => {
        if (step.z[i] == null || !visible) return;
        const xi = i < step.revealed ? Fn.scale(fnId, step.z[i], k) : null;
        notes.push({ id: `z${i}`, x: bitX(g, i * k), text: t(xi == null ? 'decodedZ' : 'decodedZX', { i: SUBS[i], z: step.z[i], x: xi == null ? '' : fx(xi) }) });
      });
      gChrom.selectAll('text.dec-note').data(notes, (d) => d.id).join('text').attr('class', 'dec-note')
        .attr('x', (d) => d.x).attr('y', noteY).text((d) => d.text);
    }

    // ---------- Mapa ----------
    function drawContours(g) {
      const key = `${fnId}:${mode}`;
      if (contourKey === key && geo && geo.mapTop === g.mapTop) return;
      contourKey = key;
      geo = { mapTop: g.mapTop };
      const F = Fn.fnOf(fnId);
      const w = (g.hi - g.lo) / G;
      const values = new Float64Array(G * G);
      let vmax = 0;
      // Himmelblau va de 0 a casi 2000 en la vista: escala logarítmica; Rastrigin, lineal (se ven las ondas)
      const tf = fnId === 'himmelblau' ? Math.log1p : (v) => v;
      for (let r = 0; r < G; r++) {
        const y = g.hi - (r + 0.5) * w;
        for (let c = 0; c < G; c++) {
          const v = tf(Math.max(0, F.f(g.lo + (c + 0.5) * w, y)));
          values[r * G + c] = v;
          if (v > vmax) vmax = v;
        }
      }
      const th = d3.range(1, LEVELS + 1).map((q) => (q / (LEVELS + 1)) * vmax);
      const polys = d3.contours().size([G, G]).thresholds(th)(values);
      const path = d3.geoPath(d3.geoIdentity().scale(S / G).translate([g.mapX, g.mapTop]));
      gContour.selectAll('rect.fbase').data([0]).join('rect').attr('class', 'fbase')
        .attr('x', g.mapX).attr('y', g.mapTop).attr('width', S).attr('height', S);
      gContour.selectAll('path.fband').data(polys).join('path').attr('class', 'fband').attr('d', path);
      // Fuera de la caja (solo reales)
      const bx = [g.sx(F.a), g.sy(F.b), g.sx(F.b) - g.sx(F.a), g.sy(F.a) - g.sy(F.b)];
      const outD = isReal ? `M${g.mapX},${g.mapTop}h${S}v${S}h${-S}z M${bx[0]},${bx[1]}v${bx[3]}h${bx[2]}v${-bx[3]}z` : '';
      gContour.selectAll('path.fout').data(isReal ? [0] : []).join('path').attr('class', 'fout').attr('d', outD).attr('fill-rule', 'evenodd');
      gContour.selectAll('rect.fbox').data([0]).join('rect').attr('class', 'fbox')
        .attr('x', bx[0]).attr('y', bx[1]).attr('width', bx[2]).attr('height', bx[3]);
      hit.attr('x', g.mapX).attr('y', g.mapTop).attr('width', S).attr('height', S);
    }

    function drawAxes(g) {
      const F = Fn.fnOf(fnId);
      const ticks = [F.a, 0, F.b];
      gAxes.selectAll('*').remove();
      const ax = gAxes.append('g').attr('class', 'axis').attr('transform', `translate(0,${g.mapTop + S})`)
        .call(d3.axisBottom(g.sx).tickValues(ticks).tickFormat((v) => fx(v)).tickSizeOuter(0));
      ax.append('text').attr('class', 'axis-label').attr('x', g.mapX + S).attr('y', 36).attr('text-anchor', 'end').text(t('axisX1'));
      const ay = gAxes.append('g').attr('class', 'axis').attr('transform', `translate(${g.mapX},0)`)
        .call(d3.axisLeft(g.sy).tickValues(ticks).tickFormat((v) => fx(v)).tickSizeOuter(0));
      ay.append('text').attr('class', 'axis-label').attr('x', -8).attr('y', g.mapTop - 10).attr('text-anchor', 'end').text(t('axisX2'));
    }

    const clampView = (g, v) => Math.max(g.lo, Math.min(g.hi, v));
    const px = (g, p) => [g.sx(clampView(g, p[0])), g.sy(clampView(g, p[1]))];

    function drawLattice(g) {
      const pts = [];
      if (!isReal && k <= 6 && (step.stage >= 3 || step.formula === 'space')) {
        const n = Math.pow(2, k);
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) pts.push([Fn.scale(fnId, a, k), Fn.scale(fnId, b, k)]);
      }
      gGrid.selectAll('circle').data(pts).join('circle').attr('class', 'lattice-pt')
        .attr('cx', (d) => g.sx(d[0])).attr('cy', (d) => g.sy(d[1])).attr('r', k <= 4 ? 2.6 : 1.7);
    }

    function decodedPoint() {
      if (isReal) return step.stage >= 3 ? step.genes.slice() : null;
      if (step.stage < 4 || step.revealed < 2) return null;
      return [Fn.scale(fnId, step.z[0], k), Fn.scale(fnId, step.z[1], k)];
    }

    function drawMarks(g) {
      const F = Fn.fnOf(fnId);
      const star = d3.symbol().type(d3.symbolStar).size(150);
      gMarks.selectAll('path.fmin').data(step.showMinima ? F.minima : []).join('path').attr('class', 'fmin')
        .attr('transform', (d) => `translate(${g.sx(d[0])},${g.sy(d[1])})`).attr('d', star);
      // Rectas de la decodificación
      const lines = [];
      if (step.stage === 4) {
        const xs = isReal ? step.genes : [0, 1].map((i) => (i < step.revealed ? Fn.scale(fnId, step.z[i], k) : null));
        const shown = isReal ? (step.type === 'decodeIntro' ? 0 : step.revealed) : step.revealed;
        if (shown >= 1 && xs[0] != null) lines.push({ id: 'v', x1: g.sx(clampView(g, xs[0])), x2: g.sx(clampView(g, xs[0])), y1: g.mapTop, y2: g.mapTop + S });
        if (shown >= 2 && xs[1] != null) lines.push({ id: 'h', x1: g.mapX, x2: g.mapX + S, y1: g.sy(clampView(g, xs[1])), y2: g.sy(clampView(g, xs[1])) });
      }
      gMarks.selectAll('line.dec-line').data(lines, (d) => d.id).join('line').attr('class', 'dec-line')
        .attr('x1', (d) => d.x1).attr('x2', (d) => d.x2).attr('y1', (d) => d.y1).attr('y2', (d) => d.y2);
      // Vecinos a un bit
      const p = decodedPoint();
      const nbs = p && step.neighbours ? step.neighbours : [];
      gMarks.selectAll('line.nb-line').data(nbs, (d) => d.bit).join('line').attr('class', 'nb-line')
        .attr('x1', g.sx(p ? p[0] : 0)).attr('y1', g.sy(p ? p[1] : 0)).attr('x2', (d) => g.sx(d.point[0])).attr('y2', (d) => g.sy(d.point[1]));
      gMarks.selectAll('circle.nb-pt').data(nbs, (d) => d.bit).join('circle').attr('class', 'nb-pt')
        .attr('cx', (d) => g.sx(d.point[0])).attr('cy', (d) => g.sy(d.point[1])).attr('r', 4.5);
      // Vecino de la rejilla al que se quiere pasar (salto de Hamming)
      const tgt = [];
      if (p && step.cliff) {
        const q = p.slice();
        q[step.cliff.i] = Fn.scale(fnId, step.cliff.z2, k);
        tgt.push(q);
      }
      gMarks.selectAll('circle.ftarget').data(tgt).join('circle').attr('class', 'ftarget')
        .attr('cx', (d) => g.sx(d[0])).attr('cy', (d) => g.sy(d[1])).attr('r', 9);
      // Mejor punto representable
      const best = step.showBest && opts.best ? [opts.best().point] : [];
      gMarks.selectAll('circle.fbest').data(best).join('circle').attr('class', 'fbest')
        .attr('cx', (d) => g.sx(d[0])).attr('cy', (d) => g.sy(d[1])).attr('r', 11);
    }

    function drawPoint(g) {
      const p = decodedPoint();
      const F = Fn.fnOf(fnId);
      const out = p && (p[0] < F.a || p[0] > F.b || p[1] < F.a || p[1] > F.b);
      const tr = step.treated && p ? step.treated : null;
      const arrows = tr ? [{ from: px(g, p), to: px(g, tr.point) }] : [];
      gPoint.selectAll('line.ftreat').data(arrows).join('line').attr('class', 'ftreat').attr('marker-end', 'url(#treatHead)')
        .attr('x1', (d) => d.from[0]).attr('y1', (d) => d.from[1])
        .attr('x2', (d) => d.to[0]).attr('y2', (d) => d.to[1]);
      gPoint.selectAll('circle.fpoint-treated').data(tr ? [tr.point] : []).join('circle').attr('class', 'fpoint-treated')
        .attr('cx', (d) => px(g, d)[0]).attr('cy', (d) => px(g, d)[1]).attr('r', 8);
      const sel = gPoint.selectAll('g.fpoint').data(p ? [p] : []).join((enter) => {
        const e = enter.append('g').attr('class', 'fpoint');
        e.append('circle').attr('class', 'fpoint-halo').attr('r', 15);
        e.append('circle').attr('class', 'fpoint-dot').attr('r', 8);
        if (isReal) {
          e.attr('tabindex', 0).attr('role', 'button');
          e.on('keydown', (ev) => {
            const dlt = ev.shiftKey ? 1 : 0.1;
            const mv = { ArrowLeft: [-dlt, 0], ArrowRight: [dlt, 0], ArrowUp: [0, dlt], ArrowDown: [0, -dlt] }[ev.key];
            if (!mv || step.practice) return;
            ev.preventDefault();
            ev.stopPropagation();
            opts.onNudge(mv[0], mv[1]);
          });
        }
        return e;
      });
      sel.classed('out', !!out).classed('draggable', isReal)
        .attr('transform', (d) => `translate(${px(g, d)[0]},${px(g, d)[1]})`)
        .attr('aria-label', (d) => t(!isReal ? 'pointAriaBits' : (step.practice ? 'pointAriaStatic' : 'pointAria'), { x1: fx(d[0]), x2: fx(d[1]) }));
    }

    function drawPanel(g) {
      const x = g.panelX;
      const lines = [];
      const p = decodedPoint();
      const done = step.stage >= 5 || step.type === 'decodeDone' || (isReal && step.stage >= 3);
      if (p && done && !step.practice) {
        lines.push({ cls: 'fp-main', text: t('panelPoint', { x1: fx(p[0]), x2: fx(p[1]) }) });
        lines.push({ cls: 'fp-main', text: t('panelF', { v: ff(Fn.evalAt(fnId, p)) }) });
      }
      if (step.showMinima || step.stage >= 5) lines.push({ cls: 'fp-opt', text: t('panelOpt', { v: ff(Fn.fnOf(fnId).fmin) }) });
      if (!isReal && (step.stage >= 3 || step.formula === 'space')) {
        lines.push({ cls: '', text: t('panelDelta', { k, v: fx(Fn.delta(fnId, k)) }) });
        if (step.stage >= 5 && opts.best) lines.push({ cls: 'fp-best', text: t('panelBest', { v: ff(opts.best().f) }) });
      }
      if (isReal && step.treated && !step.practice) lines.push({ cls: '', text: t('panelEval', { x1: fx(step.treated.point[0]), x2: fx(step.treated.point[1]) }) });
      if (step.result && !step.practice) lines.push({ cls: 'fp-fit', text: t('sumFitnessMin', { fitness: ff(step.result.fitness) }) });
      gPanel.selectAll('text.fp').data(lines).join('text').attr('class', (d) => `fp summary ${d.cls}`)
        .attr('x', x).attr('y', (d, i) => g.mapTop + 18 + i * 30).text((d) => d.text);
      // Escala de colores
      const ly = g.mapTop + S - 40;
      const items = [{ id: 'bar' }];
      const sc = gPanel.selectAll('g.fscale').data(items).join((e) => {
        const gg = e.append('g').attr('class', 'fscale');
        gg.append('text').attr('class', 'fscale-title');
        gg.append('rect').attr('class', 'fscale-bar').attr('rx', 4);
        gg.append('text').attr('class', 'fscale-lab lo');
        gg.append('text').attr('class', 'fscale-lab hi').attr('text-anchor', 'end');
        return gg;
      });
      sc.select('.fscale-title').attr('x', x).attr('y', ly - 10).text(t('scaleTitle'));
      sc.select('.fscale-bar').attr('x', x).attr('y', ly).attr('width', 220).attr('height', 14);
      sc.select('.fscale-lab.lo').attr('x', x).attr('y', ly + 32).text(t('scaleLow'));
      sc.select('.fscale-lab.hi').attr('x', x + 220).attr('y', ly + 32).text(t('scaleHigh'));
    }

    // ---------- Interacción con el mapa ----------
    function mapPoint(ev) {
      const g = geom();
      const [mx, my] = d3.pointer(ev, opts.svg);
      return [clampView(g, g.sx.invert(mx)), clampView(g, g.sy.invert(my))];
    }
    const editable = () => step && step.stage >= 3 && !step.practice;
    hit.on('click', (ev) => { if (editable()) opts.onMap(mapPoint(ev), 'click'); });
    if (isReal) {
      const drag = d3.drag()
        .filter((ev) => editable() && !ev.button)
        .on('start drag', (ev) => opts.onMap(mapPoint(ev.sourceEvent), 'drag'))
        .on('end', () => { if (opts.onDragEnd) opts.onDragEnd(); });
      gPoint.call(drag);
      hit.call(drag);
    }

    function show(next, o) {
      step = next;
      const dur = o && o.animate ? (o.duration || 320) : 0;
      const g = geom();
      svg.attr('viewBox', `0 0 ${VW} ${g.vh}`);
      if (geo && geo.mapTop !== g.mapTop) contourKey = null;
      rowLabels(g);
      if (isReal) drawRealGenes(g, dur); else drawBits(g, dur);
      drawContours(g);
      drawAxes(g);
      drawLattice(g);
      drawMarks(g);
      drawPoint(g);
      drawPanel(g);
      hit.classed('active', editable()).style('cursor', editable() ? (isReal ? 'crosshair' : 'pointer') : null);
      gPoint.selectAll('g.fpoint').attr('tabindex', isReal && !step.practice ? 0 : null).attr('role', isReal && !step.practice ? 'button' : 'img')
        .classed('draggable', isReal && !step.practice);
    }

    return { setProblem, show, refreshLabels: () => { contourKey = null; if (step) show(step); } };
  }

  (root.GAX = root.GAX || {}).createFunctionView = createFunctionView;
})(typeof self !== 'undefined' ? self : this);
