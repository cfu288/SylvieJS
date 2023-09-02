import { NormalPersistenceAdapter } from "./src/models/persistence-adapter";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";

/**
 * A Sylvie persistence adapter which persists using browser OPFS
 */
export class OPFSAdapter implements NormalPersistenceAdapter {
  mode: "normal";
  fs: FileSystemDirectoryHandle;

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
                    if (data.length === 0) {
                      callback(null);
                    } else {
                      callback(data);
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
}
