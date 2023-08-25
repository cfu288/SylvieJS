import { NormalPersistenceAdapter } from "./src/models/persistence-adapter";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";
/**
 * A persistence adapter which persists to web browser's local storage object
 */
export declare class LocalStorageAdapter implements NormalPersistenceAdapter {
    mode: "normal";
    /**
     * loadDatabase() - Load data from localstorage
     * @param {string} dbname - the name of the database to load
     * @param {function} callback - the callback to handle the result
     */
    loadDatabase(dbname: string, callback: (value: string | Error) => void): void;
    /**
     * saveDatabase() - save data to localstorage, will throw an error if the file can't be saved
     * might want to expand this to avoid dataloss on partial save
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     */
    saveDatabase(dbname: string, dbstring: any, callback: PersistenceAdapterCallback): void;
    /**
     * deleteDatabase() - delete the database from localstorage, will throw an error if it
     * can't be deleted
     * @param {string} dbname - the filename of the database to delete
     * @param {PersistenceAdapterCallback} callback - the callback to handle the result
     */
    deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void;
}
