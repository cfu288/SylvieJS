import Collection from "../database/collection";
import { CollectionDocument } from "../database/collection/collection-document";
import Sylvie from "../sylviejs";
import { IncrementalPersistenceAdapter } from "./src/models/persistence-adapter";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";
type LokiIncrementalChunk = {
    key: string;
    index: number;
    value: Partial<CollectionDocument>;
    collectionName: string;
    type: "loki";
};
export type IncrementalChunk = (LokiIncrementalChunk | {
    key: string;
    index: number;
    value: Partial<CollectionDocument> | string;
    collectionName: string;
    dataChunks: LokiIncrementalChunk[];
    type: "data";
} | {
    key: string;
    index: number;
    value: Partial<CollectionDocument>;
    collectionName: string;
    metadata: LokiIncrementalChunk;
    dataChunks: LokiIncrementalChunk[];
    type: "metadata";
}) & Partial<CollectionDocument>;
export interface IncrementalIndexedDBAdapterOptions {
    onversionchange?: (versionChangeEvent: IDBVersionChangeEvent) => void;
    onFetchStart?: () => void;
    onDidOverwrite?: () => void;
    serializeChunk?: (collectionName: string, chunk: IncrementalChunk[]) => string;
    serializeChunkAsync?: (collectionName: string, chunk: IncrementalChunk[]) => Promise<string>;
    deserializeChunk?: (collectionName: string, chunkString: string) => IncrementalChunk[];
    deserializeChunkAsync?: (collectionName: string, chunkString: string) => Promise<IncrementalChunk[]>;
    megachunkCount?: number;
    lazyCollections?: string[];
}
/**
 * An improved Loki persistence adapter for IndexedDB (not compatible with LokiIndexedAdapter)
 *     Unlike LokiIndexedAdapter, the database is saved not as one big JSON blob, but split into
 *     small chunks with individual collection documents. When saving, only the chunks with changed
 *     documents (and database metadata) is saved to IndexedDB. This speeds up small incremental
 *     saves by an order of magnitude on large (tens of thousands of records) databases. It also
 *     avoids Safari 13 bug that would cause the database to balloon in size to gigabytes
 *
 *     The `appname` argument is not provided - to distinguish between multiple app on the same
 *     domain, simply use a different Loki database name
 *
 * @example
 * var adapter = new IncrementalIndexedDBAdapter();
 *
 * @constructor IncrementalIndexedDBAdapter
 *
 * @param {object=} options Configuration options for the adapter
 * @param {function} options.onversionchange Function to call on `IDBDatabase.onversionchange` event
 *     (most likely database deleted from another browser tab)
 * @param {function} options.onFetchStart Function to call once IDB load has begun.
 *     Use this as an opportunity to execute code concurrently while IDB does work on a separate thread
 * @param {function} options.onDidOverwrite Called when this adapter is forced to overwrite contents
 *     of IndexedDB. This happens if there's another open tab of the same app that's making changes.
 *     You might use it as an opportunity to alert user to the potential loss of data
 * @param {function} options.(isData && isLazy))
 *  Called with a chunk (array of Loki documents) before
 *     it's saved to IndexedDB. You can use it to manually compress on-disk representation
 *     for faster database loads. Hint: Hand-written conversion of objects to arrays is very
 *     profitable for performance. If you use this, you must also pass options.deserializeChunk.
 * @param {function} options.deserializeChunk Called with a chunk serialized with options.serializeChunk
 *     Expects an array of Loki documents as the return value
 * @param {number} options.megachunkCount Number of parallel requests for data when loading database.
 *     Can be tuned for a specific application
 * @param {array} options.lazyCollections Names of collections that should be deserialized lazily
 *     Only use this for collections that aren't used at launch
 */
export declare class IncrementalIndexedDBAdapter implements IncrementalPersistenceAdapter {
    mode: "incremental";
    options: Partial<IncrementalIndexedDBAdapterOptions>;
    chunkSize: number;
    megachunkCount: number;
    lazyCollections: string[];
    idb: null | IDBDatabase;
    _prevLokiVersionId: string | null;
    _prevCollectionVersionIds: {};
    operationInProgress: any;
    idbInitInProgress: any;
    constructor(options?: Partial<IncrementalIndexedDBAdapterOptions>);
    _getChunk(collection: Collection<IncrementalChunk>, chunkId: number): IncrementalChunk[];
    /**
     * Incrementally saves the database to IndexedDB
     *
     * @example
     * var idbAdapter = new IncrementalIndexedDBAdapter();
     * var db = new loki('test', { adapter: idbAdapter });
     * var coll = db.addCollection('testColl');
     * coll.insert({test: 'val'});
     * db.saveDatabase();
     *
     * @param {string} dbname - the name to give the serialized database
     * @param {function} getLokiCopy - returns copy of the Loki database
     * @param {function} callback - (Optional) callback passed obj.success with true or false
     * @memberof IncrementalIndexedDBAdapter
     */
    saveDatabase: (dbname: string, getLokiCopy: () => Sylvie, callback: PersistenceAdapterCallback) => void;
    _putInChunksAsync(idbStore: IDBObjectStore, loki: Sylvie & {
        idbVersionId?: string;
    }, incremental: boolean, maxChunkIds: Record<string, number>): Promise<{
        lokiVersionId: string;
        collectionVersionIds: any[];
    }>;
    /**
     * Retrieves a serialized db string from the catalog.
     *
     * @example
     * // LOAD
     * var idbAdapter = new IncrementalIndexedDBAdapter();
     * var db = new loki('test', { adapter: idbAdapter });
     * db.loadDatabase(function(result) {
     *   console.log('done');
     * });
     *
     * @param {string} dbname - the name of the database to retrieve.
     * @param {function} callback - callback should accept string param containing serialized db string.
     * @memberof IncrementalIndexedDBAdapter
     */
    loadDatabase(dbname: any, callback: any): void;
    _initializeIDBAsync(dbname: string): Promise<unknown>;
    _initializeIDB(dbname: string, onError: any, onSuccess: any): void;
    _getAllChunksAsync(dbname: string): Promise<any[]>;
    /**
     * Deletes a database from IndexedDB
     *
     * @example
     * // DELETE DATABASE
     * // delete 'finance'/'test' value from catalog
     * idbAdapter.deleteDatabase('test', function {
     *   // database deleted
     * });
     *
     * @param {string} dbname - the name of the database to delete from IDB
     * @param {function=} callback - (Optional) executed on database delete
     * @memberof IncrementalIndexedDBAdapter
     */
    deleteDatabase(dbname: string, callback?: PersistenceAdapterCallback): void;
}
export {};
