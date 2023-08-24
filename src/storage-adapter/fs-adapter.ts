/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-prototype-builtins */
/**
 * A Sylvie persistence adapter which persists using node fs module
 */
import { NormalSyncPersistenceAdapter } from "./persistence-adapter";

export class FsAdapter implements NormalSyncPersistenceAdapter {
  fs?: typeof import("node:fs/promises");
  mode: "normal";

  async #initializeFS() {
    if (this.fs === null || this.fs === undefined) {
      try {
        this.fs = await import("node:fs/promises");
      } catch (e) {
        // Silently fail - likely attempting to import fs from a browser
        console.error(`FsAdapter - ${e}`);
      }
    }
  }

  /** loadDatabase() - Load data from file, will throw an error if the file does not exist
   * @param {string} dbname - the filename of the database to load
   * @param {function} callback - the callback to handle the result
   * @memberof LokiFsAdapter
   */
  loadDatabase = (
    dbname: string,
    callback: (serialized: string | Error) => void,
  ): void => {
    this.#initializeFS().then(() => {
      this.fs
        .stat(dbname)
        .then((stats) => {
          if (stats.isFile()) {
            this.fs
              .readFile(dbname, {
                encoding: "utf8",
              })
              .then((data) => {
                callback(data);
              })
              .catch((err) => {
                callback(err);
              });
          }
        })
        .catch((err) => {
          callback(err);
        })
        .catch(callback);
    });
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
    callback: (
      _?: Error | { success: true } | { success: false; error: Error },
    ) => void,
  ) => {
    this.#initializeFS()
      .then(() => {
        const tmpdbname = `${dbname}~`;
        this.fs
          .writeFile(tmpdbname, dbstring)
          .then(() => {
            this.fs
              .rename(tmpdbname, dbname)
              .then(() => callback())
              .catch(callback);
          })
          .catch(callback);
      })
      .catch(callback);
  };

  /**
   * deleteDatabase() - delete the database file, will throw an error if the
   * file can't be deleted
   * @param {string} dbname - the filename of the database to delete
   * @param {function} callback - the callback to handle the result
   * @memberof LokiFsAdapter
   */
  deleteDatabase = (
    dbname: string,
    callback: (
      _?: Error | { success: true } | { success: false; error: Error },
    ) => void,
  ) => {
    this.#initializeFS()
      .then(() => {
        this.fs
          .unlink(dbname)
          .then(() => callback())
          .catch((err) => {
            callback(err);
          });
      })
      .catch(callback);
  };
}
