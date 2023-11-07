/**
  Sylvie encrypted IndexedDb Adapter (need to include this script to use it)
*/
import { decryptData, encryptData } from "./src/utils/string-encryption-utils";
import { NormalPersistenceAdapter } from "./src/models/persistence-adapter";
import { NormalAsyncPersistenceAdapter } from "./src/models/async-persistence-adapter";
import { IndexedDBAdapter } from "./indexeddb-adapter";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";

// @ts-ignore
const DEBUG = typeof window !== "undefined" && !!window.__loki_idb_debug;

if (DEBUG) {
  console.log("DEBUG: Running crypted-indexeddb-adapter in DEBUG mode");
}

export interface CryptedIndexedDBAdapterOptions {
  appname: string;
  closeAfterSave: boolean;
  secret: string;
}

/**
 * Loki/Sylvie encrypted persistence adapter class for indexedDb.
 *     This class fulfills abstract adapter interface which can be applied to other storage methods.
 *     Utilizes the included SylvieCatalog app/key/value database for actual database persistence.
 *     IndexedDb storage is provided per-domain, so we implement app/key/value database to
 *     allow separate contexts for separate apps within a domain.
 *
 * @example
 * var idbAdapter = new CryptedIndexedDBAdapter('finance', {
 *  secret: "pass"
 * });
 *
 */
export class CryptedIndexedDBAdapter
  implements NormalPersistenceAdapter, NormalAsyncPersistenceAdapter
{
  isAsync: true;
  app: string;
  options: Partial<CryptedIndexedDBAdapterOptions>;
  mode: "normal";
  #secret: string;
  idbAdapter: IndexedDBAdapter;

  /**
   * Create a CryptedIndexedDBAdapter.
   * @param {CryptedIndexedDBAdapterOptions} options Configuration options for the adapter
   * @param {string} options.appname - (Optional) Application name context can be used to distinguish subdomains, 'sylvie' by default
   * @param {boolean} options.closeAfterSave Whether the indexedDB database should be closed after saving.
   * @param {boolean} options.secret The password to encrypt with.
   */
  constructor(options?: Partial<CryptedIndexedDBAdapterOptions>) {
    DEBUG && console.log("Initialized crypted-indexeddb-adapter");
    this.app = "sylvie";

    if (!window.crypto.subtle) {
      alert("Required crypto lib is not available, are you using SSL?");
      throw new Error("Required crypto lib is not available");
    }

    if (typeof options?.appname !== "undefined") {
      this.app = options?.appname;
    }

    if (options.secret) {
      this.#secret = options.secret || "";
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this; // Required since constructors cannot be arrow functions

    this.idbAdapter = new IndexedDBAdapter({
      ...options,
      beforeReadFromIDB(rawString) {
        return decryptData(rawString, self.#secret);
      },
      beforeWriteToIDB(dbString) {
        return encryptData(dbString, self.#secret);
      },
    });
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
  loadDatabase = (
    dbname: string,
    callback: (serialized: string) => void,
  ): void => {
    this.idbAdapter.loadDatabase(dbname, callback);
  };

  /**
   * Retrieves a serialized db string from the catalog, returns a promise to a string of the serialized database.
   * @param dbname
   * @returns {Promise<string>} A promise to a string of the serialized database.
   * @example
   * const db = new Sylvie(TEST_DB_NAME, {
   *  adapter: new CryptedIndexedDBAdapter();
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
   * @memberof CryptedIndexedDBAdapter
   * @throws {Error} If the database is not found.
   * @throws {Error} If the database is not decrypted successfully.
   * @throws {Error} If the database is not deserialized successfully.
   */
  loadDatabaseAsync = async (dbname: string): Promise<string> => {
    return this.idbAdapter.loadDatabaseAsync(dbname);
  };

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
  saveDatabase = (
    dbname: string,
    dbstring: string,
    callback?: PersistenceAdapterCallback,
  ) => {
    return this.idbAdapter.saveDatabase(dbname, dbstring, callback);
  };

  async saveDatabaseAsync(dbname: string, dbstring: string): Promise<void> {
    return this.idbAdapter.saveDatabaseAsync(dbname, dbstring);
  }

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
  deleteDatabase = (dbname: string, callback?: PersistenceAdapterCallback) => {
    return this.idbAdapter.deleteDatabase(dbname, callback);
  };

  async deleteDatabaseAsync(dbname: string): Promise<void> {
    return this.idbAdapter.deleteDatabaseAsync(dbname);
  }

  /**
   * Changes the password of a database and re-encrypts the database with the new password.
   * @param {string} dbName The name of the database to change the password of.
   * @param {string} newPassword The new password to encrypt the database with.
   * @memberof CryptedIndexedDBAdapter
   * @returns {Promise<void>} A promise that resolves when the password has been changed.
   * @throws {Error} If the adapter is not open.
   * @example
   * await adapter.changePassword("mydb", "newpassword");
   * // The database "mydb" is now encrypted with the password "newpassword".
   * // The old password will no longer work.
   */
  async changePassword(dbname: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loadDatabase(dbname, (serializedDbString) => {
        const oldPassword = this.#secret;
        this.#secret = newPassword;
        this.saveDatabase(dbname, serializedDbString, (responseString) => {
          if (responseString) {
            this.#secret = oldPassword;
            if ((responseString as { success: boolean }).success === true) {
              resolve();
            } else {
              reject(responseString);
            }
          }
          resolve();
        });
      });
    });
  }

  /**
   * Removes all database partitions and pages with the base filename passed in.
   * This utility method does not (yet) guarantee async deletions will be completed before returning
   *
   * @param {string} dbname - the base filename which container, partitions, or pages are derived
   * @memberof SylvieIndexedAdapter
   */
  deleteDatabasePartitions = (dbname) => {
    this.idbAdapter.deleteDatabasePartitions(dbname);
  };

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
  getDatabaseList = (callback: (_: string[] | Error) => void): void => {
    this.idbAdapter.getDatabaseList(callback);
  };

  getDatabaseListAsync = (): Promise<string[]> => {
    return this.idbAdapter.getDatabaseListAsync();
  };
}

if (typeof window !== "undefined") {
  Object.assign(window, {
    CryptedIndexedDBAdapter: CryptedIndexedDBAdapter,
  });
}
