/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-prototype-builtins */
"use strict";
// precompile recursively

export function precompileQuery(operator, value) {
  // for regex ops, precompile
  if (operator === "$regex") {
    if (Array.isArray(value)) {
      value = new RegExp(value[0], value[1]);
    } else if (!(value instanceof RegExp)) {
      value = new RegExp(value);
    }
  } else if (typeof value === "object") {
    for (const key in value) {
      if (key === "$regex" || typeof value[key] === "object") {
        value[key] = precompileQuery(key, value[key]);
      }
    }
  }

  return value;
}
