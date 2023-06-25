import { PersistenceAdapter } from "./persistence-adapter";
export declare function bytesToBase64(bytes: Uint8Array): string;
export declare function base64ToBytes(str: string): Uint8Array;
export declare function base64encode(str: string, encoder?: TextEncoder): string;
export declare function base64decode(str: string, decoder?: TextDecoder): string;
interface CryptedIndexedAdapterOptions {
    closeAfterSave: boolean;
    secret: string;
}
/**
 * Loki/Sylvie persistence adapter class for indexedDb.
 *     This class fulfills abstract adapter interface which can be applied to other storage methods.
 *     Utilizes the included LokiCatalog app/key/value database for actual database persistence.
 *     Indexeddb is highly async, but this adapter has been made 'console-friendly' as well.
 *     Anywhere a callback is omitted, it should return results (if applicable) to console.
 *     IndexedDb storage is provided per-domain, so we implement app/key/value database to
 *     allow separate contexts for separate apps within a domain.
 *
 * @example
 * var idbAdapter = new CryptedIndexedDBAdapter('finance', {
 *  secret: "pass"
 * });
 *
 * @constructor LokiIndexedAdapter
 *
 * @param {string} appname - (Optional) Application name context can be used to distinguish subdomains, 'loki' by default
 * @param {CryptedIndexedAdapterOptions} options Configuration options for the adapter
 * @param {boolean} options.closeAfterSave Whether the indexedDB database should be closed after saving.
 * @param {boolean} options.secret The password to encrypt with.
 */
export declare class CryptedIndexedDBAdapter implements PersistenceAdapter {
    #private;
    app: string;
    options: Partial<CryptedIndexedAdapterOptions>;
    catalog: SylvieCatalog;
    mode: string;
    loadKey: (dbname: any, callback: any) => void;
    saveKey: (dbname: any, dbstring: any, callback: any) => void;
    deleteKey: (dbname: any, callback: any) => void;
    getKeyList: (callback: any) => void;
    constructor(appname: string, options?: Partial<CryptedIndexedAdapterOptions>);
    setSecret(secret: string): void;
    /**
     * Used for closing the indexeddb database.
     */
    closeDatabase(): void;
    /**
     * Used to check if adapter is available
     *
     * @returns {boolean} true if indexeddb is available, false if not.
     */
    checkAvailability(): boolean;
    /**
     * Retrieves a serialized db string from the catalog.
     *
     * @example
     * // LOAD
     * var idbAdapter = new LokiIndexedAdapter('finance');
     * var db = new loki('test', { adapter: idbAdapter });
     *   db.loadDatabase(function(result) {
     *   console.log('done');
     * });
     *
     * @param {string} dbname - the name of the database to retrieve.
     * @param {function} callback - callback should accept string param containing serialized db string.
     */
    loadDatabase(dbname: string, callback: (serialized: string) => void): void;
    /**
     * Saves a serialized db to the catalog.
     *
     * @example
     * // SAVE : will save App/Key/Val as 'finance'/'test'/{serializedDb}
     * var idbAdapter = new LokiIndexedAdapter('finance');
     * var db = new loki('test', { adapter: idbAdapter });
     * var coll = db.addCollection('testColl');
     * coll.insert({test: 'val'});
     * db.saveDatabase();  // could pass callback if needed for async complete
     *
     * @param {string} dbname - the name to give the serialized database within the catalog.
     * @param {string} dbstring - the serialized db string to save.
     * @param {function} callback - (Optional) callback passed obj.success with true or false
     * @memberof LokiIndexedAdapter
     */
    saveDatabase(dbname: string, dbstring: string, callback?: (err: Error) => void): void;
    /**
     * Deletes a serialized db from the catalog.
     *
     * @example
     * // DELETE DATABASE
     * // delete 'finance'/'test' value from catalog
     * idbAdapter.deleteDatabase('test', function {
     *   // database deleted
     * });
     *
     * @param {string} dbname - the name of the database to delete from the catalog.
     * @param {function=} callback - (Optional) executed on database delete
     * @memberof LokiIndexedAdapter
     */
    deleteDatabase(dbname: string, callback?: (_: any) => any): void;
    /**
     * Removes all database partitions and pages with the base filename passed in.
     * This utility method does not (yet) guarantee async deletions will be completed before returning
     *
     * @param {string} dbname - the base filename which container, partitions, or pages are derived
     * @memberof LokiIndexedAdapter
     */
    deleteDatabasePartitions(dbname: any): void;
    /**
     * Retrieves object array of catalog entries for current app.
     *
     * @example
     * idbAdapter.getDatabaseList(function(result) {
     *   // result is array of string names for that appcontext ('finance')
     *   result.forEach(function(str) {
     *     console.log(str);
     *   });
     * });
     *
     * @param {function} callback - should accept array of database names in the catalog for current app.
     * @memberof LokiIndexedAdapter
     */
    getDatabaseList(callback: any): void;
    /**
     * Allows retrieval of list of all keys in catalog along with size
     *
     * @param {function} callback - (Optional) callback to accept result array.
     * @memberof LokiIndexedAdapter
     */
    getCatalogSummary(callback: any): void;
}
/**
 * LokiCatalog - underlying App/Key/Value catalog persistence
 *    This non-interface class implements the actual persistence.
 *    Used by the IndexedDBAdapter class.
 */
declare class SylvieCatalog {
    db: IDBDatabase;
    constructor(callback: any);
    initializeLokiCatalog(callback: any): void;
    getAppKey(app: any, key: any, callback: any): void;
    getAppKeyById(id: any, callback: any, data: any): void;
    setAppKey(app: any, key: any, val: any, callback: any): void;
    deleteAppKey(id: any, callback: (result: {
        success: boolean;
    }) => void): void;
    getAppKeys(app: any, callback: any): void;
    getAllKeys(callback: any): void;
}
export {};
