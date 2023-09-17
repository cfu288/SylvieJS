import {
  CryptedIndexedDBAdapter,
  CryptedIndexedDBAdapterOptions,
} from "./crypted-indexeddb-adapter";
import {
  IncrementalChunk,
  IncrementalIndexedDBAdapter,
  IncrementalIndexedDBAdapterOptions,
} from "./incremental-indexeddb-adapter";
import { IncrementalPersistenceAdapter } from "./src/models/persistence-adapter";
import { encryptData, decryptData } from "./src/utils/string-encryption-utils";

const DEBUG =
  // @ts-ignore
  typeof window !== "undefined" && !!window.__loki_incremental_idb_debug;

if (DEBUG) {
  console.log(
    "DEBUG: Running crypted-incremental-indexeddb-adapter in DEBUG mode",
  );
}

if (!window.crypto.subtle) {
  alert("Required crypto lib is not available, are you using SSL?");
  throw new Error("Required crypto lib is not available");
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
 * @param {function} options.serializeChunk Called with a chunk (array of Loki documents) before
 *     it's saved to IndexedDB. You can use it to manually compress on-disk representation
 *     for faster database loads. Hint: Hand-written conversion of objects to arrays is very
 *     profitable for performance. If you use this, you must also pass options.deserializeChunk.
 * @param {function} options.deserializeChunk Called with a chunk serialized with options.serializeChunk
 *     Expects an array of Loki documents as the return value
 * @param {number} options.megachunkCount Number of parallel requests for data when loading database.
 *     Can be tuned for a specific application
 */
export class CryptedIncrementalIndexedDBAdapter
  implements IncrementalPersistenceAdapter
{
  #secret: string;
  mode: "incremental";
  options: Partial<
    IncrementalIndexedDBAdapterOptions & CryptedIndexedDBAdapterOptions
  >;
  idbIndexedAdapter: IncrementalIndexedDBAdapter;
  _names: {
    objectStoreName: string;
    lokiKeyName: string; // some padding to give it roughly the same length as <tablename>.ck.<number>, so that is is indistinguishable
    chunk: string;
    metadata: string;
  };
  megachunkCount: number;

  constructor(
    options: Partial<
      IncrementalIndexedDBAdapterOptions & CryptedIndexedDBAdapterOptions
    >,
  ) {
    this.mode = "incremental";
    this.options = options || {};
    this.#secret = options?.secret || "";

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this; // Required since constructors cannot be arrow functions

    const opts = {
      ...(options || {}),
      serializeChunkAsync: (colName: string, chunk: IncrementalChunk[]) => {
        return encryptData(JSON.stringify(chunk), self.#secret);
      },
      deserializeChunkAsync: async (colName, dbString) => {
        return await decryptData(dbString, self.#secret);
      },
    };
    this.idbIndexedAdapter = new IncrementalIndexedDBAdapter(opts);

    this._names = {
      objectStoreName: "LID",
      lokiKeyName: "lk_____________", // some padding to give it roughly the same length as <tablename>.ck.<number>, so that is is indistinguishable
      chunk: "ck",
      metadata: "md___", // padding for the same reason as lokiKeyName
    };
  }

  /**
   * Sets a password for use on future load and save of the database.
   * Note that this does not re-encrypt the database with the new password. Use changePassword() for that.
   * @param secret
   * @example
   * const db = new Sylvie(TEST_DB_NAME, {
   *   adapter: new CryptedIndexedDBAdapter();
   * });
   *
   * adapter.usePassword("newpassword");
   *
   * await newDb.loadDatabaseAsync({});
   */
  usePassword(secret: string) {
    this.#secret = secret;
  }

  async changePassword(dbname: string, newPassword: string): Promise<void> {
    //TODO: implement
  }

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
  saveDatabase(dbname, getLokiCopy, callback) {
    this.idbIndexedAdapter.saveDatabase(dbname, getLokiCopy, callback);
  }

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
  loadDatabase(dbname, callback) {
    this.idbIndexedAdapter.loadDatabase(dbname, callback);
  }

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
  deleteDatabase(dbname, callback) {
    this.idbIndexedAdapter.deleteDatabase(dbname, callback);
  }
}

if (window !== undefined) {
  Object.assign(window, { CryptedIncrementalIndexedDBAdapter });
}
