# Representation in genetic algorithms

Browse the series: [Genetic algorithms, step by step](https://josemagalan.github.io/genetic-algorithms-lab/?lang=en) — teaching tools for selection, crossover, mutation and evolutionary simulations.

[![Live demo](https://img.shields.io/badge/Live_demo-GitHub_Pages-2ea44f?logo=github)](https://josemagalan.github.io/representation-ga/)
[![Tests](https://github.com/josemagalan/representation-ga/actions/workflows/tests.yml/badge.svg)](https://github.com/josemagalan/representation-ga/actions/workflows/tests.yml)
[![Code: MIT](https://img.shields.io/badge/Code-MIT-yellow.svg)](LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/Content-CC_BY_4.0-lightgrey.svg)](LICENSE-CONTENT.md)
[![D3.js v7 · no build](https://img.shields.io/badge/D3.js_v7-no_build-f9a03c?logo=d3dotjs&logoColor=white)](https://d3js.org/)
[![Languages: ES | EN](https://img.shields.io/badge/Languages-ES_%7C_EN-blue.svg)](#features)
[![Purpose: Teaching tool](https://img.shields.io/badge/Purpose-Teaching_tool-informational.svg)](#pedagogical-purpose)
[![Status: in development](https://img.shields.io/badge/Status-in_development-orange.svg)](#status)
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
| Binary | 0/1 knapsack | Bit vector | Feasibility: penalty (linear and quadratic), repair (greedy and random) and decoders |
| Integer | Task-to-machine assignment, unrelated machines (makespan) | Integer vector · binary matrix | An encoding can absorb constraints; nominal versus ordinal integers |
| Permutation | Travelling salesman problem | Permutation of cities | Structural validity; redundancy (2n chromosomes per tour) |
| Real-valued | Continuous 2D function (Himmelblau, Rastrigin) | Real vector · binary (standard and Gray) | Precision versus number of bits, Hamming cliffs, the fitness landscape |

## Status

In development. Available: the 0/1 knapsack with binary encoding (step by step through the five stages, the five ways of handling infeasibility side by side), the travelling salesman problem with path representation (exact optimum, invalid chromosomes and their repair, and the 2n equivalent chromosomes of each tour) and task-to-machine assignment with two encodings, an integer vector and a binary matrix (exact optimum, Gantt chart, repair and penalty for the matrix, and the same assignment written in both encodings), all with the Learn more panel. The continuous-function problem, practice mode, the full comparison of encodings and the Moodle question banks will follow.

## Features

Planned, following the sister tools:

- **Step by step** through five stages — problem, formalisation, encoding, exploration and validity — with narration in Spanish and English and gene-by-gene decoding.
- **Learn more panel:** the full mathematical formalisation, pseudocode for decoding and evaluation, Python and JavaScript implementations to copy or download (tested to give exactly the same results as the tool), and references, with the course’s core textbooks (Talbi, 2009; Bautista-Valhondo, 2020) always first after the original source.
- **Practice mode:** decode a chromosome, encode a solution, decide whether it is feasible and compute its fitness.
- **Compare encodings** of the same problem: size of the search space, share of feasible chromosomes, redundancy and locality.
- **Question banks for Moodle (for teachers)** in Moodle XML, in three difficulty levels, with the solution linked to each exercise in the tool.

## Pedagogical purpose

The tool is designed for undergraduate courses on metaheuristics, evolutionary computation and industrial engineering. It can be projected in lectures, used by students on their own, or used in seminars to discuss why the representation is a design decision rather than something imposed by the problem.

## Running locally

Open `index.html` in any modern browser. No server or internet connection is needed: D3 v7 is bundled in `vendor/`.

## Tests

Requires Node.js 22 or later.

```
npm test
```

They run on every push with GitHub Actions.

## Project structure

| Path | Contents |
| --- | --- |
| `index.html`, `css/` | Page and styles |
| `js/registry.js`, `js/home.js` | Catalogue of representations, problems and encodings; home screen |
| `js/problems/` | Logic of each encoding: instance, decoding, evaluation, feasibility and the trace of steps |
| `js/content/` | Teaching content of each encoding: formalisation, explanation, narration, pseudocode, downloadable code and references |
| `js/viz/` | D3 views of each encoding |
| `js/ui/` | Controls and extra cards of each encoding page |
| `js/about.js`, `js/app.js` | About page and footer, page controller |
| `js/i18n.js`, `js/rng.js`, `js/cities.js` | Spanish and English texts; seeded random generator; random cities |
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
