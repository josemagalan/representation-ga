/*
 * Interfaz de la optimización de una función continua con un vector de reales: la parte común está
 * en js/ui/function.js.
 */
(function (root) {
  'use strict';
  const G = (root.GAX = root.GAX || {});
  (G.encodingUI = G.encodingUI || {})['function-real'] = (ctx) => G.createFunctionUI(ctx, 'real');
})(typeof self !== 'undefined' ? self : this);
