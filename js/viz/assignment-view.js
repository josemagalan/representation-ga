/*
 * Vista D3 de la asignación de tareas a máquinas, común a las dos codificaciones:
 *   · la tabla de tiempos pᵢⱼ (columnas: tareas; filas: máquinas), con la casilla elegida resaltada;
 *   · el cromosoma, alineado con la tabla: un gen por tarea (vector de enteros; un clic pasa la
 *     tarea a la máquina siguiente) o un bit por casilla (matriz binaria; un clic cambia el bit);
 *   · el plan de trabajo como diagrama de Gantt, una calle por máquina, con el makespan y el óptimo.
 * Dibuja un paso de la traza de js/problems/assignment-int.js o assignment-matrix.js.
 */
(function (root) {
  'use strict';

  const VW = 980;
  const LEFT = 128;
  const RIGHT = 24;
  const LAB = 44;          // columna de las etiquetas de máquina (M1, M2…)
  const CELL = 30;
  const LANE = 32;

  function createAssignmentView(opts) {
    const d3 = root.d3;
    const svg = d3.select(opts.svg);
    const t = opts.t;
    const fmt = opts.fmt;
    const mode = opts.mode;            // 'int' | 'matrix'
    const onGene = opts.onGene;        // (i) para el vector, (i, j) para la matriz

    svg.attr('preserveAspectRatio', 'xMidYMin meet');
    svg.selectAll('g.layer').remove();
    const defs = svg.selectAll('defs').data([0]).join('defs');
    defs.selectAll('pattern#dupHatch').data([0]).join((e) => {
      const p = e.append('pattern').attr('id', 'dupHatch').attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 8).attr('height', 8).attr('patternTransform', 'rotate(45)');
      p.append('rect').attr('width', 8).attr('height', 8).attr('class', 'dup-bg');
      p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 8).attr('class', 'dup-line');
      return p;
    });
    const gLabels = svg.append('g').attr('class', 'layer row-labels');
    const gTable = svg.append('g').attr('class', 'layer ptable');
    const gChrom = svg.append('g').attr('class', 'layer genes');
    const gGantt = svg.append('g').attr('class', 'layer gantt');
    const gSummary = svg.append('g').attr('class', 'layer summary');

    let inst = null;
    let opt = null;
    let scaleMax = 1;
    let step = null;

    function setProblem(next, optimum, maxT) { inst = next; opt = optimum; scaleMax = Math.max(1, maxT || 1); }

    function geom() {
      const n = inst.p.length;
      const m = inst.p[0].length;
      const x0 = LEFT + LAB;
      const col = Math.min(86, (VW - x0 - RIGHT) / n);
      const cx = (i) => x0 + i * col + col / 2;
      const head = 10;
      const tableTop = head + 22;
      const chromTop = tableTop + m * CELL + 26;
      const chromH = mode === 'int' ? 44 : m * CELL;
      const ganttTop = chromTop + chromH + 40;
      const ganttBottom = ganttTop + m * LANE;
      const summaryY = ganttBottom + 46;
      const unit = (VW - x0 - RIGHT - 60) / scaleMax;
      return { n, m, x0, col, cx, head, tableTop, chromTop, chromH, ganttTop, ganttBottom, summaryY, unit, vh: summaryY + 14 };
    }

    // Asignación que se ve en el paso: máquinas (1…m) de cada tarea
    const machinesOf = (i) => (mode === 'int' ? [step.genes[i]] : step.genes[i].map((b, j) => (b ? j + 1 : 0)).filter(Boolean));
    const hasCell = (list, i, j) => list.some((c) => c[0] === i && c[1] === j);

    function rowLabels(g) {
      const rows = [
        { key: 'rowTimes', y: g.tableTop + CELL / 2 },
        { key: 'rowChromosome', y: g.chromTop + (mode === 'int' ? 22 : CELL / 2), hide: step.stage < 3 || step.hideGenes },
        { key: 'rowPlan', y: g.ganttTop + LANE / 2 },
      ];
      gLabels.selectAll('text').data(rows).join('text').attr('class', 'row-label')
        .attr('x', LEFT - 16).attr('y', (d) => d.y).attr('dy', '0.35em').attr('text-anchor', 'end')
        .attr('opacity', (d) => (d.hide ? 0 : 1)).text((d) => t(d.key));
    }

    function machineLabels(sel, g, top, h, show) {
      sel.selectAll('text.mach-label').data(d3.range(g.m)).join('text').attr('class', 'mach-label')
        .attr('x', g.x0 - 10).attr('y', (j) => top + j * h + h / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
        .attr('opacity', show ? 1 : 0).text((j) => t('machineShort', { j: j + 1 }));
    }

    function drawTable(g) {
      const showPick = step.stage >= 3;
      const ended = step.stage >= 5 || (step.stage === 4 && step.revealed === g.n && step.type === 'decodeDone');
      // Cabecera: tareas (y aviso de las que, leídas tal cual, no se hacen o se hacen varias veces)
      const heads = d3.range(g.n).map((i) => {
        const k = showPick ? machinesOf(i).length : 1;
        const seen = step.stage >= 3 && (step.stage === 3 || i < step.revealed || ended);
        return { i, bad: mode === 'matrix' && seen && k !== 1 && !step.practice, focus: step.focus.indexOf(i) !== -1 };
      });
      gTable.selectAll('text.task-head').data(heads).join('text')
        .attr('class', (d) => `task-head${d.bad ? ' bad' : ''}${d.focus ? ' focus' : ''}`)
        .attr('x', (d) => g.cx(d.i)).attr('y', g.head + 8).attr('text-anchor', 'middle')
        .text((d) => t('taskShort', { i: d.i + 1 }));
      machineLabels(gTable, g, g.tableTop, CELL, true);
      const cells = [];
      for (let i = 0; i < g.n; i++) {
        const mins = Math.min(...inst.p[i]);
        for (let j = 1; j <= g.m; j++) cells.push({ i, j, p: inst.p[i][j - 1], fast: inst.p[i][j - 1] === mins });
      }
      const sel = gTable.selectAll('g.pcell').data(cells, (d) => `${d.i}-${d.j}`).join((enter) => {
        const e = enter.append('g');
        e.append('rect').attr('rx', 6);
        e.append('text').attr('dy', '0.36em').attr('text-anchor', 'middle');
        return e;
      });
      sel.attr('class', (d) => {
        const c = ['pcell'];
        if (showPick && machinesOf(d.i).indexOf(d.j) !== -1) c.push('chosen');
        if (hasCell(step.cells, d.i, d.j)) c.push('focus');
        if (d.fast) c.push('fast');
        return c.join(' ');
      });
      sel.select('rect').attr('x', (d) => g.cx(d.i) - (g.col - 8) / 2).attr('y', (d) => g.tableTop + (d.j - 1) * CELL + 2)
        .attr('width', g.col - 8).attr('height', CELL - 4);
      sel.select('text').attr('x', (d) => g.cx(d.i)).attr('y', (d) => g.tableTop + (d.j - 1) * CELL + CELL / 2).text((d) => d.p);
    }

    function keyHandler(ev, d) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); click(d); }
    }
    function click(d) {
      if (step.practice) return;   // practicando, el cromosoma no se edita
      if (mode === 'int') onGene(d.i); else onGene(d.i, d.j);
    }

    function drawChromosome(g, dur) {
      const visible = step.stage >= 3 && !step.hideGenes;
      const live = visible && !step.practice;
      const dimmed = (i) => step.stage === 4 && i >= step.revealed && step.type !== 'decodeIntro';
      let data;
      if (mode === 'int') {
        data = step.genes.map((j, i) => ({ id: `g${i}`, i, j, v: j }));
      } else {
        data = [];
        step.genes.forEach((row, i) => row.forEach((b, k) => data.push({ id: `b${i}-${k + 1}`, i, j: k + 1, v: b })));
      }
      const size = mode === 'int' ? Math.min(44, g.col - 14) : Math.min(CELL - 4, g.col - 14);
      const sel = gChrom.selectAll('g.gene').data(data, (d) => d.id).join((enter) => {
        const e = enter.append('g').attr('role', 'button');
        e.append('rect').attr('class', 'gene-rect').attr('rx', mode === 'int' ? 8 : 5);
        e.append('text').attr('class', 'gene-num');
        e.on('click', (ev, d) => click(d));
        e.on('keydown', keyHandler);
        return e;
      });
      sel.attr('class', (d) => {
        const c = ['gene', 'gene-btn', mode === 'int' ? 'machine' : (d.v ? 'one' : 'zero')];
        if (hasCell(step.changed, d.i, d.j)) c.push('changed');
        if (step.focus.indexOf(d.i) !== -1) c.push('active');
        if (dimmed(d.i)) c.push('dim');
        return c.join(' ');
      })
        .attr('tabindex', live ? 0 : -1)
        .attr('role', live ? 'button' : null)
        .attr('aria-hidden', visible ? null : 'true')
        .attr('aria-label', (d) => (mode === 'int' ? t(live ? 'intGeneAria' : 'intGeneAriaStatic', { i: d.i + 1, j: d.j }) : t(live ? 'bitAria' : 'bitAriaStatic', { i: d.i + 1, j: d.j, b: d.v })))
        .style('pointer-events', live ? null : 'none');
      sel.transition().duration(dur).attr('opacity', visible ? 1 : 0);
      const y = (d) => (mode === 'int' ? g.chromTop : g.chromTop + (d.j - 1) * CELL + 2);
      sel.select('.gene-rect').attr('x', (d) => g.cx(d.i) - size / 2).attr('y', y).attr('width', size).attr('height', size);
      sel.select('.gene-num').attr('x', (d) => g.cx(d.i)).attr('y', (d) => y(d) + size / 2).attr('dy', '0.36em')
        .attr('text-anchor', 'middle').text((d) => d.v);
      if (mode === 'matrix') machineLabels(gChrom, g, g.chromTop, CELL, visible);
      // Columnas infactibles de la matriz: recuadro discontinuo
      const bad = [];
      if (mode === 'matrix' && visible && !step.practice) {
        step.genes.forEach((row, i) => {
          const k = row.reduce((a, b) => a + b, 0);
          if (k !== 1 && (step.stage !== 4 || i < step.revealed || step.type === 'decodeIntro')) bad.push(i);
        });
      }
      gChrom.selectAll('rect.col-bad').data(bad, (i) => i).join('rect').attr('class', 'col-bad').attr('rx', 8)
        .attr('x', (i) => g.cx(i) - size / 2 - 5).attr('y', g.chromTop - 3).attr('width', size + 10).attr('height', g.m * CELL + 2);
    }

    function drawGantt(g, dur) {
      const x = (v) => g.x0 + v * g.unit;
      machineLabels(gGantt, g, g.ganttTop, LANE, true);
      gGantt.selectAll('rect.lane').data(d3.range(g.m)).join('rect').attr('class', 'lane')
        .attr('x', g.x0).attr('y', (j) => g.ganttTop + j * LANE + 2).attr('width', VW - RIGHT - g.x0).attr('height', LANE - 4).attr('rx', 6);
      // Barras: tareas decodificadas hasta ahora, en orden, a la cola de su máquina
      const bars = [];
      if (step.stage >= 4) {
        const acc = Array(g.m).fill(0);
        for (let i = 0; i < step.revealed; i++) {
          const ms = machinesOf(i);
          ms.forEach((j) => {
            const p = inst.p[i][j - 1];
            bars.push({ id: `${i}-${j}`, i, j, start: acc[j - 1], p, dup: ms.length > 1, changed: hasCell(step.changed, i, j) });
            acc[j - 1] += p;
          });
        }
      }
      const sel = gGantt.selectAll('g.bar').data(bars, (d) => d.id).join((enter) => {
        const e = enter.append('g');
        e.append('rect').attr('rx', 4).attr('x', (d) => x(d.start)).attr('width', 0);
        e.append('text').attr('dy', '0.36em').attr('text-anchor', 'middle');
        return e;
      });
      sel.attr('class', (d) => `bar${d.dup ? ' dup' : ''}${d.changed ? ' changed' : ''}${step.focus.indexOf(d.i) !== -1 ? ' focus' : ''}`);
      sel.select('rect').attr('y', (d) => g.ganttTop + (d.j - 1) * LANE + 5).attr('height', LANE - 10)
        .transition().duration(dur).attr('x', (d) => x(d.start) + 1).attr('width', (d) => Math.max(0, d.p * g.unit - 2));
      sel.select('text').attr('x', (d) => x(d.start + d.p / 2)).attr('y', (d) => g.ganttTop + (d.j - 1) * LANE + LANE / 2)
        .text((d) => (d.p * g.unit >= 26 ? t('taskShort', { i: d.i + 1 }) : ''));
      // Makespan (al terminar de decodificar) y óptimo (discontinuo)
      const done = step.stage >= 5 || step.type === 'decodeDone';
      const cmax = Math.max(0, ...step.loads);
      const marks = [];
      if (step.practice) { /* practicando: ni el makespan ni el óptimo */ } else if (done && step.stage >= 4) marks.push({ id: 'cmax', v: cmax, label: t('ganttCmax', { v: fmt(cmax) }), y: g.ganttTop - 10 });
      if (step.showOpt && opt != null && !step.practice) marks.push({ id: 'opt', v: opt, label: t('ganttOpt', { v: fmt(opt) }), y: g.ganttBottom + 18 });
      const mk = gGantt.selectAll('g.mark').data(marks, (d) => d.id).join((enter) => {
        const e = enter.append('g');
        e.append('line');
        e.append('text').attr('text-anchor', 'middle');
        return e;
      });
      mk.attr('class', (d) => `mark mark-${d.id}`);
      mk.select('line').attr('x1', (d) => x(d.v)).attr('x2', (d) => x(d.v)).attr('y1', g.ganttTop - 4).attr('y2', g.ganttBottom + 4);
      mk.select('text').attr('x', (d) => x(d.v)).attr('y', (d) => d.y).text((d) => d.label);
    }

    function drawSummary(g) {
      const parts = [];
      if (step.stage >= 4 && !step.practice) {
        parts.push({ cls: '', text: t('sumLoads', { loads: step.loads.join(' · ') }) });
        if (step.result) parts.push({ cls: 'sum-fit', text: t('sumFitnessMin', { fitness: fmt(step.result.fitness) }) });
      }
      const text = gSummary.selectAll('text').data([0]).join('text').attr('class', 'summary').attr('x', g.x0).attr('y', g.summaryY);
      text.selectAll('tspan').data(parts).join('tspan').attr('class', (d) => d.cls).text((d, k) => (k ? '   ·   ' : '') + d.text);
    }

    function show(next, o) {
      step = next;
      const dur = o && o.animate ? (o.duration || 320) : 0;
      const g = geom();
      svg.attr('viewBox', `0 0 ${VW} ${g.vh}`);
      rowLabels(g);
      drawTable(g);
      drawChromosome(g, dur);
      drawGantt(g, dur);
      drawSummary(g);
    }

    return { setProblem, show, refreshLabels: () => { if (step) show(step); } };
  }

  (root.GAX = root.GAX || {}).createAssignmentView = createAssignmentView;
})(typeof self !== 'undefined' ? self : this);
