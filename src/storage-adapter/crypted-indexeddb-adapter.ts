/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-this-alias */
/*
  Sylvie IndexedDb Adapter (need to include this script to use it)

  Console Usage can be used for management/diagnostic, here are a few examples :
  adapter.getDatabaseList(); // with no callback passed, this method will log results to console
  adapter.saveDatabase('UserDatabase', JSON.stringify(myDb));
  adapter.loadDatabase('UserDatabase'); // will log the serialized db to console
  adapter.deleteDatabase('UserDatabase');
*/
import {
  decryptData,
  encryptData,
} from "./crypted-indexeddb-adapter/string-encryption-utils";
import { SylvieCatalog } from "./crypted-indexeddb-adapter/sylvie-catalog";
import {
  AsyncPersistenceAdapter,
  PersistenceAdapter,
} from "./persistence-adapter";
// @ts-ignore
const DEBUG = typeof window !== "undefined" && !!window.__loki_idb_debug;

if (DEBUG) {
  console.log("DEBUG: Running crypted-indexeddb-adapter in DEBUG mode");
}

if (!window.crypto.subtle) {
  alert("Required crypto lib is not availible, are you using SSL?");
  throw new Error("Required crypto lib is not availible");
}

interface CryptedIndexedAdapterOptions {
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
 * @constructor SylvieIndexedAdapter
 *
 * @param {string} appname - (Optional) Application name context can be used to distinguish subdomains, 'loki' by default
 * @param {CryptedIndexedAdapterOptions} options Configuration options for the adapter
 * @param {boolean} options.closeAfterSave Whether the indexedDB database should be closed after saving.
 * @param {boolean} options.secret The password to encrypt with.
 */
export class CryptedIndexedDBAdapter implements PersistenceAdapter {
  //, AsyncPersistenceAdapter
  isAsync: true;
  app: string;
  options: Partial<CryptedIndexedAdapterOptions>;
  catalog: SylvieCatalog;
  mode: string;
  #secret: string;

  constructor(
    appname: string,
    options?: Partial<CryptedIndexedAdapterOptions>
  ) {
    DEBUG && console.log("Initialized crypted-indexeddb-adapter");
    this.app = "loki";
    this.options = options || {};

    if (typeof appname !== "undefined") {
      this.app = appname;
    }

    // keep reference to catalog class for base AKV operations
    this.catalog = null;

    if (!this.#checkIDBAvailability()) {
      throw new Error(
        "IndexedDB does not seem to be supported for your environment"
      );
    }

    if (options.secret) {
      this.#secret = options.secret;
    }
  }

  setSecret(secret: string) {
    this.#secret = secret;
  }

  /**
   * Used for closing the indexeddb database.
   */
  #closeDatabase = () => {
    if (this.catalog && this.catalog.db) {
      this.catalog.db.close();
      this.catalog.db = null;
    }
  };

  /**
   * Used to check if adapter is available
   *
   * @returns {boolean} true if indexeddb is available, false if not.
   */
  #checkIDBAvailability() {
    if (typeof indexedDB !== "undefined" && indexedDB) return true;
    return false;
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
  loadDatabase = (dbname: string, callback: (serialized: string) => void) => {
    DEBUG && console.debug("loading database");

    // lazy open/create db reference so dont -need- callback in constructor
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog((catalog) => {
        this.catalog = catalog;
        this.loadDatabase(dbname, callback);
      });
      return;
    }

    // lookup up dbstring in AKV db
    this.catalog.getAppKeyAsync(this.app, dbname).then((props) => {
      const { success } = props as { success: boolean };
      if (success === false) {
        callback(null);
        return;
      } else {
        const { val } = props as { val: string };
        if (typeof callback === "function") {
          const encryptedDbString = val;
          decryptData(encryptedDbString, this.#secret)
            .then((decryptedDbString) => {
              DEBUG && console.debug(`DECRYPTED STRING: ${decryptedDbString}`);
              callback(decryptedDbString);
            })
            .catch((err) => {
              callback(err);
            });
        } else {
          // support console use of api
          console.log(val);
        }
      }
    });
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
    callback?: (
      err: Error | { success: true } | { success: false; error: Error }
    ) => void
  ) => {
    DEBUG &&
      console.debug(`in saveDatabase(${dbname}, ${dbstring}, ${callback})`);

    const saveCallback = (result: { success: boolean } | Error) => {
      if (result === null || result === undefined) {
        callback(undefined);
      } else if (
        typeof result === "object" &&
        Object.hasOwn(result, "success") &&
        result &&
        (result as { success: boolean }).success === true
      ) {
        callback(undefined);
      } else {
        callback(new Error("Error saving database: " + result));
      }

      if (this.options.closeAfterSave === true) {
        this.#closeDatabase();
      }
    };

    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog(() => {
        this.saveDatabase(dbname, dbstring, saveCallback);
      });

      return;
    }

    encryptData(dbstring, this.#secret)
      .then((encryptedDbString) => {
        // lazy open/create db reference so dont -need- callback in constructor
        DEBUG && console.debug(`ENCRYPTED STRING: ${encryptedDbString}`);
        // set (add/update) entry to AKV database
        this.catalog
          .setAppKeyAsync(this.app, dbname, encryptedDbString)
          .then((res) => {
            callback(res);
          })
          .catch((err) => {
            callback(err);
          });
      })
      .catch((err) => {
        callback(err);
      });
  };

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
  deleteDatabase = (
    dbname: string,
    callback?: (
      _: Error | { success: true } | { success: false; error: Error }
    ) => any
  ) => {
    // lazy open/create db reference and pass callback ahead
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog((catalog) => {
        this.catalog = catalog;
        this.deleteDatabase(dbname, callback);
      });

      return;
    }

    // catalog was already initialized, so just lookup object and delete by id
    this.catalog
      .getAppKeyAsync(this.app, dbname)
      .then((result) => {
        const id = result.id;
        if (id !== 0) {
          this.catalog
            .deleteAppKeyAsync(id)
            .then((res) => {
              if (typeof callback === "function") {
                callback(res);
              }
            })
            .catch((err) => {
              if (typeof callback === "function") {
                callback({ success: false, error: err });
              }
            });
        }
      })
      .catch((err) => {
        if (typeof callback === "function") {
          callback({ success: false, error: err });
        }
      });
  };

  /**
   * Removes all database partitions and pages with the base filename passed in.
   * This utility method does not (yet) guarantee async deletions will be completed before returning
   *
   * @param {string} dbname - the base filename which container, partitions, or pages are derived
   * @memberof SylvieIndexedAdapter
   */
  deleteDatabasePartitions = (dbname) => {
    this.getDatabaseList((result) => {
      result.forEach((str) => {
        if (str.startsWith(dbname)) {
          this.deleteDatabase(str);
        }
      });
    });
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
  getDatabaseList = (callback) => {
    // lazy open/create db reference so dont -need- callback in constructor
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog((cat) => {
        this.catalog = cat;

        this.getDatabaseList(callback);
      });

      return;
    }

    // catalog already initialized
    // get all keys for current appName, and transpose results so just string array
    this.catalog.getAppKeys(this.app, (results) => {
      const names = [];

      for (let idx = 0; idx < results.length; idx++) {
        names.push(results[idx].key);
      }

      if (typeof callback === "function") {
        callback(names);
      } else {
        names.forEach((obj) => {
          console.log(obj);
        });
      }
    });
  };

  getDatabaseListAsync = (): Promise<string[]> => {
    // lazy open/create db reference so dont -need- callback in constructor
    return new Promise((resolve, reject) => {
      if (this.catalog === null || this.catalog.db === null) {
        this.catalog = new SylvieCatalog((cat) => {
          this.catalog = cat;

          this.getDatabaseListAsync();
        });

        return;
      }

      // catalog already initialized
      // get all keys for current appName, and transpose results so just string array
      this.catalog.getAppKeys(this.app, (results) => {
        const names: string[] = [];

        for (let idx = 0; idx < results.length; idx++) {
          names.push(results[idx].key);
        }

        resolve(names);
      });
    });
  };

  /**
   * Allows retrieval of list of all keys in catalog along with size
   *
   * @param {function} callback - (Optional) callback to accept result array.
   * @memberof SylvieIndexedAdapter
   */
  getCatalogSummary = (callback) => {
    // lazy open/create db reference
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog((cat) => {
        this.catalog = cat;

        this.getCatalogSummary(callback);
      });

      return;
    }

    // catalog already initialized
    // get all keys for current appName, and transpose results so just string array
    this.catalog.getAllKeys((results) => {
      const entries = [];
      let obj;
      let size;
      let oapp;
      let okey;
      let oval;

      for (let idx = 0; idx < results.length; idx++) {
        obj = results[idx];
        oapp = obj.app || "";
        okey = obj.key || "";
        oval = obj.val || "";

        // app and key are composited into an appkey column so we will mult by 2
        size = oapp.length * 2 + okey.length * 2 + oval.length + 1;

        entries.push({ app: obj.app, key: obj.key, size: size });
      }

      if (typeof callback === "function") {
        callback(entries);
      } else {
        entries.forEach((obj) => {
          console.log(obj);
        });
      }
    });
  };
}

if (typeof window !== "undefined") {
  Object.assign(window, {
    IndexedDBAdapter: CryptedIndexedDBAdapter,
    CryptedIndexedDBAdapter: CryptedIndexedDBAdapter,
  });
}
