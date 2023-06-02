export declare class ExactIndex<T extends number> {
    index: Record<string, T[]>;
    field: string;
    constructor(exactField: string);
    set(key: string, val: T): void;
    remove(key: string, val: T): void;
    get(key: string): T[];
    clear(): void;
}
