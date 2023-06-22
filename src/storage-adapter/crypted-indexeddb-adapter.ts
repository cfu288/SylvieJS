/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-this-alias */
/*
  Loki IndexedDb Adapter (need to include this script to use it)

  Console Usage can be used for management/diagnostic, here are a few examples :
  adapter.getDatabaseList(); // with no callback passed, this method will log results to console
  adapter.saveDatabase('UserDatabase', JSON.stringify(myDb));
  adapter.loadDatabase('UserDatabase'); // will log the serialized db to console
  adapter.deleteDatabase('UserDatabase');
*/
// @ts-nocheck
import { PersistenceAdapter } from "./persistence-adapter";

// @ts-ignore
const DEBUG = typeof window !== "undefined" && !!window.__loki_idb_debug;

if (DEBUG) {
  console.log("DEBUG: Running crypted-indexeddb-adapter in DEBUG mode");
}

if (!window.crypto.subtle) {
  alert("Required crypto lib is not availible, are you using SSL?");
  throw new Error("Required crypto lib is not availible");
}

const base64abc = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "_",
  "-",
];

const base64codes = (() => {
  const l = 256;
  const base64codes = new Uint8Array(l);
  for (let i = 0; i < l; ++i) {
    base64codes[i] = 255; // invalid character
  }
  base64abc.forEach((char, index) => {
    base64codes[char.charCodeAt(0)] = index;
  });
  base64codes["=".charCodeAt(0)] = 0; // ignored anyway, so we just need to prevent an error
  return base64codes;
})();

function getBase64Code(charCode: number) {
  if (charCode >= base64codes.length) {
    throw new Error("Unable to parse base64 string (code beyond length).");
  }
  const code = base64codes[charCode]!;
  if (code === 255) {
    throw new Error("Unable to parse base64 string (invalid code).");
  }
  return code;
}

export function bytesToBase64(bytes: Uint8Array) {
  let result = "",
    i,
    l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i - 2]! >> 2];
    result += base64abc[((bytes[i - 2]! & 0x03) << 4) | (bytes[i - 1]! >> 4)];
    result += base64abc[((bytes[i - 1]! & 0x0f) << 2) | (bytes[i]! >> 6)];
    result += base64abc[bytes[i]! & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[bytes[i - 2]! >> 2];
    result += base64abc[(bytes[i - 2]! & 0x03) << 4];
    result += "==";
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[bytes[i - 2]! >> 2];
    result += base64abc[((bytes[i - 2]! & 0x03) << 4) | (bytes[i - 1]! >> 4)];
    result += base64abc[(bytes[i - 1]! & 0x0f) << 2];
    result += "=";
  }
  return result;
}

export function base64ToBytes(str: string) {
  if (str.length % 4 !== 0) {
    throw new Error("Unable to parse base64 string (invalid length).");
  }
  const index = str.indexOf("=");
  if (index !== -1 && index < str.length - 2) {
    throw new Error("Unable to parse base64 string (octets).");
  }
  let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0,
    n = str.length,
    result = new Uint8Array(3 * (n / 4)),
    buffer;
  for (let i = 0, j = 0; i < n; i += 4, j += 3) {
    buffer =
      (getBase64Code(str.charCodeAt(i)) << 18) |
      (getBase64Code(str.charCodeAt(i + 1)) << 12) |
      (getBase64Code(str.charCodeAt(i + 2)) << 6) |
      getBase64Code(str.charCodeAt(i + 3));
    result[j] = buffer >> 16;
    result[j + 1] = (buffer >> 8) & 0xff;
    result[j + 2] = buffer & 0xff;
  }
  return result.subarray(0, result.length - missingOctets);
}

export function base64encode(str: string, encoder = new TextEncoder()) {
  return bytesToBase64(encoder.encode(str));
}

export function base64decode(str: string, decoder = new TextDecoder()) {
  return decoder.decode(base64ToBytes(str));
}

const getPasswordKey = (password) => {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
};

const deriveKey = (passwordKey, salt, keyUsage) =>
  window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 250000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    keyUsage
  );

async function encryptData(secretData, password) {
  DEBUG && console.log(`in encryptData(${secretData}, ${password}})`);
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ["encrypt"]);
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      new TextEncoder().encode(secretData)
    );

    const encryptedContentArr = new Uint8Array(encryptedContent);
    const buff = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
    );
    buff.set(salt, 0);
    buff.set(iv, salt.byteLength);
    buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);
    const base64Buff = bytesToBase64(buff);
    return base64Buff;
  } catch (e) {
    console.log(`Error - ${e}`);
    throw e;
  }
}

async function decryptData(encryptedData, password) {
  DEBUG && console.log(`in decryptData(${encryptedData}, ${password}})`);
  try {
    const encryptedDataBuff = base64ToBytes(encryptedData);
    const salt = encryptedDataBuff.slice(0, 16);
    const iv = encryptedDataBuff.slice(16, 16 + 12);
    const data = encryptedDataBuff.slice(16 + 12);
    const passwordKey = await getPasswordKey(password);

    const aesKey = await deriveKey(passwordKey, salt, ["decrypt"]);
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      data
    );
    return new TextDecoder().decode(decryptedContent);
  } catch (e) {
    console.log(`Error - ${e}`);
    throw e;
  }
}

interface CryptedIndexedAdapterOptions {
  closeAfterSave: boolean;
  secret: string;
}
/**
 * Loki persistence adapter class for indexedDb.
 *     This class fulfills abstract adapter interface which can be applied to other storage methods.
 *     Utilizes the included LokiCatalog app/key/value database for actual database persistence.
 *     Indexeddb is highly async, but this adapter has been made 'console-friendly' as well.
 *     Anywhere a callback is omitted, it should return results (if applicable) to console.
 *     IndexedDb storage is provided per-domain, so we implement app/key/value database to
 *     allow separate contexts for separate apps within a domain.
 *
 * @example
 * var idbAdapter = new LokiIndexedAdapter('finance');
 *
 * @constructor LokiIndexedAdapter
 *
 * @param {string} appname - (Optional) Application name context can be used to distinguish subdomains, 'loki' by default
 * @param {CryptedIndexedAdapterOptions} options Configuration options for the adapter
 * @param {boolean} options.closeAfterSave Whether the indexedDB database should be closed after saving.
 * @param {boolean} options.secret The password to encrypt with.
 */
export class CryptedIndexedDBAdapter implements PersistenceAdapter {
  app: string;
  options: Partial<CryptedIndexedAdapterOptions>;
  catalog: SylvieCatalog;
  mode: string;
  loadKey: (dbname: any, callback: any) => void;
  saveKey: (dbname: any, dbstring: any, callback: any) => void;
  deleteKey: (dbname: any, callback: any) => void;
  getKeyList: (callback: any) => void;
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

    if (!this.checkAvailability()) {
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
  closeDatabase() {
    if (this.catalog && this.catalog.db) {
      this.catalog.db.close();
      this.catalog.db = null;
    }
  }

  /**
   * Used to check if adapter is available
   *
   * @returns {boolean} true if indexeddb is available, false if not.
   */
  checkAvailability() {
    if (typeof indexedDB !== "undefined" && indexedDB) return true;
    return false;
  }

  /**
   * Retrieves a serialized db string from the catalog.
   *
   * @example
   * // LOAD
   * var idbAdapter = new LokiIndexedAdapter('finance');
   * var db = new loki('test', { adapter: idbAdapter });
   *   db.loadDatabase(function(result) {
   *   console.log('done');
   * });
   *
   * @param {string} dbname - the name of the database to retrieve.
   * @param {function} callback - callback should accept string param containing serialized db string.
   */
  loadDatabase(dbname: string, callback: (serialized: string) => void) {
    DEBUG && console.debug("loading database");
    const appName = this.app;
    const adapter: CryptedIndexedDBAdapter = this;
    const secret = this.#secret;

    // lazy open/create db reference so dont -need- callback in constructor
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog((catalog) => {
        adapter.catalog = catalog;
        adapter.loadDatabase(dbname, callback);
      });
      return;
    }

    // lookup up dbstring in AKV db
    this.catalog.getAppKey(
      appName,
      dbname,
      (props: {
        app: string;
        appkey: string;
        id: number;
        key: string;
        val: string;
      }) => {
        const { id, val } = props;
        if (typeof callback === "function") {
          if (id === 0) {
            callback(null);
            return;
          }
          const encryptedDbString = val;
          decryptData(encryptedDbString, secret).then((decryptedDbString) => {
            DEBUG && console.debug(`DECRYPTED STRING: ${decryptedDbString}`);
            callback(decryptedDbString);
          });
        } else {
          // support console use of api
          console.log(decryptedDbString);
        }
      }
    );
  }

  /**
   * Saves a serialized db to the catalog.
   *
   * @example
   * // SAVE : will save App/Key/Val as 'finance'/'test'/{serializedDb}
   * var idbAdapter = new LokiIndexedAdapter('finance');
   * var db = new loki('test', { adapter: idbAdapter });
   * var coll = db.addCollection('testColl');
   * coll.insert({test: 'val'});
   * db.saveDatabase();  // could pass callback if needed for async complete
   *
   * @param {string} dbname - the name to give the serialized database within the catalog.
   * @param {string} dbstring - the serialized db string to save.
   * @param {function} callback - (Optional) callback passed obj.success with true or false
   * @memberof LokiIndexedAdapter
   */
  saveDatabase(
    dbname: string,
    dbstring: string,
    callback?: (err: Error) => void
  ) {
    DEBUG &&
      console.debug(`in saveDatabase(${dbname}, ${dbstring}, ${callback})`);
    const appName = this.app;
    const adapter = this;
    const secret = this.#secret;

    function saveCallback(result: { success: boolean }) {
      if (result === null) {
        callback(undefined);
      }
      if (result && result.success === true) {
        callback(undefined);
      } else {
        callback(undefined);

        // callback(new Error("Error saving database"));
      }

      if (adapter.options.closeAfterSave) {
        adapter.closeDatabase();
      }
    }
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog(() => {
        adapter.saveDatabase(dbname, dbstring, saveCallback);
      });

      return;
    }

    encryptData(dbstring, secret).then((encryptedDbString) => {
      // lazy open/create db reference so dont -need- callback in constructor

      DEBUG && console.debug(`ENCRYPTED STRING: ${encryptedDbString}`);
      // set (add/update) entry to AKV database
      this.catalog.setAppKey(appName, dbname, encryptedDbString, saveCallback);
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
   * @memberof LokiIndexedAdapter
   */
  deleteDatabase(dbname: string, callback?: (_: any) => any) {
    const appName = this.app;
    const adapter = this;

    // lazy open/create db reference and pass callback ahead
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog((catalog) => {
        adapter.catalog = catalog;
        adapter.deleteDatabase(dbname, callback);
      });

      return;
    }

    // catalog was already initialized, so just lookup object and delete by id
    this.catalog.getAppKey(appName, dbname, (result) => {
      const id = result.id;

      if (id !== 0) {
        adapter.catalog.deleteAppKey(id, callback);
      } else if (typeof callback === "function") {
        callback({ success: true });
      }
    });
  }

  /**
   * Removes all database partitions and pages with the base filename passed in.
   * This utility method does not (yet) guarantee async deletions will be completed before returning
   *
   * @param {string} dbname - the base filename which container, partitions, or pages are derived
   * @memberof LokiIndexedAdapter
   */
  deleteDatabasePartitions(dbname) {
    const self = this;
    this.getDatabaseList((result) => {
      result.forEach((str) => {
        if (str.startsWith(dbname)) {
          self.deleteDatabase(str);
        }
      });
    });
  }

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
   * @memberof LokiIndexedAdapter
   */
  getDatabaseList(callback) {
    const appName = this.app;
    const adapter = this;

    // lazy open/create db reference so dont -need- callback in constructor
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog((cat) => {
        adapter.catalog = cat;

        adapter.getDatabaseList(callback);
      });

      return;
    }

    // catalog already initialized
    // get all keys for current appName, and transpose results so just string array
    this.catalog.getAppKeys(appName, (results) => {
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
  }

  /**
   * Allows retrieval of list of all keys in catalog along with size
   *
   * @param {function} callback - (Optional) callback to accept result array.
   * @memberof LokiIndexedAdapter
   */
  getCatalogSummary(callback) {
    const appName = this.app;
    const adapter = this;

    // lazy open/create db reference
    if (this.catalog === null || this.catalog.db === null) {
      this.catalog = new SylvieCatalog((cat) => {
        adapter.catalog = cat;

        adapter.getCatalogSummary(callback);
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
  }
}

// alias
CryptedIndexedDBAdapter.prototype.loadKey =
  CryptedIndexedDBAdapter.prototype.loadDatabase;

// alias
CryptedIndexedDBAdapter.prototype.saveKey =
  CryptedIndexedDBAdapter.prototype.saveDatabase;

// alias
CryptedIndexedDBAdapter.prototype.deleteKey =
  CryptedIndexedDBAdapter.prototype.deleteDatabase;

// alias
CryptedIndexedDBAdapter.prototype.getKeyList =
  CryptedIndexedDBAdapter.prototype.getDatabaseList;

/**
 * LokiCatalog - underlying App/Key/Value catalog persistence
 *    This non-interface class implements the actual persistence.
 *    Used by the IndexedDBAdapter class.
 */
class SylvieCatalog {
  db: IDBDatabase;
  constructor(callback) {
    this.db = null;
    this.initializeLokiCatalog(callback);
  }

  initializeLokiCatalog(callback) {
    const openRequest = indexedDB.open("SylvieCatalog", 1);
    const cat = this;

    // If database doesn't exist yet or its version is lower than our version specified above (2nd param in line above)
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
        // hack to simulate composite key since overhead is low (main size should be in val field)
        // user (me) required to duplicate the app and key into comma delimited appkey field off object
        // This will allow retrieving single record with that composite key as well as
        // still supporting opening cursors on app or key alone
        objectStore.createIndex("appkey", "appkey", { unique: true });
      }
    };

    openRequest.onsuccess = ({ target }) => {
      cat.db = (target as any).result;

      if (typeof callback === "function") {
        callback(cat);
      }
    };

    openRequest.onerror = (e) => {
      throw e;
    };
  }

  getAppKey(app, key, callback) {
    const transaction = this.db.transaction(["SylvieAKV"], "readonly");
    const store = transaction.objectStore("SylvieAKV");
    const index = store.index("appkey");
    const appkey = `${app},${key}`;
    const request = index.get(appkey);

    request.onsuccess = (
      (usercallback) =>
      ({ target }) => {
        let lres = (target as any).result;

        if (lres === null || typeof lres === "undefined") {
          lres = {
            id: 0,
            success: false,
          };
        }

        if (typeof usercallback === "function") {
          usercallback(lres);
        } else {
          console.log(lres);
        }
      }
    )(callback);

    request.onerror = ((usercallback) => (e) => {
      if (typeof usercallback === "function") {
        usercallback({ id: 0, success: false });
      } else {
        throw e;
      }
    })(callback);
  }

  getAppKeyById(id, callback, data) {
    const transaction = this.db.transaction(["SylvieAKV"], "readonly");
    const store = transaction.objectStore("SylvieAKV");
    const request = store.get(id);

    request.onsuccess = (
      (data, usercallback) =>
      ({ target }) => {
        if (typeof usercallback === "function") {
          usercallback((target as any).result, data);
        } else {
          console.log((target as any).result);
        }
      }
    )(data, callback);
  }

  setAppKey(app, key, val, callback) {
    const transaction = this.db.transaction(["SylvieAKV"], "readwrite");
    const store = transaction.objectStore("SylvieAKV");
    const index = store.index("appkey");
    const appkey = `${app},${key}`;
    const request = index.get(appkey);

    // first try to retrieve an existing object by that key
    // need to do this because to update an object you need to have id in object, otherwise it will append id with new autocounter and clash the unique index appkey
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

      requestPut.onerror = ((usercallback) => (e) => {
        if (typeof usercallback === "function") {
          usercallback({ success: false });
        } else {
          console.error("SylvieCatalog.setAppKey (set) onerror");
          console.error(request.error);
        }
      })(callback);

      requestPut.onsuccess = ((usercallback) => (e) => {
        if (typeof usercallback === "function") {
          usercallback({ success: true });
        }
      })(callback);
    };

    request.onerror = ((usercallback) => (e) => {
      if (typeof usercallback === "function") {
        usercallback({ success: false });
      } else {
        console.error("SylvieCatalog.setAppKey (get) onerror");
        console.error(request.error);
      }
    })(callback);
  }

  deleteAppKey(id, callback: (result: { success: boolean }) => void) {
    const transaction = this.db.transaction(["SylvieAKV"], "readwrite");
    const store = transaction.objectStore("SylvieAKV");
    const request = store.delete(id);

    request.onsuccess = ((usercallback) => (evt) => {
      if (typeof usercallback === "function") usercallback({ success: true });
    })(callback);

    request.onerror = ((usercallback) => (evt) => {
      if (typeof usercallback === "function") {
        usercallback({ success: false });
      } else {
        console.error("SylvieCatalog.deleteAppKey raised onerror");
        console.error(request.error);
      }
    })(callback);
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

    cursor.onsuccess = (
      (data, callback) =>
      ({ target }) => {
        const cursor = target.result;
        if (cursor) {
          const currObject = cursor.value;

          data.push(currObject);

          cursor.continue();
        } else {
          if (typeof callback === "function") {
            callback(data);
          } else {
            console.log(data);
          }
        }
      }
    )(localdata, callback);

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

    cursor.onsuccess = (
      (data, callback) =>
      ({ target }) => {
        const cursor = target.result;
        if (cursor) {
          const currObject = cursor.value;

          data.push(currObject);

          cursor.continue();
        } else {
          if (typeof callback === "function") {
            callback(data);
          } else {
            console.log(data);
          }
        }
      }
    )(localdata, callback);

    cursor.onerror = ((usercallback) => (e) => {
      if (typeof usercallback === "function") usercallback(null);
    })(callback);
  }
}

if (typeof window !== "undefined") {
  Object.assign(window, { IndexedDBAdapter: CryptedIndexedDBAdapter });
}
