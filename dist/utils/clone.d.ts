export type CloneMethods = "parse-stringify" | "shallow" | "shallow-assign" | "shallow-recurse-objects";
export declare function clone(data: object, method: CloneMethods): any;
