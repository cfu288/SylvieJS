/**
 * A Sylvie persistence adapter which persists using node fs module
 */
import { NormalSyncPersistenceAdapter } from "./persistence-adapter";
export declare class FsAdapter implements NormalSyncPersistenceAdapter {
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
    saveDatabase: (dbname: string, dbstring: string, callback: (_?: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void) => void;
    /**
     * deleteDatabase() - delete the database file, will throw an error if the
     * file can't be deleted
     * @param {string} dbname - the filename of the database to delete
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsAdapter
     */
    deleteDatabase: (dbname: string, callback: (_?: Error | {
        success: true;
    } | {
        success: false;
        error: Error;
    }) => void) => void;
}
