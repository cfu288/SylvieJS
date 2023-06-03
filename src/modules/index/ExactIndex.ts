/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-var */
"use strict";

/**
 * @class ExactIndex
 * @classdesc
 * ExactIndex is a simple index that allows you to store a value
 * and retrieve it by key. The key must be an exact match.
 * @example
 * var index = new ExactIndex();
 * index.set("foo", 1);
 * index.get("foo"); // [1]
 * index.get("bar"); // undefined
 * index.set("foo", 2);
 * index.get("foo"); // [2]
 * index.remove("foo");
 * index.get("foo"); // undefined
 * index.set("foo", 1);
 * index.clear();
 * index.get("foo"); // undefined
 * @param {string} exactField - The field to index on
 * @returns {ExactIndex} - The ExactIndex object
 */
export class ExactIndex<T extends number> {
  #index: Record<string, T[]>;
  field: string;
  constructor(exactField: string) {
    this.#index = Object.create(null);
    this.field = exactField;
  }

  // add the value you want returned to the key in the index
  set(key: string | number, val: T) {
    if (this.#index[key]) {
      this.#index[key].push(val);
    } else {
      this.#index[key] = [val];
    }
  }

  // remove the value from the index, if the value was the last one, remove the key
  remove(key: string | number, val: T) {
    const idxSet = this.#index[key];
    for (const indexKey in idxSet) {
      if (idxSet[indexKey] === val) {
        idxSet.splice(parseInt(indexKey), 1);
      }
    }
    if (idxSet.length < 1) {
      this.#index[key] = undefined;
    }
  }

  // get the values related to the key, could be more than one
  get(key: string | number) {
    return this.#index[key];
  }

  // clear will zap the index
  clear() {
    this.#index = {};
  }
}
