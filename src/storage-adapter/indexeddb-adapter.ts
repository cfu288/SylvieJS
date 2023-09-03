/**
  Sylvie IndexedDb Adapter (need to include this script to use it)
*/
import { IDBCatalog } from "./src/indexeddb-adapter/idb-catalog";
import { NormalPersistenceAdapter } from "./src/models/persistence-adapter";
import { NormalAsyncPersistenceAdapter } from "./src/models/async-persistence-adapter";

// @ts-ignore
const DEBUG = typeof window !== "undefined" && !!window.__loki_idb_debug;

if (DEBUG) {
  console.log("DEBUG: Running indexeddb-adapter in DEBUG mode");
}

type IndexedDBAdapterOptions = {
  // (Optional) Application name context can be used to distinguish subdomains, 'sylvie' by default
  appname: string;
  // Whether the indexedDB database should be closed after saving.
  closeAfterSave: boolean;
  /**
   * An optional function hook that is called before the database is written to IndexedDB. Use this to modify the raw string before it is written to disk. If you use this, you must also pass beforeRead.
   * @param databaseSerialized - The serialized string dump from Sylvie.
   * @returns The raw string to be written to IndexedDB.
   */
  beforeWriteToIDB: (databaseSerialized: string) => Promise<string>;
  /**
   *  An optional function hook that is called after the database is read from IndexedDB but before it is loaded into Sylvie. Use this to deserialize the string if you used the beforeWrite hook.
   * @param rawString The raw string read from IndexedDB.
   * @returns The deserialized string to be loaded into Sylvie.
   */
  beforeReadFromIDB: (rawString: string) => Promise<string>;
};

/**
 * Loki/Sylvie encrypted persistence adapter class for indexedDb.
 *     This class fulfills abstract adapter interface which can be applied to other storage methods.
 *     Utilizes the included SylvieCatalog app/key/value database for actual database persistence.
 *     IndexedDb storage is provided per-domain, so we implement app/key/value database to
 *     allow separate contexts for separate apps within a domain.
 *
 * @example
 * var idbAdapter = new IndexedDBAdapter('finance');
 *
 */
export class IndexedDBAdapter
  implements NormalPersistenceAdapter, NormalAsyncPersistenceAdapter
{
  isAsync: true;
  app: string;
  options: Partial<IndexedDBAdapterOptions>;
  catalog: IDBCatalog;
  mode: "normal";

  /**
   * Create a IndexedDBAdapter.
   * @param {string} appname - (Optional) Application name context can be used to distinguish subdomains, 'sylvie' by default
   * @param {object=} options - (Optional) configuration options for adapter
   * @param {boolean} [options.closeAfterSave=false] - (Optional) whether the indexedDB database should be closed after saving.
   * @param {function} [options.beforeWriteToIDB] - (Optional) an optional function hook that is called before the database is written to IndexedDB. Use this to modify the raw string before it is written to disk. If you use this, you must also pass beforeRead.
   * @param {function} [options.beforeReadFromIDB] - (Optional) an optional function hook that is called after the database is read from IndexedDB but before it is loaded into Sylvie. Use this to deserialize the string if you used the beforeWrite hook.
   */
  constructor(options?: Partial<IndexedDBAdapterOptions>) {
    DEBUG && console.log("Initialized crypted-indexeddb-adapter");
    this.app = "sylvie";
    this.options = options || {};

    if (typeof options?.appname !== "undefined") {
      this.app = options?.appname;
    }

    // keep reference to catalog class for base AKV operations
    this.catalog = null;

    if (!this.#checkIDBAvailability()) {
      throw new Error(
        "IndexedDB does not seem to be supported for your environment",
      );
    }
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
  #checkIDBAvailability(): boolean {
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
  loadDatabase = (
    dbname: string,
    callback: (serialized: string | null) => void,
  ): void => {
    DEBUG && console.debug("loading database");

    // lazy open/create db reference so dont -need- callback in constructor
    if (this.catalog === null || this.catalog.db === null) {
      new IDBCatalog().initialize().then((catalog) => {
        this.catalog = catalog;
        this.loadDatabase(dbname, callback);
        return;
      });
      return;
    }

    // lookup up dbstring in AKV db
    this.catalog
      .getAppKeyAsync(this.app, dbname)
      .then((props) => {
        const { success } = props as { success: boolean };
        if (success === false) {
          callback(null);
        } else {
          const { val: unserializedString } = props as { val: string };
          if (this.options.beforeReadFromIDB) {
            this.options
              .beforeReadFromIDB(unserializedString)
              .then((deserializedString) => {
                DEBUG &&
                  console.debug(`DESERIALIZED STRING: ${deserializedString}`);
                callback(deserializedString);
              })
              .catch((err) => {
                console.error(err);
                callback(err);
              });
          } else {
            callback(unserializedString);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        callback(err);
      });
  };

  /**
   * Retrieves a serialized db string from the catalog, returns a promise to a string of the serialized database.
   * @param dbname
   * @returns {Promise<string>} A promise to a string of the serialized database.
   * @example
   * const db = new Sylvie(TEST_DB_NAME, {
   *  adapter: new IndexedDBAdapter();
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
   * @memberof IndexedDBAdapter
   * @throws {Error} If the database is not found.
   * @throws {Error} If the database is not decrypted successfully.
   * @throws {Error} If the database is not deserialized successfully.
   */
  loadDatabaseAsync = async (dbname: string): Promise<string> => {
    DEBUG && console.debug("loading database");

    return new Promise((resolve, reject) => {
      const doLoad = () =>
        this.catalog.getAppKeyAsync(this.app, dbname).then((props) => {
          const { success } = props as { success: boolean };
          if (success === false) {
            reject(null);
          } else {
            const { val } = props as { val: string };
            const unserializedString = val;
            if (this.options.beforeReadFromIDB) {
              this.options
                .beforeReadFromIDB(unserializedString)
                .then((deserializedString) => {
                  DEBUG &&
                    console.debug(`DESERIALIZED STRING: ${deserializedString}`);
                  resolve(deserializedString);
                })
                .catch((err) => {
                  reject(err);
                });
            } else {
              resolve(unserializedString);
            }
          }
        });

      // lazy open/create db reference so dont -need- callback in constructor
      if (this.catalog === null || this.catalog.db === null) {
        // catalog not initialized yet
        new IDBCatalog()
          .initialize()
          .then((catalog) => {
            this.catalog = catalog;
            doLoad();
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        // catalog was already initialized, so just lookup object and delete by id
        doLoad();
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
      err: Error | { success: true } | { success: false; error: Error },
    ) => void,
  ) => {
    DEBUG &&
      console.debug(`in saveDatabase(${dbname}, ${dbstring}, ${callback})`);

    const doSave = () => {
      if (this.options.beforeWriteToIDB) {
        this.options
          .beforeWriteToIDB(dbstring)
          .then((serializedString) => {
            // lazy open/create db reference so dont -need- callback in constructor
            DEBUG && console.debug(`SERIALIZED STRING: ${serializedString}`);
            // set (add/update) entry to AKV database
            this.catalog
              .setAppKeyAsync(this.app, dbname, serializedString)
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
      } else {
        DEBUG && console.debug(`SERIALIZED STRING: ${dbstring}`);
        this.catalog
          .setAppKeyAsync(this.app, dbname, dbstring)
          .then((res) => {
            callback(res);
          })
          .catch((err) => {
            callback(err);
          });
      }
    };

    if (this.catalog === null || this.catalog.db === null) {
      // catalog not initialized yet
      new IDBCatalog()
        .initialize()
        .then((catalog) => {
          this.catalog = catalog;
          this.saveDatabaseAsync(dbname, dbstring)
            .then(() => {
              callback(undefined);
            })
            .catch((err) => {
              callback(new Error("Error saving database: " + err));
            })
            .finally(() => {
              if (this.options.closeAfterSave === true) {
                this.#closeDatabase();
              }
            });
        })
        .catch((err) => {
          callback(new Error("Error saving database: " + err));
        });
    } else {
      // catalog was already initialized, so just lookup object and delete by id
      doSave();
    }
  };

  async saveDatabaseAsync(dbname: string, dbstring: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doSave = () => {
        if (this.options.beforeWriteToIDB) {
          this.options
            .beforeWriteToIDB(dbstring)
            .then((encryptedDbString) => {
              // lazy open/create db reference so dont -need- callback in constructor
              DEBUG && console.debug(`ENCRYPTED STRING: ${encryptedDbString}`);
              // set (add/update) entry to AKV database
              this.catalog
                .setAppKeyAsync(this.app, dbname, encryptedDbString)
                .then((res) => {
                  if (res.success === true) {
                    resolve();
                  } else {
                    reject(res);
                  }
                })
                .catch((err) => {
                  reject(err);
                });
            })
            .catch((err) => {
              reject(err);
            });
        } else {
          DEBUG && console.debug(`SERIALIZED STRING: ${dbstring}`);
          this.catalog
            .setAppKeyAsync(this.app, dbname, dbstring)
            .then((res) => {
              if (res.success === true) {
                resolve();
              } else {
                reject(res);
              }
            })
            .catch((err) => {
              reject(err);
            });
        }
      };

      if (this.catalog === null || this.catalog.db === null) {
        // catalog not initialized yet
        new IDBCatalog()
          .initialize()
          .then((catalog) => {
            this.catalog = catalog;
            // Now that catalog is initialized, try again
            this.saveDatabaseAsync(dbname, dbstring)
              .then(resolve)
              .catch((error) => {
                reject(new Error("Error saving database: " + error));
              })
              .finally(() => {
                if (this.options.closeAfterSave === true) {
                  this.#closeDatabase();
                }
              });
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        // catalog was already initialized, so just lookup object and delete by id
        doSave();
      }
    });
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
  deleteDatabase = (
    dbname: string,
    callback?: (
      _: Error | { success: true } | { success: false; error: Error },
    ) => any,
  ) => {
    // lazy open/create db reference and pass callback ahead
    if (this.catalog === null || this.catalog.db === null) {
      new IDBCatalog()
        .initialize()
        .then((catalog) => {
          this.catalog = catalog;
          this.deleteDatabase(dbname, callback);
        })
        .catch((err) => {
          callback(new Error("Error deleting database: " + err));
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

  async deleteDatabaseAsync(dbname: string): Promise<void> {
    // lazy open/create db reference and pass callback ahead
    return new Promise((resolve, reject) => {
      const doDelete = () =>
        this.catalog
          .getAppKeyAsync(this.app, dbname)
          .then((result) => {
            const id = result.id;
            if (id !== 0) {
              this.catalog
                .deleteAppKeyAsync(id)
                .then((res) => {
                  if (res.success === true) {
                    resolve();
                  } else {
                    reject(res);
                  }
                })
                .catch((err) => {
                  reject(err);
                });
            }
          })
          .catch((err) => {
            reject(err);
          });

      if (this.catalog === null || this.catalog.db === null) {
        // catalog not initialized yet
        new IDBCatalog()
          .initialize()
          .then((catalog) => {
            this.catalog = catalog;
            doDelete();
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        // catalog was already initialized, so just lookup object and delete by id
        doDelete();
      }
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
    this.getDatabaseList((result) => {
      if (result instanceof Error) {
        throw result;
      }
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
  getDatabaseList = (callback: (_: string[] | Error) => void) => {
    // lazy open/create db reference so dont -need- callback in constructor
    if (this.catalog === null || this.catalog.db === null) {
      new IDBCatalog()
        .initialize()
        .then((catalog) => {
          this.catalog = catalog;
          this.getDatabaseList(callback);
        })
        .catch((err) => {
          callback(new Error("Error getting database list: " + err));
        });

      return;
    }

    // catalog already initialized
    // get all keys for current appName, and transpose results so just string array
    this.catalog
      .getAppKeysAsync(this.app)
      .then((results) => {
        const names = [];

        for (let idx = 0; idx < results.length; idx++) {
          names.push(results[idx].key);
        }

        if (typeof callback === "function") {
          callback(names);
        }
      })
      .catch((err) => {
        callback(err);
      });
  };

  getDatabaseListAsync = (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      // lazy open/create db reference
      if (this.catalog === null || this.catalog.db === null) {
        // catalog not initialized yet
        new IDBCatalog()
          .initialize()
          .then((catalog) => {
            this.catalog = catalog;
            this.catalog
              .getAppKeysAsync(this.app)
              .then((results) => {
                const names: string[] = results.map((result) => result.key);
                resolve(names);
              })
              .catch((err) => {
                reject(err);
              });
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        // catalog already initialized
        // get all keys for current appName, and transpose results so just string array
        this.catalog
          .getAppKeysAsync(this.app)
          .then((results) => {
            const names: string[] = results.map((result) => result.key);
            resolve(names);
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  };

  /**
   * Allows retrieval of list of all keys in catalog along with size
   *
   * @param {function} callback - (Optional) callback to accept result array.
   * @memberof LokiIndexedAdapter
   */
  getCatalogSummary = (callback) => {
    // lazy open/create db reference
    if (this.catalog === null || this.catalog.db === null) {
      new IDBCatalog()
        .initialize()
        .then((catalog) => {
          this.catalog = catalog;
          this.getCatalogSummary(callback);
        })
        .catch((err) => {
          callback(new Error("Error getting database list: " + err));
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
      }
    });
  };
}

if (typeof window !== "undefined") {
  Object.assign(window, {
    IndexedDBAdapter: IndexedDBAdapter,
  });
}
