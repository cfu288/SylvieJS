/* eslint-disable no-prototype-builtins */
/* eslint-disable no-var */
"use strict";
import { clone } from "./clone";

export function freeze<T = object>(obj: T): void {
  if (!Object.isFrozen(obj)) {
    Object.freeze(obj);
  }
}

export function deepFreeze<T = object>(obj: T) {
  var prop, i;
  if (Array.isArray(obj)) {
    for (i = 0; i < obj.length; i++) {
      deepFreeze(obj[i]);
    }
    freeze(obj);
  } else if (obj !== null && typeof obj === "object") {
    for (prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        deepFreeze(obj[prop]);
      }
    }
    freeze(obj);
  }
}

export function unFreeze<T = object>(obj: T) {
  if (!Object.isFrozen(obj)) {
    return obj;
  }
  return clone(obj, "shallow");
}
