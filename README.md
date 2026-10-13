# Representation in genetic algorithms

Browse the series: [Genetic algorithms, step by step](https://josemagalan.github.io/genetic-algorithms-lab/?lang=en) — teaching tools for selection, crossover, mutation and evolutionary simulations.

[![Live demo](https://img.shields.io/badge/Live_demo-GitHub_Pages-2ea44f?logo=github)](https://josemagalan.github.io/representation-ga/)
[![Tests](https://github.com/josemagalan/representation-ga/actions/workflows/tests.yml/badge.svg)](https://github.com/josemagalan/representation-ga/actions/workflows/tests.yml)
[![Code: MIT](https://img.shields.io/badge/Code-MIT-yellow.svg)](LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/Content-CC_BY_4.0-lightgrey.svg)](LICENSE-CONTENT.md)
[![D3.js v7 · no build](https://img.shields.io/badge/D3.js_v7-no_build-f9a03c?logo=d3dotjs&logoColor=white)](https://d3js.org/)
[![Languages: ES | EN](https://img.shields.io/badge/Languages-ES_%7C_EN-blue.svg)](#features)
[![Purpose: Teaching tool](https://img.shields.io/badge/Purpose-Teaching_tool-informational.svg)](#pedagogical-purpose)
[![Status: public beta](https://img.shields.io/badge/Status-public_beta-orange.svg)](#status)
[![Accessibility: WCAG 2.2 AA checked with axe](https://img.shields.io/badge/Accessibility-WCAG_2.2_AA_(axe)-0b7285.svg)](#accessibility)
[![Sister tool: selection-ga](https://img.shields.io/badge/Sister_tool-selection--ga-8a2be2?logo=github)](https://github.com/josemagalan/selection-ga)
[![Sister tool: crossover-ga](https://img.shields.io/badge/Sister_tool-crossover--ga-8a2be2?logo=github)](https://github.com/josemagalan/crossover-ga)
[![Sister tool: mutation-ga](https://img.shields.io/badge/Sister_tool-mutation--ga-8a2be2?logo=github)](https://github.com/josemagalan/mutation-ga)

**José Manuel Galán**¹ · **Silvia Díaz-de la Fuente**² · **Virginia Ahedo**¹ · **María Pereda**³ · **José Ignacio Santos**¹

¹ Universidad de Burgos · ² Universidad de Salamanca · ³ Universidad Politécnica de Madrid
All authors are members of the Los Goonies research group (Group of Organization and Industrial Engineering and Simulation).

---

## Overview

Before a genetic algorithm can select, cross over or mutate anything, someone has to decide how a solution is written down as a chromosome. That decision shapes which operators make sense, how many infeasible solutions appear and how easy the search turns out to be, yet most teaching material explains how the algorithm works and much less how a real problem becomes something it can operate on. This interactive tool shows, step by step and in Spanish or English, how four classic optimisation problems are formalised, encoded and decoded, and lets students change genes and see at once what solution they get, whether it is feasible and how good it is.

It opens the series formed by [Selection](https://github.com/josemagalan/selection-ga), [Crossover](https://github.com/josemagalan/crossover-ga) and [Mutation in genetic algorithms](https://github.com/josemagalan/mutation-ga), with the same approach and interface. It runs entirely in the browser, with no build step and no server: open `index.html` or use the [live demo](https://josemagalan.github.io/representation-ga/).

## Problems and encodings

| Representation | Problem | Encodings | What it teaches |
| --- | --- | --- | --- |
| Binary | 0/1 knapsack | Bit vector | Feasibility: penalty (linear and quadratic), repair (greedy and random) and decoder, side by side |
| Integer | Task-to-machine assignment, unrelated machines (makespan) | Integer vector · binary matrix | An encoding can absorb constraints; locality; nominal versus ordinal integers |
| Permutation | Travelling salesman problem | Permutation of cities (path representation) | Structural validity and repair; redundancy (2n chromosomes per tour) |
| Real-valued | Continuous 2D function (Himmelblau, Rastrigin) | Real-valued vector · bit string (standard or Gray) | Precision versus number of bits, Hamming cliffs and Gray code, box bounds (clamp, reflect, penalise) |

## Status

Public beta. All six encodings are available in every mode: step by step, Learn more, practice (21 exercises), Compare encodings (for the two problems with more than one encoding) and the Moodle question banks. The English text has been revised; the Spanish text is awaiting review by the teaching team, and a question bank still has to be tried out in a production Moodle. Version 1.0 will follow those two reviews. Comments and corrections are welcome as [GitHub issues](https://github.com/josemagalan/representation-ga/issues).

## Features

- **Step by step through five stages:** problem, formalisation, encoding, exploration and validity, with narration in Spanish and English. The formalisation is written in MathML and each part lights up as the narration reaches it; the central animation is decoding, gene by gene.
- **Exploration:** click a gene (or tab to it and press Enter) and the solution, its feasibility and its fitness update at once. In the real-valued encoding the point can be dragged across the contour map or moved with the arrow keys. Instances are random with a reproducible seed or entered by hand, and the current example is saved in the URL, ready to project in class or share.
- **Learn more panel:** the full formalisation, an explanation grounded in Talbi’s properties of a representation (completeness, connexity, efficiency) and the classic ways of handling constraints (penalty, repair, decoders), pseudocode that highlights the line of the current step, Python and JavaScript implementations to copy or download (tested to give exactly the same results as the tool), and references, with the course’s core textbooks (Talbi, 2009; Bautista-Valhondo, 2020) always first after the original source.
- **Practice mode:** 21 exercises across the six encodings — encode a solution, decode a chromosome, decide whether it is valid and apply the treatment (in the binary function, find a grid neighbour instead), and compute the fitness. The exercise gives exactly the data needed for a unique answer, marks it element by element and links to the step-by-step solution. In the travelling salesman problem any of the 2n chromosomes of the tour is accepted.
- **Compare encodings** (assignment and function): the same solution written in each encoding, the size of the search space, the share of feasible chromosomes, redundancy, and locality measured over all one-gene neighbours, for the current example and on average over 1000 random solutions.
- **Question banks for Moodle (for teachers):** the 21 practice exercises as cloze questions in Moodle XML, in three difficulty levels, with partial credit per element and one category per encoding, type and level, ready for Moodle’s random questions. The general feedback gives the solution and two links: the step-by-step solution in the tool and the same exercise in practice mode.

## Pedagogical purpose

The tool is designed for undergraduate courses on metaheuristics, evolutionary computation and industrial engineering (production scheduling, routing, resource allocation). It can be projected in lectures, used by students on their own to check hand-worked exercises, or used in seminars to discuss why the representation is a design decision rather than something imposed by the problem: the same assignment problem has a representation that cannot express an infeasible plan and one where almost every chromosome is infeasible, and the same point of a continuous function can be one bit or every bit away from its neighbour.

## Running locally

Open `index.html` in any modern browser. No server or internet connection is needed: D3 v7 is bundled in `vendor/`.

Keyboard: ← → step back/forward, Space play/pause, Home back to the start; Tab reaches every gene, city and control.

## Accessibility

Every view (home, the six encodings in each mode and stage, practice before and after checking, Compare encodings, Moodle and About), in both languages, light and dark themes and at 1280 and 375 px wide, is checked with [axe-core](https://github.com/dequelabs/axe-core) against WCAG 2.2 AA and best-practice rules, with no violations. Everything that can be done with a mouse can also be done with the keyboard, figures carry a text description, colours follow the Okabe–Ito palette, which stays distinguishable with the common colour-vision deficiencies, text meets the AA contrast ratio in both themes, and animations respect the reduced-motion setting.

## Tests

Requires Node.js 22 or later; Python 3 is optional (it is used to test the downloadable Python code as well).

```
npm test
```

The tests check every encoding (worked examples and thousands of random cases contrasted with an independent implementation: decoding, feasibility, repair, penalty and exact optima), that the downloadable code gives the same results as the tool in both languages, that every animation step highlights pseudocode lines that exist, that every practice exercise has a unique answer and is marked correctly, the comparison metrics, and the Moodle generator (stored answers match what the question shows, one correct option, well-formed XML, links that reproduce each exercise). They run on every push with GitHub Actions.

## Project structure

| Path | Contents |
| --- | --- |
| `index.html`, `css/` | Page and styles |
| `js/registry.js`, `js/home.js` | Catalogue of representations, problems and encodings; home screen |
| `js/problems/` | Logic of each encoding: instance, decoding, evaluation, feasibility and the trace of steps |
| `js/assignment.js`, `js/func.js`, `js/cities.js` | Shared core of the assignment and function problems; random cities |
| `js/content/` | Teaching content of each encoding: formalisation, explanation, narration, pseudocode, downloadable code and references |
| `js/viz/` | D3 views of each encoding |
| `js/ui/` | Controls and extra cards of each encoding page |
| `js/practice.js`, `js/practice-ui.js` | Practice mode: the exercises, their unique answers and the marking; the practice card |
| `js/compare.js`, `js/compare-view.js` | Compare encodings: metrics and screen |
| `js/moodle.js`, `js/moodle-page.js` | Moodle question-bank generator (Moodle XML) and its page |
| `js/learn.js`, `js/about.js`, `js/app.js` | Learn more panel, about page and footer, page controller |
| `js/a11y.js` | Keyboard access to scrollable regions and the role of the main figure, updated as the page changes |
| `js/i18n.js`, `js/rng.js` | Spanish and English texts; seeded random generator |
| `img/logos/`, `vendor/` | Institution logos; D3.js v7 |
| `tests/` | Tests with `node:test` |

## How to cite

A paper describing this tool is in preparation for the Congreso de Ingeniería de Organización (CIO). In the meantime, if you would like to cite it, please contact the authors.

## License

- Code, including the downloadable Python and JavaScript implementations: MIT (see [LICENSE](LICENSE)).
- Teaching texts (explanations, formalisations, step narration and pseudocode): CC BY 4.0 (see [LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
- D3.js: ISC licence (see [vendor/d3-LICENSE](vendor/d3-LICENSE)).

## Acknowledgements

We thank Anthropic’s Claude for Science programme for supporting the development of this tool, which was built with the help of Claude.

<p>
  <img src="img/logos/ubu.png" alt="Universidad de Burgos" height="56">&nbsp;&nbsp;
  <img src="img/logos/usal.png" alt="Universidad de Salamanca" height="44">&nbsp;&nbsp;
  <img src="img/logos/upm.png" alt="Universidad Politécnica de Madrid" height="44">&nbsp;&nbsp;
  <img src="img/logos/goonies.png" alt="Los Goonies research group" height="44">
</p>
