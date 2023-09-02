import { NormalPersistenceAdapter } from "./src/models/persistence-adapter";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";
/**
 * A Sylvie persistence adapter which persists using node fs module
 */
export declare class FsAdapter implements NormalPersistenceAdapter {
    #private;
    fs?: typeof import("node:fs/promises");
    mode: "normal";
    /** loadDatabase() - Load data from file, will throw an error if the file does not exist
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsAdapter
     */
    loadDatabase: (dbname: string, callback: (serialized: string | Error) => void) => void;
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
     * @memberof LokiFsAdapter
     */
    deleteDatabase: (dbname: string, callback: PersistenceAdapterCallback) => void;
}
