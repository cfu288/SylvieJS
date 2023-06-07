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
export declare class ExactIndex<T extends number> {
    #private;
    field: string;
    constructor(exactField: string);
    set(key: string | number, val: T): void;
    remove(key: string | number, val: T): void;
    get(key: string | number): T[];
    clear(): void;
}
