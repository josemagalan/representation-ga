/*
 * Página «Acerca de» y pie común: autores, filiaciones, cómo citar, licencias y agradecimientos.
 */
(function (root) {
  'use strict';

  const REPO = 'https://github.com/josemagalan/representation-ga';
  const VERSION = '0.9';       // beta pública; la 1.0 llegará tras la revisión docente del español
  const SISTERS = {
    initialization: 'https://josemagalan.github.io/initialization-and-evaluation-ga/',
    selection: 'https://josemagalan.github.io/selection-ga/',
    crossover: 'https://josemagalan.github.io/crossover-ga/',
    mutation: 'https://josemagalan.github.io/mutation-ga/',
  };

  const authors = [
    { name: 'José Manuel Galán', aff: [1] },
    { name: 'Silvia Díaz-de la Fuente', aff: [2] },
    { name: 'Virginia Ahedo', aff: [1] },
    { name: 'María Pereda', aff: [3] },
    { name: 'José Ignacio Santos', aff: [1] },
  ];

  const affiliations = {
    es: ['Universidad de Burgos', 'Universidad de Salamanca', 'Universidad Politécnica de Madrid'],
    en: ['University of Burgos', 'University of Salamanca', 'Technical University of Madrid (UPM)'],
  };

  // Logos: la UBU, institución principal, primero y algo mayor.
  const logos = [
    { src: 'img/logos/ubu.png', alt: 'Universidad de Burgos', href: 'https://www.ubu.es', main: true },
    { src: 'img/logos/usal.png', alt: 'Universidad de Salamanca', href: 'https://www.usal.es' },
    { src: 'img/logos/upm.png', alt: 'Universidad Politécnica de Madrid', href: 'https://www.upm.es' },
    { src: 'img/logos/goonies.png', alt: 'Los Goonies · Group of Organization and Industrial Engineering and Simulation', href: null },
  ];

  const text = {
    es: {
      title: 'Acerca de esta herramienta',
      lead: 'Herramienta docente interactiva para ver paso a paso cómo se pasa de un problema de optimización a un cromosoma: la formalización matemática, las decisiones de codificación, la decodificación y la validez de las soluciones. Cuatro problemas cubren las representaciones binaria, entera, permutacional y real, cada uno con su explicación, pseudocódigo, código descargable y referencias. ',
      authorsTitle: 'Autores',
      group: 'Todos los autores forman parte del grupo de investigación Los Goonies (Group of Organization and Industrial Engineering and Simulation).',
      statusTitle: 'Versión',
      status: 'Versión {v}, beta pública. Están disponibles las seis codificaciones en todos los modos; falta la revisión docente del texto en español y probar un banco de preguntas en un Moodle real. Si encuentras un error o tienes una sugerencia, cuéntanoslo en',
      issues: 'GitHub',
      footBeta: 'beta {v}',
      citeTitle: 'Cómo citar',
      cite: 'Estamos preparando un artículo sobre esta herramienta para el Congreso de Ingeniería de Organización. Mientras tanto, si quieres citarla, ponte en contacto con los autores.',
      sisterTitle: 'Herramientas hermanas',
      sister: 'Esta herramienta abre la serie «Laboratorio de algoritmos genéticos», de los mismos autores. Las otras cuatro muestran, con el mismo enfoque, cómo se crea y se evalúa la población y los operadores que trabajan sobre la representación elegida:',
      sisterLinks: { initialization: 'Inicialización y evaluación en algoritmos genéticos', selection: 'Selección en algoritmos genéticos', crossover: 'Cruces en algoritmos genéticos', mutation: 'Mutación en algoritmos genéticos' },
      codeTitle: 'Código y licencias',
      code: 'El código fuente está en GitHub. El código, incluidas las implementaciones en Python y JavaScript que se descargan desde la herramienta, se publica con licencia MIT; los textos docentes (explicaciones, formalizaciones, narración de los pasos y pseudocódigo), con licencia CC BY 4.0. D3.js tiene licencia ISC.',
      repo: 'Repositorio en GitHub',
      thanksTitle: 'Agradecimientos',
      thanks: 'Agradecemos al programa Claude for Science de Anthropic su apoyo al desarrollo de esta herramienta, que se ha realizado con la ayuda de Claude.',
      foot: 'Acerca de',
      footMoodle: 'Preguntas para Moodle',
      footSister: 'Herramientas hermanas:',
      footSisters: { initialization: 'inicialización y evaluación', selection: 'selección', crossover: 'cruce', mutation: 'mutación' },
      footLicence: 'Código MIT · Textos CC BY 4.0',
    },
    en: {
      title: 'About this tool',
      lead: 'An interactive teaching tool for following, step by step, how an optimisation problem becomes a chromosome: the mathematical formalisation, the encoding decisions, decoding and the validity of solutions. Four problems cover the binary, integer, permutation and real-valued representations, each with explanations, pseudocode, downloadable code and references. ',
      authorsTitle: 'Authors',
      group: 'All authors are members of the Los Goonies research group (Group of Organization and Industrial Engineering and Simulation).',
      statusTitle: 'Version',
      status: 'Version {v}, public beta. All six encodings are available in every mode; the Spanish text is awaiting review by the teaching team, and a question bank still has to be tried out in a production Moodle. If you find a mistake or have a suggestion, please tell us on',
      issues: 'GitHub',
      footBeta: 'beta {v}',
      citeTitle: 'How to cite',
      cite: 'We are preparing a paper on this tool for the Congreso de Ingeniería de Organización (Spanish conference on industrial management and engineering). In the meantime, if you would like to cite it, please contact the authors.',
      sisterTitle: 'Sister tools',
      sister: 'This tool opens the series “Genetic Algorithms Lab”, by the same authors. The other four use the same approach to show how the population is created and evaluated and the operators that act on the chosen representation:',
      sisterLinks: { initialization: 'Initialisation and evaluation in genetic algorithms', selection: 'Selection in genetic algorithms', crossover: 'Crossover in genetic algorithms', mutation: 'Mutation in genetic algorithms' },
      codeTitle: 'Code and licences',
      code: 'The source code is on GitHub. The code, including the Python and JavaScript implementations downloadable from the tool, is released under the MIT licence, and the teaching texts (explanations, formalisations, step narration and pseudocode) under CC BY 4.0. D3.js is ISC-licensed.',
      repo: 'GitHub repository',
      thanksTitle: 'Acknowledgements',
      thanks: 'We thank Anthropic’s Claude for Science programme for supporting the development of this tool, which was built with the help of Claude.',
      foot: 'About',
      footMoodle: 'Question banks for Moodle',
      footSister: 'Sister tools:',
      footSisters: { initialization: 'initialisation and evaluation', selection: 'selection', crossover: 'crossover', mutation: 'mutation' },
      footLicence: 'Code MIT · Texts CC BY 4.0',
    },
  };

  const SISTER_ORDER = ['initialization', 'selection', 'crossover', 'mutation'];

  function node(tag, cls, content) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  }

  function authorLine(withAff) {
    const p = node('p', 'about-authors');
    authors.forEach((a, i) => {
      if (i) p.append(document.createTextNode(' · '));
      p.append(document.createTextNode(a.name));
      if (withAff) p.append(node('sup', null, a.aff.join(',')));
    });
    return p;
  }

  function logoRow(cls) {
    const row = node('div', cls);
    logos.forEach((l) => {
      const img = node('img');
      img.src = l.src;
      img.alt = l.alt;
      img.title = l.alt;
      img.loading = 'lazy';
      if (l.main) img.className = 'main';
      if (l.href) {
        const a = node('a');
        a.href = l.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.append(img);
        row.append(a);
      } else row.append(img);
    });
    return row;
  }

  function section(title, ...children) {
    const s = node('section', 'about-section');
    s.append(node('h2', null, title), ...children);
    return s;
  }

  function renderAbout(container, lang) {
    const T = text[lang] || text.es;
    const affs = node('p', 'about-affs');
    (affiliations[lang] || affiliations.es).forEach((a, i) => {
      if (i) affs.append(document.createTextNode(' · '));
      affs.append(node('sup', null, String(i + 1)), document.createTextNode(` ${a}`));
    });
    const repo = node('a', null, T.repo);
    repo.href = REPO;
    const codeP = node('p', null, `${T.code} `);
    codeP.append(repo, document.createTextNode('.'));
    container.replaceChildren(
      node('h1', null, T.title),
      node('p', 'lead', T.lead),
      section(T.authorsTitle, authorLine(true), affs, node('p', null, T.group)),
      logoRow('about-logos'),
      section(T.sisterTitle, node('p', null, T.sister), (() => {
        const ul = node('ul', 'about-sisters');
        SISTER_ORDER.forEach((k) => {
          const li = node('li');
          const s = node('a', null, T.sisterLinks[k]);
          s.href = sisterUrl(lang, k);
          s.target = '_blank';
          s.rel = 'noopener';
          li.append(s);
          ul.append(li);
        });
        return ul;
      })()),
      section(T.statusTitle, (() => {
        const p = node('p', null, `${T.status.replace('{v}', VERSION)} `);
        const a = node('a', null, T.issues);
        a.href = `${REPO}/issues`;
        p.append(a, document.createTextNode('.'));
        return p;
      })()),
      section(T.citeTitle, node('p', null, T.cite)),
      section(T.codeTitle, codeP),
      section(T.thanksTitle, node('p', null, T.thanks)),
    );
  }

  function sisterUrl(lang, which) { return `${SISTERS[which] || SISTERS.selection}#lang=${lang}`; }

  function renderFooter(container, lang) {
    const T = text[lang] || text.es;
    const info = node('div', 'site-foot-info');
    info.append(authorLine(false));
    const links = node('p', 'site-foot-links');
    const about = node('a', null, T.foot);
    about.href = `#page=about&lang=${lang}`;
    const gh = node('a', null, 'GitHub');
    gh.href = REPO;
    const moodle = node('a', null, T.footMoodle);
    moodle.href = `#page=moodle&lang=${lang}`;
    links.append(about, document.createTextNode(' · '), moodle, document.createTextNode(` · ${T.footSister} `));
    SISTER_ORDER.forEach((k, i) => {
      if (i) links.append(document.createTextNode(', '));
      const a = node('a', null, T.footSisters[k]);
      a.href = sisterUrl(lang, k);
      links.append(a);
    });
    links.append(document.createTextNode(' · '), gh, document.createTextNode(` · ${T.footLicence} · ${T.footBeta.replace('{v}', VERSION)}`));
    info.append(links);
    container.replaceChildren(logoRow('site-foot-logos'), info);
  }

  const api = { renderAbout, renderFooter, sisterUrl, authors, affiliations, text, SISTERS, VERSION };
  (root.GAX = root.GAX || {}).about = api;
})(typeof self !== 'undefined' ? self : this);
