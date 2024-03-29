/**
  Sylvie IndexedDb Adapter (need to include this script to use it)
*/
import { IDBCatalog } from "./src/indexeddb-adapter/idb-catalog";
import { NormalPersistenceAdapter } from "./src/models/persistence-adapter";
import { NormalAsyncPersistenceAdapter } from "./src/models/async-persistence-adapter";
type IndexedDBAdapterOptions = {
    appname: string;
    closeAfterSave: boolean;
    /**
     * An optional function hook that is called before the database is written to IndexedDB. Use this to modify the raw string before it is written to disk. If you use this, you must also pass beforeRead.
     * @param databaseSerialized - The serialized string dump from Sylvie.
     * @returns The raw string to be written to IndexedDB.
     */
    beforeWriteToIDB: (databaseSerialized: string) => Promise<string>;
    /**
     *  An optional function hook that is called after the database is read from IndexedDB but before it is loaded into Sylvie. Use this to deserialize the string if you used the beforeWrite hook.
     * @param rawString The raw string read from IndexedDB.
     * @returns The deserialized string to be loaded into Sylvie.
     */
    beforeReadFromIDB: (rawString: string) => Promise<string>;
};
/**
 * Loki/Sylvie encrypted persistence adapter class for indexedDb.
 *     This class fulfills abstract adapter interface which can be applied to other storage methods.
 *     Utilizes the included SylvieCatalog app/key/value database for actual database persistence.
 *     IndexedDb storage is provided per-domain, so we implement app/key/value database to
 *     allow separate contexts for separate apps within a domain.
 *
 * @example
 * var idbAdapter = new IndexedDBAdapter('finance');
 *
 */
export declare class IndexedDBAdapter implements NormalPersistenceAdapter, NormalAsyncPersistenceAdapter {
    #private;
    isAsync: true;
    app: string;
    options: Partial<IndexedDBAdapterOptions>;
    catalog: IDBCatalog;
    mode: "normal";
    /**
     * Create a IndexedDBAdapter.
     * @param {string} appname - (Optional) Application name context can be used to distinguish subdomains, 'sylvie' by default
     * @param {object=} options - (Optional) configuration options for adapter
     * @param {boolean} [options.closeAfterSave=false] - (Optional) whether the indexedDB database should be closed after saving.
     * @param {function} [options.beforeWriteToIDB] - (Optional) an optional function hook that is called before the database is written to IndexedDB. Use this to modify the raw string before it is written to disk. If you use this, you must also pass beforeRead.
     * @param {function} [options.beforeReadFromIDB] - (Optional) an optional function hook that is called after the database is read from IndexedDB but before it is loaded into Sylvie. Use this to deserialize the string if you used the beforeWrite hook.
     */
    constructor(options?: Partial<IndexedDBAdapterOptions>);
    /**
     * Retrieves a serialized db string from the catalog.
     *
     * @example
     * // LOAD
     * var idbAdapter = new SylvieIndexedAdapter('finance');
     * var db = new loki('test', { adapter: idbAdapter });
     *   db.loadDatabase(function(result) {
     *   console.log('done');
     * });
     *
     * @param {string} dbname - the name of the database to retrieve.
     * @param {function} callback - callback should accept string param containing serialized db string.
     */
    loadDatabase: (dbname: string, callback: (serialized: string | null) => void) => void;
    /**
     * Retrieves a serialized db string from the catalog, returns a promise to a string of the serialized database.
     * @param dbname
     * @returns {Promise<string>} A promise to a string of the serialized database.
     * @example
     * const db = new Sylvie(TEST_DB_NAME, {
     *  adapter: new IndexedDBAdapter();
     * });
     * await db.loadDatabaseAsync({});
     * // db is now ready to use
     * // you can also chain the promises
     * await db.loadDatabaseAsync({}).then(() => {
     * // db is now ready to use
     * });
     * // or use async await syntax
     * await db.loadDatabaseAsync({});
     * // db is now ready to use
     * @memberof IndexedDBAdapter
     * @throws {Error} If the database is not found.
     * @throws {Error} If the database is not decrypted successfully.
     * @throws {Error} If the database is not deserialized successfully.
     */
    loadDatabaseAsync: (dbname: string) => Promise<string>;
    /**
     * Saves a serialized db to the catalog.
     *
     * @example
     * // SAVE : will save App/Key/Val as 'finance'/'test'/{serializedDb}
     * var idbAdapter = new SylvieIndexedAdapter('finance');
     * var db = new loki('test', { adapter: idbAdapter });
     * var coll = db.addCollection('testColl');
     * coll.insert({test: 'val'});
     * db.saveDatabase();  // could pass callback if needed for async complete
     *
     * @param {string} dbname - the name to give the serialized database within the catalog.
     * @param {string} dbstring - the serialized db string to save.
     * @param {function} callback - (Optional) callback passed obj.success with true or false
     */
    saveDatabase: (dbname: string, dbstring: string, callback?: (err: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void) => void;
    saveDatabaseAsync(dbname: string, dbstring: string): Promise<void>;
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
     * @memberof SylvieIndexedAdapter
     */
    deleteDatabase: (dbname: string, callback?: (_: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => any) => void;
    deleteDatabaseAsync(dbname: string): Promise<void>;
    /**
     * Removes all database partitions and pages with the base filename passed in.
     * This utility method does not (yet) guarantee async deletions will be completed before returning
     *
     * @param {string} dbname - the base filename which container, partitions, or pages are derived
     * @memberof SylvieIndexedAdapter
     */
    deleteDatabasePartitions: (dbname: any) => void;
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
     * @memberof SylvieIndexedAdapter
     */
    getDatabaseList: (callback: (_: string[] | Error) => void) => void;
    getDatabaseListAsync: () => Promise<string[]>;
    /**
     * Allows retrieval of list of all keys in catalog along with size
     *
     * @param {function} callback - (Optional) callback to accept result array.
     * @memberof LokiIndexedAdapter
     */
    getCatalogSummary: (callback: any) => void;
}
export {};
