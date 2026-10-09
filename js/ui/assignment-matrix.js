/*
 * Interfaz de la asignación de tareas a máquinas con una matriz binaria: la parte común está en
 * js/ui/assignment.js.
 */
(function (root) {
  'use strict';
  const G = (root.GAX = root.GAX || {});
  (G.encodingUI = G.encodingUI || {})['assignment-matrix'] = (ctx) => G.createAssignmentUI(ctx, 'matrix');
})(typeof self !== 'undefined' ? self : this);
