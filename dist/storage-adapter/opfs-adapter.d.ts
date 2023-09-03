import { NormalAsyncPersistenceAdapter } from "./src/models/async-persistence-adapter";
import { NormalPersistenceAdapter } from "./src/models/persistence-adapter";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";
type OPFSAdapterOptions = {
    /**
     * An optional function hook that is called before the database is written to IndexedDB. Use this to modify the raw string before it is written to disk. If you use this, you must also pass beforeRead.
     * @param databaseSerialized - The serialized string dump from Sylvie.
     * @returns The raw string to be written to file in OPFS.
     */
    beforeWriteToOPFS: (databaseSerialized: string) => Promise<string>;
    /**
     *  An optional function hook that is called after the database is read from a OPFS file but before it is loaded into Sylvie. Use this to deserialize the string if you used the beforeWrite hook.
     * @param rawString The raw string read from file in OPFS.
     * @returns The deserialized string to be loaded into Sylvie.
     */
    beforeReadFromOPFS: (rawString: string) => Promise<string>;
};
/**
 * A Sylvie persistence adapter which persists using browser OPFS
 */
export declare class OPFSAdapter implements NormalPersistenceAdapter, NormalAsyncPersistenceAdapter {
    #private;
    mode: "normal";
    fs: FileSystemDirectoryHandle;
    options: Partial<OPFSAdapterOptions>;
    isAsync: true;
    constructor(options?: Partial<OPFSAdapterOptions>);
    /** loadDatabase() - Load data from OPFS file, will throw an error if the file does not exist
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     */
    loadDatabase: (dbname: string, callback: (serialized?: string | Error) => void) => void;
    /**
     * saveDatabase() - save data to file, will throw an error if the file can't be saved
     * might want to expand this to avoid dataloss on partial save
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsAdapter
     */
    saveDatabase: (dbname: string, dbstring: string, callback: PersistenceAdapterCallback) => void;
    /**
     * deleteDatabase() - delete the database file, will throw an error if the
     * file can't be deleted
     * @param {string} dbname - the filename of the database to delete
     * @param {function} callback - the callback to handle the result
     */
    deleteDatabase: (dbname: string, callback: PersistenceAdapterCallback) => void;
    loadDatabaseAsync(dbname: string): Promise<string>;
    saveDatabaseAsync(dbname: string, dbstring: string): Promise<void>;
    deleteDatabaseAsync(dbname: string): Promise<void>;
}
export {};
