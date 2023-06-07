/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-prototype-builtins */
"use strict";

export function deepProperty(obj, property, isDeep) {
  if (isDeep === false) {
    // pass without processing
    return obj[property];
  }
  let pieces = property.split("."),
    root = obj;
  while (pieces.length > 0) {
    root = root[pieces.shift()];
  }
  return root;
}
