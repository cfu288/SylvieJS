import Sylvie from "../../../database/sylvie";
import { PersistenceAdapterCallback } from "./persistence-adapter-callback";
/**
 * SyncPersistanceAdapter is the interface that will be used for all synchronous persistence adapters and are compatible with LokiJS and SylvieJS
 */
export type PersistenceAdapter = NormalPersistenceAdapter | ReferencePersistenceAdapter | IncrementalPersistenceAdapter;
export interface NormalPersistenceAdapter extends SaveablePersistenceAdapter, DeletablePersistenceAdapter, LoadablePersistenceAdapter {
    mode: "normal";
}
export interface IncrementalPersistenceAdapter extends IncrementalSaveablePersistenceAdapter, DeletablePersistenceAdapter, LoadablePersistenceAdapter {
    mode: "incremental";
}
export interface ReferencePersistenceAdapter extends ExportablePersistenceAdapter, DeletablePersistenceAdapter {
    mode: "reference";
    loadDatabase(dbname: string, callback: (value: string | Error | Sylvie) => void): void;
}
interface LoadablePersistenceAdapter {
    /**
     * Loads a serialized database from the persistence layer. This method should
     * pass the string contents of the database to the callback after completion.
     * @param dbname - the name of the database to load
     * @param callback - the callback to handle the result or error after loading. On success, the value of the param with be either a string or null.
     */
    loadDatabase(dbname: string, callback: (value: string | Error | null) => void): void;
}
interface DeletablePersistenceAdapter {
    /**
     * Deletes a database from the persistence layer.
     * @param dbname - the name of the database to delete
     * @param callback - the callback to handle the result or error after deleting
     */
    deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void;
}
interface IncrementalSaveablePersistenceAdapter {
    saveDatabase(dbname: string, getDb: () => Sylvie, callback?: PersistenceAdapterCallback): void;
}
interface SaveablePersistenceAdapter {
    /**
     * Saves a serialized database to the persistence layer.
     * @param dbname - the name of the database to save
     * @param dbstring - a serialized database string to save
     * @param callback - the callback to handle the result or error after saving
     */
    saveDatabase(dbname: string, dbstring: string, callback?: PersistenceAdapterCallback): void;
}
interface ExportablePersistenceAdapter {
    /**
     * Exports a reference of the database for the adapter to save. This is called whenever
     * Sylvie.saveDatabase() is called and the adapter mode is "reference". Instead of
     * passing a serialized string, this method passes a reference to the database.
     * It is up to the adapter to serialize it and call the callback when done. This
     * allows adapters more flexibility on how the documents are serialized, as working
     * with only the serialized database string dump may be limiting.
     * @param dbname - the name of the database to export
     * @param dbref - a reference to the database to export
     * @param callback - the callback to handle the result or error after exporting
     */
    exportDatabase(dbname: string, dbref: Sylvie, callback?: PersistenceAdapterCallback): void;
}
export {};
