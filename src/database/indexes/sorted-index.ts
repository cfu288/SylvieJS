// /* eslint-disable @typescript-eslint/no-this-alias */
// /* eslint-disable no-prototype-builtins */
// /* eslint-disable no-var */
"use strict";

import { BSonSort, binarySearch } from "../../utils/binary-search";

export class SortedIndex {
  field: string;
  #keys: (string | number)[];
  #values: (string | number)[][];
  #bs = BSonSort(this.sort);

  constructor(sortedField: string) {
    this.field = sortedField;
    this.#keys = [];
    this.#values = [];
  }

  // set the default sort
  sort(a: number | string, b: number | string) {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  // and allow override of the default sort
  setSort(fun: (a: number, b: number) => number) {
    this.#bs = BSonSort(fun);
  }

  // add the value you want returned  to the key in the index
  set(key: string | number, value) {
    const pos = binarySearch(this.#keys, key, this.sort);
    if (pos.found) {
      this.#values[pos.index].push(value);
    } else {
      // Insert key at position index
      this.#keys.splice(pos.index, 0, key);
      this.#values.splice(pos.index, 0, [value]);
    }
  }

  // get all values which have a key == the given key
  get(key: string | number) {
    const bsr = binarySearch(this.#keys, key, this.sort);
    if (bsr.found) {
      return this.#values[bsr.index];
    } else {
      return [];
    }
  }

  // get all values which have a key < the given key
  getLt(key: string | number) {
    const bsr = binarySearch(this.#keys, key, this.sort);
    return this.getAll(0, bsr.index);
  }

  // get all values which have a key > the given key
  getGt(key: string | number) {
    const bsr = binarySearch(this.#keys, key, this.sort);
    let pos = bsr.index;
    if (bsr.found) pos++;
    return this.getAll(pos, this.#keys.length);
  }

  // get all vals from start to end
  getAll(start: number, end: number) {
    let results = [];
    for (let i = start; i < end; i++) {
      results = results.concat(this.#values[i]);
    }
    return results;
  }

  // just in case someone wants to do something smart with ranges
  getPos(key: string | number) {
    return binarySearch(this.#keys, key, this.sort);
  }

  // remove the value from the index, if the value was the last one, remove the key
  remove(key: string | number, value) {
    const pos = binarySearch(this.#keys, key, this.sort).index;
    const idxSet = this.#values[pos];
    for (const i in idxSet) {
      if (idxSet[i] == value) idxSet.splice(parseInt(i), 1);
    }
    if (idxSet.length < 1) {
      this.#keys.splice(pos, 1);
      this.#values.splice(pos, 1);
    }
  }

  // clear will zap the index
  clear() {
    this.#keys = [];
    this.#values = [];
  }
}
