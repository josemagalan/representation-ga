/*
 * Interfaz de la optimización de una función continua con una cadena binaria (estándar o Gray): la parte común está
 * en js/ui/function.js.
 */
(function (root) {
  'use strict';
  const G = (root.GAX = root.GAX || {});
  (G.encodingUI = G.encodingUI || {})['function-bits'] = (ctx) => G.createFunctionUI(ctx, 'bits');
})(typeof self !== 'undefined' ? self : this);
