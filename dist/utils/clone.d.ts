export type CloneMethods = "parse-stringify" | "shallow" | "shallow-assign" | "shallow-recurse-objects";
export declare function clone<T = object>(data: T, method: CloneMethods): T;
