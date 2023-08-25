import { ResultType } from "../models/result-type";
/**
 * IDBCatalog - underlying App/Key/Value catalog persistence
 *    This non-interface class implements the actual persistence
 *    using IndexedDBAdapter.
 */
export declare class IDBCatalog {
    #private;
    db?: IDBDatabase;
    constructor();
    /**
     * Asynchronously initializes the catalog the database after creation. Must be run after the database is constructed but before using the database.
     */
    initialize(): Promise<IDBCatalog>;
    openCatalog(): IDBOpenDBRequest;
    getAppKeyAsync(app: any, key: any): Promise<{
        app: string;
        appkey: string;
        id: number;
        key: string;
        val: string;
    } | {
        id: 0;
        success: false;
    }>;
    setAppKeyAsync(app: any, key: any, val: any): Promise<ResultType>;
    deleteAppKeyAsync(id: any): Promise<ResultType>;
    getAppKeysAsync(app: any): Promise<{
        key: string;
    }[]>;
    getAppKeys(app: any, callback: any): void;
    getAllKeys(callback: any): void;
}
