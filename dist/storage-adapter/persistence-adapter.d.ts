import Sylvie from "../modules/sylvie";
/**
 * SyncPersistanceAdapter is the interface that will be used for all synchronous persistence adapters and are compatible with LokiJS and SylvieJS
 */
export type SyncPersistenceAdapter = NormalSyncPersistenceAdapter | ReferenceSyncPersistenceAdapter | IncrementalSyncPersistenceAdapter;
export interface NormalSyncPersistenceAdapter {
    mode: "normal";
    loadDatabase(dbname: string, callback: (value: string | Error) => void): void;
    deleteDatabase(dbname: string, callback: (result: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void): void;
    saveDatabase(dbname: string, dbstring: any, callback?: (result: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void): void;
}
export interface IncrementalSyncPersistenceAdapter {
    mode: "incremental";
    loadDatabase(dbname: string, callback: (value: string | Error) => void): void;
    deleteDatabase(dbname: string, callback: (result: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void): void;
    saveDatabase(dbname: string, dbstring: any, callback?: (result: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void): void;
}
export interface ReferenceSyncPersistenceAdapter {
    mode: "reference";
    loadDatabase(dbname: string, callback: (value: string | Error) => void): void;
    deleteDatabase(dbname: string, callback: (result: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void): void;
    saveDatabase(dbname: string, dbstring: any, callback?: (result: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void): void;
    exportDatabase(dbname: string, dbref: typeof Sylvie, callback?: (result: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void): void;
}
/**
 * AsyncPersistenceAdapter is a interface that will be used for all async persistence adapters and are
 * compatible with only SylvieJS, not LokiJS. Replaces the previous callback API with async/await. Note
 * that an adapter can choose to implement both SyncPersistenceAdapter and AsyncPersistenceAdapter if
 * backwards compatibility is desired. Sylvie will choose to use the async version isAsync is set.
 */
export interface AsyncPersistenceAdapter {
    isAsync: true;
    mode?: "normal";
    loadDatabaseAsync(dbname: string): Promise<string | Error>;
    deleteDatabaseAsync(dbname: string): Promise<{
        success: true;
    }>;
    saveDatabaseAsync(dbname: string, dbstring: string): Promise<{
        success: true;
    }>;
    exportDatabaseAsync?(dbname: string, dbref: typeof Sylvie): Promise<{
        success: true;
    }>;
}
