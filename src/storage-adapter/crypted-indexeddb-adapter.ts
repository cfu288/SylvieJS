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
import {
  IDBCatalog,
  SuccessResultType,
} from "./crypted-indexeddb-adapter/idb-catalog";
import {
  AsyncPersistenceAdapter,
  NormalSyncPersistenceAdapter,
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
 * @constructor SylvieIndexedAdapter
 *
 * @param {CryptedIndexedAdapterOptions} options Configuration options for the adapter
 * @param {string} options.appname - (Optional) Application name context can be used to distinguish subdomains, 'sylvie' by default
 * @param {boolean} options.closeAfterSave Whether the indexedDB database should be closed after saving.
 * @param {boolean} options.secret The password to encrypt with.
 */
export class CryptedIndexedDBAdapter
  implements NormalSyncPersistenceAdapter, AsyncPersistenceAdapter
{
  isAsync: true;
  app: string;
  options: Partial<CryptedIndexedAdapterOptions>;
  catalog: IDBCatalog;
  mode: "normal";
  #secret: string;

  constructor(options?: Partial<CryptedIndexedAdapterOptions>) {
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
        "IndexedDB does not seem to be supported for your environment"
      );
    }

    if (options.secret) {
      this.#secret = options.secret;
    }
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
  loadDatabase = (dbname: string, callback: (serialized: string) => void) => {
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
          const { val: encryptedDbString } = props as { val: string };
          decryptData(encryptedDbString, this.#secret)
            .then((decryptedDbString) => {
              DEBUG && console.debug(`DECRYPTED STRING: ${decryptedDbString}`);
              callback(decryptedDbString);
            })
            .catch((err) => {
              console.error(err);
              callback(err);
            });
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
    DEBUG && console.debug("loading database");

    return new Promise((resolve, reject) => {
      const doLoad = () =>
        this.catalog.getAppKeyAsync(this.app, dbname).then((props) => {
          const { success } = props as { success: boolean };
          if (success === false) {
            reject(null);
          } else {
            const { val } = props as { val: string };
            const encryptedDbString = val;
            decryptData(encryptedDbString, this.#secret)
              .then((decryptedDbString) => {
                DEBUG &&
                  console.debug(`DECRYPTED STRING: ${decryptedDbString}`);
                resolve(decryptedDbString);
              })
              .catch((err) => {
                reject(err);
              });
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
      err: Error | { success: true } | { success: false; error: Error }
    ) => void
  ) => {
    DEBUG &&
      console.debug(`in saveDatabase(${dbname}, ${dbstring}, ${callback})`);

    const doSave = () =>
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
      const doSave = () =>
        encryptData(dbstring, this.#secret)
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
      _: Error | { success: true } | { success: false; error: Error }
    ) => any
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
  getDatabaseList = (callback: (_: any) => any) => {
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
    return new Promise((resolve, reject) => {
      // lazy open/create db reference
      if (this.catalog === null || this.catalog.db === null) {
        // catalog not initialized yet
        new IDBCatalog()
          .initialize()
          .then((catalog) => {
            this.catalog = catalog;
            this.catalog.getAppKeys(this.app, (results) => {
              const names: string[] = results.map((result) => result.key);
              resolve(names);
            });
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        // catalog already initialized
        // get all keys for current appName, and transpose results so just string array
        this.catalog.getAppKeys(this.app, (results) => {
          const names: string[] = results.map((result) => result.key);
          resolve(names);
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
