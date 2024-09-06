import { ReferencePersistenceAdapter } from "./src/models/persistence-adapter";
import Sylvie from "../sylviejs";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";
/**
 * Loki structured (node) filesystem adapter class.
 *     This class fulfills the loki 'reference' abstract adapter interface which can be applied to other storage methods.
 */
export declare class FsStructuredAdapter implements ReferencePersistenceAdapter {
    #private;
    mode: "reference";
    dbref?: Sylvie;
    constructor();
    /**
     * Loki reference adapter interface function.  Saves structured json via loki database object reference.
     *
     * @param {string} dbname - the name to give the serialized database within the catalog.
     * @param {object} dbref - the loki database object reference to save.
     * @param {function} callback - callback passed obj.success with true or false
     * @memberof LokiFsStructuredAdapter
     */
    exportDatabase(dbname: string, dbref: Sylvie, callback?: PersistenceAdapterCallback): void;
    deleteDatabase(dbName: string, callback: PersistenceAdapterCallback): void;
    /**
     * Loki persistence adapter interface function which outputs un-prototype db object reference to load from.
     *
     * @param {string} dbname - the name of the database to retrieve.
     * @param {function} callback - callback should accept string param containing db object reference.
     * @memberof LokiFsStructuredAdapter
     */
    loadDatabase(dbname: string, callback: (value: string | Error | Sylvie | null) => void): void;
}
