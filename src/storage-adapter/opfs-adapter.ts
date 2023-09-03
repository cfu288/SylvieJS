import { NormalAsyncPersistenceAdapter } from "./src/models/async-persistence-adapter";
import { NormalPersistenceAdapter } from "./src/models/persistence-adapter";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";

// @ts-ignore
const DEBUG = typeof window !== "undefined" && !!window.__loki_idb_debug;

if (DEBUG) {
  console.log("DEBUG: Running opfs-adapter in DEBUG mode");
}

type OPFSAdapterOptions = {
  /**
   * An optional function hook that is called before the database is written to IndexedDB. Use this to modify the raw string before it is written to disk. If you use this, you must also pass beforeRead.
   * @param databaseSerialized - The serialized string dump from Sylvie.
   * @returns The raw string to be written to file in OPFS.
   */
  beforeWriteToOPFS: (databaseSerialized: string) => Promise<string>;
  /**
   *  An optional function hook that is called after the database is read from a OPFS file but before it is loaded into Sylvie. Use this to deserialize the string if you used the beforeWrite hook.
   * @param rawString The raw string read from file in OPFS.
   * @returns The deserialized string to be loaded into Sylvie.
   */
  beforeReadFromOPFS: (rawString: string) => Promise<string>;
};

/**
 * A Sylvie persistence adapter which persists using browser OPFS
 */
export class OPFSAdapter
  implements NormalPersistenceAdapter, NormalAsyncPersistenceAdapter
{
  mode: "normal";
  fs: FileSystemDirectoryHandle;
  options: Partial<OPFSAdapterOptions>;
  isAsync: true;

  constructor(options?: Partial<OPFSAdapterOptions>) {
    this.options = options || {};
  }

  async #initializeFS() {
    if (this.fs === null || this.fs === undefined) {
      try {
        this.fs = await navigator.storage.getDirectory();
      } catch (e) {
        throw Error(`OPFSAdapter Error - unable to get OPFS: ${e}`);
      }
    }
  }

  /** loadDatabase() - Load data from OPFS file, will throw an error if the file does not exist
   * @param {string} dbname - the filename of the database to load
   * @param {function} callback - the callback to handle the result
   */
  loadDatabase = (
    dbname: string,
    callback: (serialized?: string | Error) => void,
  ): void => {
    this.#initializeFS()
      .then(() => {
        this.fs
          .getFileHandle(dbname, { create: true })
          .then((fileHandle) => {
            fileHandle
              .getFile()
              .then((file) => {
                file
                  .text()
                  .then((data) => {
                    if (this.options.beforeReadFromOPFS) {
                      this.options
                        .beforeReadFromOPFS(data)
                        .then((serializedString) => {
                          if (serializedString.length === 0) {
                            callback(null);
                          } else {
                            callback(serializedString);
                          }
                        })
                        .catch((err) => callback(err));
                    } else {
                      if (data.length === 0) {
                        callback(null);
                      } else {
                        callback(data);
                      }
                    }
                  })
                  .catch((err) => callback(err));
              })
              .catch((err) => callback(err));
          })
          .catch((err) => callback(err));
      })
      .catch((err) => callback(err));
  };

  /**
   * saveDatabase() - save data to file, will throw an error if the file can't be saved
   * might want to expand this to avoid dataloss on partial save
   * @param {string} dbname - the filename of the database to load
   * @param {function} callback - the callback to handle the result
   * @memberof LokiFsAdapter
   */
  saveDatabase = (
    dbname: string,
    dbstring: string,
    callback: PersistenceAdapterCallback,
  ) => {
    this.#initializeFS()
      .then(() => {
        // Move is not yet supported for OPFS
        // const tmpdbname = `${dbname}~`;
        this.fs
          .getFileHandle(dbname, { create: true })
          .then((fileHandle) => {
            fileHandle
              // @ts-ignore
              .createWritable()
              .then((writeFileHandle) => {
                if (this.options.beforeWriteToOPFS) {
                  this.options
                    .beforeReadFromOPFS(dbstring)
                    .then((deserializedString) => {
                      writeFileHandle
                        .write(deserializedString)
                        .then(() => {
                          writeFileHandle
                            .close()
                            .then(() => callback({ success: true }))
                            .catch((err) => callback(err));
                        })
                        .catch((err) => {
                          writeFileHandle
                            .close()
                            .then(() => callback(err))
                            .catch((err) => callback(err));
                        });
                    });
                } else {
                  writeFileHandle
                    .write(dbstring)
                    .then(() => {
                      writeFileHandle
                        .close()
                        .then(() => callback({ success: true }))
                        .catch((err) => callback(err));
                    })
                    .catch((err) => {
                      writeFileHandle
                        .close()
                        .then(() => callback(err))
                        .catch((err) => callback(err));
                    });
                }
              })
              .catch((err) => callback(err));
          })
          .catch((err) => callback(err));
      })
      .catch((err) => callback(err));
  };

  /**
   * deleteDatabase() - delete the database file, will throw an error if the
   * file can't be deleted
   * @param {string} dbname - the filename of the database to delete
   * @param {function} callback - the callback to handle the result
   */
  deleteDatabase = (dbname: string, callback: PersistenceAdapterCallback) => {
    this.#initializeFS()
      .then(() => {
        this.fs
          .removeEntry(dbname)
          .then(() => callback({ success: true }))
          .catch((err) => callback(err));
      })
      .catch((err) => callback(err));
  };

  async loadDatabaseAsync(dbname: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.loadDatabase(dbname, (serialized) => {
        if (serialized instanceof Error) {
          reject(serialized);
        } else {
          resolve(serialized);
        }
      });
    });
  }

  async saveDatabaseAsync(dbname: string, dbstring: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.saveDatabase(dbname, dbstring, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve();
        }
      });
    });
  }

  async deleteDatabaseAsync(dbname: string): Promise<void> {
    return this.fs.removeEntry(dbname);
  }
}

if (typeof window !== "undefined") {
  Object.assign(window, {
    OPFSAdapter: OPFSAdapter,
  });
}
