/**
 * LokiCatalog - underlying App/Key/Value catalog persistence
 *    This non-interface class implements the actual persistence.
 *    Used by the IndexedDBAdapter class.
 */
export class SylvieCatalog {
  db: IDBDatabase;
  constructor(callback: (SylvieCatalog) => void) {
    this.db = null;
    if (callback) {
      this.#initializeCatalog()
        .then((res) => {
          if (typeof callback === "function") {
            callback(res);
          }
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
    }
  }

  /**
   * An alternative to passing a callback to the constructor
   */
  initialize(): Promise<SylvieCatalog> {
    return new Promise((resolve, reject) => {
      this.#initializeCatalog()
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  openCatalog() {
    const openRequest = indexedDB.open("SylvieCatalog", 1);

    openRequest.onupgradeneeded = ({ target }) => {
      const thisDB = (target as any).result;
      if (thisDB.objectStoreNames.contains("SylvieAKV")) {
        thisDB.deleteObjectStore("SylvieAKV");
      }

      if (!thisDB.objectStoreNames.contains("SylvieAKV")) {
        const objectStore = thisDB.createObjectStore("SylvieAKV", {
          keyPath: "id",
          autoIncrement: true,
        });
        objectStore.createIndex("app", "app", { unique: false });
        objectStore.createIndex("key", "key", { unique: false });
        objectStore.createIndex("appkey", "appkey", { unique: true });
      }
    };

    return openRequest;
  }

  async #initializeCatalog(): Promise<SylvieCatalog> {
    const cat = this;
    const openRequest = this.openCatalog();

    return new Promise((resolve, reject) => {
      openRequest.onsuccess = ({ target }) => {
        cat.db = (target as any).result;
        resolve(cat);
      };

      openRequest.onerror = (e) => {
        reject(e);
      };
    });
  }

  async getAppKeyAsync(
    app,
    key
  ): Promise<
    | {
        app: string;
        appkey: string;
        id: number;
        key: string;
        val: string;
      }
    | {
        id: 0;
        success: false;
      }
  > {
    const transaction = this.db.transaction(["SylvieAKV"], "readonly");
    const store = transaction.objectStore("SylvieAKV");
    const index = store.index("appkey");
    const appkey = `${app},${key}`;
    const request = index.get(appkey);

    return new Promise((resolve, reject) => {
      request.onsuccess = ({ target }) => {
        let lres = (target as any).result;

        if (lres === null || typeof lres === "undefined") {
          lres = {
            id: 0,
            success: false,
          };
        }

        resolve(lres);
      };

      request.onerror = (e) => {
        reject(e);
      };
    });
  }

  async setAppKeyAsync(
    app,
    key,
    val
  ): Promise<{ success: false; error: Error } | { success: true }> {
    const transaction = this.db.transaction(["SylvieAKV"], "readwrite");
    const store = transaction.objectStore("SylvieAKV");
    const index = store.index("appkey");
    const appkey = `${app},${key}`;
    const request = index.get(appkey);

    return new Promise((resolve, reject) => {
      request.onsuccess = ({ target }) => {
        let res = (target as any).result;

        if (res === null || res === undefined) {
          res = {
            app,
            key,
            appkey: `${app},${key}`,
            val,
          };
        } else {
          res.val = val;
        }

        const requestPut = store.put(res);

        requestPut.onerror = () => {
          reject({ success: false, error: requestPut.error });
          console.error("SylvieCatalog.setAppKey (set) onerror");
          console.error(request.error);
        };

        requestPut.onsuccess = () => {
          resolve({ success: true });
        };
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
        console.error("SylvieCatalog.setAppKey (get) onerror");
        console.error(request.error);
      };
    });
  }

  deleteAppKeyAsync(
    id
  ): Promise<{ success: true } | { success: false; error: Error }> {
    const transaction = this.db.transaction(["SylvieAKV"], "readwrite");
    const store = transaction.objectStore("SylvieAKV");
    const request = store.delete(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve({ success: true });
      };

      request.onerror = (e) => {
        reject({ success: false, error: e });
        console.error("SylvieCatalog.deleteAppKey raised onerror");
        console.error(request.error);
      };
    });
  }

  getAppKeys(app, callback) {
    const transaction = this.db.transaction(["SylvieAKV"], "readonly");
    const store = transaction.objectStore("SylvieAKV");
    const index = store.index("app");

    // We want cursor to all values matching our (single) app param
    const singleKeyRange = IDBKeyRange.only(app);

    // To use one of the key ranges, pass it in as the first argument of openCursor()/openKeyCursor()
    const cursor = index.openCursor(singleKeyRange);

    // cursor internally, pushing results into this.data[] and return
    // this.data[] when done (similar to service)
    const localdata = [];

    cursor.onsuccess = ((data, callback) => () => {
      const cur = cursor.result;
      if (cur) {
        const currObject = cur.value;

        data.push(currObject);

        cur.continue();
      } else {
        if (typeof callback === "function") {
          callback(data);
        } else {
          console.log(data);
        }
      }
    })(localdata, callback);

    cursor.onerror = ((usercallback) => (e) => {
      if (typeof usercallback === "function") {
        usercallback(null);
      } else {
        console.error("SylvieCatalog.getAppKeys raised onerror");
        console.error(e);
      }
    })(callback);
  }

  // Hide 'cursoring' and return array of { id: id, key: key }
  getAllKeys(callback) {
    const transaction = this.db.transaction(["SylvieAKV"], "readonly");
    const store = transaction.objectStore("SylvieAKV");
    const cursor = store.openCursor();

    const localdata = [];

    cursor.onsuccess = ((data, callback) => () => {
      const cur = cursor.result;
      if (cur) {
        const currObject = cur.value;

        data.push(currObject);

        cur.continue();
      } else {
        if (typeof callback === "function") {
          callback(data);
        } else {
          console.log(data);
        }
      }
    })(localdata, callback);

    cursor.onerror = ((usercallback) => (e) => {
      if (typeof usercallback === "function") usercallback(null);
    })(callback);
  }
}
