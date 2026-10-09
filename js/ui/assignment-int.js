/*
 * Interfaz de la asignación de tareas a máquinas con un vector de enteros: la parte común está en
 * js/ui/assignment.js.
 */
(function (root) {
  'use strict';
  const G = (root.GAX = root.GAX || {});
  (G.encodingUI = G.encodingUI || {})['assignment-int'] = (ctx) => G.createAssignmentUI(ctx, 'int');
})(typeof self !== 'undefined' ? self : this);
