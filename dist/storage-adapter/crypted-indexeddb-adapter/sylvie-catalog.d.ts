/**
 * LokiCatalog - underlying App/Key/Value catalog persistence
 *    This non-interface class implements the actual persistence.
 *    Used by the IndexedDBAdapter class.
 */
export declare class SylvieCatalog {
    db: IDBDatabase;
    constructor(callback: (SylvieCatalog: any) => void);
    openCatalog(): IDBOpenDBRequest;
    initializeCatalog(): Promise<SylvieCatalog>;
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
    setAppKeyAsync(app: any, key: any, val: any): Promise<{
        success: false;
        error: Error;
    } | {
        success: true;
    }>;
    deleteAppKeyAsync(id: any): Promise<{
        success: true;
    } | {
        success: false;
        error: Error;
    }>;
    getAppKeys(app: any, callback: any): void;
    getAllKeys(callback: any): void;
}
