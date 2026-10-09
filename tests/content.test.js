'use strict';
// Comprueba que el material docente de cada codificación disponible es coherente con la herramienta:
// el código descargable (Python y JavaScript, en los dos idiomas) da la misma aptitud y la misma
// solución que la herramienta con los mismos datos y números aleatorios; cada paso de la animación
// resalta líneas que existen en el pseudocódigo y tiene narración en los dos idiomas.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const registry = require('../js/registry.js');
const R = require('../js/rng.js');
const common = require('../js/content/common.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ga-rep-content-'));
const PY = ['python3', 'python'].find((cmd) => spawnSync(cmd, ['--version']).status === 0);
const ready = registry.allEncodings().filter((e) => e.ready);
const LANGS = ['es', 'en'];
const params = (s) => (s.match(/\{(\w+)\}/g) || []).sort().join(',');

/*
 * Casos de prueba por codificación: genera datos y dice cómo llamar a la función descargable.
 */
const CASES = {
  'knapsack-bits': {
    make(P, r, t, variant) {
      const n = R.randInt(r, 5, 12);
      const inst = P.randomInstance(R.randInt(r, 1, 1e6), n);
      inst.capacity = R.randInt(r, 1, inst.weights.reduce((a, b) => a + b, 0));
      const x = Array.from({ length: n }, () => (r() < 0.6 ? 1 : 0));
      const lambda = [0.5, 1, 2.3][t % 3];
      const res = P.run(inst, x, { variant, lambda, seed: t + 1 });
      return { inst, x, variant, lambda, draws: res.draws, fitness: res.result.fitness, solution: res.result.solution };
    },
    js: (f, c, fixed) => {
      const out = f(c.x, c.inst.weights, c.inst.values, c.inst.capacity, c.variant, c.lambda, fixed(c.draws));
      return [out.fitness, out.solution];
    },
    py: 'f(c["x"], c["inst"]["weights"], c["inst"]["values"], c["inst"]["capacity"], c["variant"], c["lambda"], Fixed(c["draws"]))',
  },
  'tsp-perm': {
    make(P, r, t) {
      const n = R.randInt(r, 5, 10);
      const inst = P.randomInstance(R.randInt(r, 1, 1e6), n);
      const x = r() < 0.6 ? R.randomPermutation(r, n) : Array.from({ length: n }, () => R.randInt(r, 1, n));
      const res = P.run(inst, x);
      return { inst, coords: inst.coords, x, draws: [], fitness: res.result.fitness, solution: res.result.tour };
    },
    js: (f, c) => { const out = f(c.x, c.coords); return [out.length, out.tour]; },
    py: 'f(c["x"], c["coords"])',
  },
  'assignment-int': {
    make(P, r) {
      const n = R.randInt(r, 5, 8);
      const m = R.randInt(r, 2, 4);
      const inst = P.randomInstance(R.randInt(r, 1, 1e6), n, m);
      const x = Array.from({ length: n }, () => R.randInt(r, 1, m));
      const res = P.run(inst, x);
      return { inst, p: inst.p, x, draws: [], fitness: res.result.fitness, solution: res.result.assignment };
    },
    js: (f, c) => { const out = f(c.x, c.p); return [out.makespan, out.assignment]; },
    py: 'f(c["x"], c["p"])',
  },
  'assignment-matrix': {
    make(P, r, t, variant) {
      const n = R.randInt(r, 5, 8);
      const m = R.randInt(r, 2, 4);
      const inst = P.randomInstance(R.randInt(r, 1, 1e6), n, m);
      const q = [1 / m, 0.25, 0.5][t % 3];
      const x = t % 7 === 0 ? P.randomFeasible(t + 1, n, m) : Array.from({ length: n }, () => Array.from({ length: m }, () => (r() < q ? 1 : 0)));
      const lambda = [0.5, 1, 2.5][t % 3];
      const res = P.run(inst, x, { variant, lambda });
      return { inst, p: inst.p, x, variant, lambda, draws: [], fitness: res.result.fitness, solution: res.result.solution };
    },
    js: (f, c) => { const out = f(c.x, c.p, c.variant, c.lambda); return [out.fitness, out.matrix]; },
    py: 'f(c["x"], c["p"], c["variant"], c["lambda"])',
  },
};

for (const enc of ready) {
  const P = require(path.join('..', 'js', 'problems', `${enc.id}.js`));
  const content = require(path.join('..', 'js', 'content', `${enc.id}.js`));
  const cases = CASES[enc.id];
  const variants = P.VARIANTS || [undefined];

  test(`«${enc.id}»: textos docentes completos en ES y EN`, () => {
    assert.ok(cases, `falta ${enc.id} en CASES`);
    assert.equal(content.explanation.es.length, content.explanation.en.length);
    content.explanation.es.concat(content.explanation.en).forEach((p) => assert.ok(p.trim()));
    for (const v of variants.filter(Boolean)) {
      for (const l of LANGS) {
        assert.ok(content.variants[v].name[l] && content.variants[v].desc[l], `${v} (${l})`);
      }
    }
    for (const row of content.formalization.rows) {
      LANGS.forEach((l) => assert.ok(row.label[l]));
      assert.match(row.math, /^<math[\s>].*<\/math>$/s);
    }
    assert.deepEqual(Object.keys(content.narration.es).sort(), Object.keys(content.narration.en).sort());
    for (const k of Object.keys(content.narration.es)) assert.equal(params(content.narration.es[k]), params(content.narration.en[k]), k);
  });

  test(`«${enc.id}»: referencias con la fuente original primero y después las del curso`, () => {
    const refs = content.references;
    assert.ok(refs[0].original, 'la primera es la fuente original');
    common.CORE.forEach((key, k) => assert.equal(refs[1 + k].id, common.refs[key].id, `${key} tras la fuente original`));
    refs.forEach((r) => LANGS.forEach((l) => assert.ok(r.note[l], `${r.id}: falta la nota (${l})`)));
    assert.equal(new Set(refs.map((r) => r.id)).size, refs.length);
  });

  test(`«${enc.id}»: cada paso tiene narración y líneas de pseudocódigo`, () => {
    const r = R.mulberry32(3);
    for (const variant of variants) {
      for (const lang of LANGS) {
        const ids = new Set(content.pseudocodeFor(lang, variant).map((l) => l.id));
        for (let t = 0; t < 120; t++) {
          const c = cases.make(P, r, t, variant);
          for (const step of P.run(c.inst, c.x, { variant, lambda: c.lambda, draws: c.draws }).steps) {
            const lines = content.stepLines[step.type];
            assert.ok(lines && lines.length, `paso «${step.type}» sin líneas`);
            lines.forEach((id) => assert.ok(ids.has(id), `línea «${id}» no está en el pseudocódigo (${variant}, ${lang})`));
            const txt = content.narration[lang][step.text.key];
            assert.ok(txt, `falta la narración «${step.text.key}» (${lang})`);
            (txt.match(/\{(\w+)\}/g) || []).forEach((m) => assert.ok(step.text.params[m.slice(1, -1)] != null, `${step.text.key}: falta ${m}`));
          }
        }
      }
    }
  });

  for (const lang of LANGS) {
    test(`«${enc.id}»: el código JavaScript descargable (${lang}) da la misma aptitud y solución`, () => {
      const file = path.join(tmp, `${enc.id}-${lang}.js`);
      fs.writeFileSync(file, content.getCode('javascript', lang));
      const f = require(file)[content.fnName.javascript];
      const fixed = (draws) => { let k = 0; return () => draws[k++]; };
      const r = R.mulberry32(7);
      for (const variant of variants) {
        for (let t = 0; t < 400; t++) {
          const c = cases.make(P, r, t, variant);
          const [fit, sol] = cases.js(f, c, fixed);
          assert.ok(Math.abs(fit - c.fitness) < 1e-9, `${variant}: ${fit} ≠ ${c.fitness}`);
          assert.deepEqual(sol, c.solution, variant);
        }
      }
      const run = spawnSync(process.execPath, [file], { encoding: 'utf8' });
      assert.equal(run.status, 0, run.stderr);
    });

    test(`«${enc.id}»: el código Python descargable (${lang}) da la misma aptitud y solución`, { skip: !PY && 'sin Python' }, () => {
      const dir = path.join(tmp, `py-${lang}`);
      fs.mkdirSync(dir, { recursive: true });
      const modName = content.codeTemplates.python.filename.replace(/\.py$/, '');
      fs.writeFileSync(path.join(dir, `${modName}.py`), content.getCode('python', lang));
      const r = R.mulberry32(13);
      const all = [];
      for (const variant of variants) for (let t = 0; t < 200; t++) all.push(cases.make(P, r, t, variant));
      fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(all));
      const script = `
import json, sys
sys.path.insert(0, ${JSON.stringify(dir)})
from ${modName} import ${content.fnName.python} as f
class Fixed:
    def __init__(self, d): self.d = list(d); self.k = 0
    def random(self):
        v = self.d[self.k]; self.k += 1; return v
bad = 0
for c in json.load(open(${JSON.stringify(path.join(dir, 'cases.json'))})):
    fit, sol = ${cases.py}
    if abs(fit - c["fitness"]) > 1e-9 or list(sol) != c["solution"]:
        bad += 1
        print("mismatch", c["variant"], fit, sol, c["fitness"], c["solution"])
print("bad", bad)
sys.exit(1 if bad else 0)
`;
      const run = spawnSync(PY, ['-c', script], { encoding: 'utf8' });
      assert.equal(run.status, 0, run.stdout + run.stderr);
      const demo = spawnSync(PY, [path.join(dir, `${modName}.py`)], { encoding: 'utf8' });
      assert.equal(demo.status, 0, demo.stderr);
    });
  }
}
