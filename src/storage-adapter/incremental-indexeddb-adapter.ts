/* eslint-disable @typescript-eslint/no-this-alias */
import Collection from "../database/collection";
import { CollectionDocument } from "../database/collection/collection-document";
import Sylvie from "../sylviejs";
import { IncrementalPersistenceAdapter } from "./src/models/persistence-adapter";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";

const DEBUG =
  // @ts-ignore
  typeof window !== "undefined" && !!window.__loki_incremental_idb_debug;

type LokiIncrementalChunk = {
  key: string;
  index: number;
  value: Partial<CollectionDocument>;
  collectionName: string;
  type: "loki";
};

export type IncrementalChunk = (
  | LokiIncrementalChunk
  | {
      key: string;
      index: number;
      value: Partial<CollectionDocument> | string;
      collectionName: string;
      dataChunks: LokiIncrementalChunk[];
      type: "data";
    }
  | {
      key: string;
      index: number;
      value: Partial<CollectionDocument>;
      collectionName: string;
      metadata: LokiIncrementalChunk;
      dataChunks: LokiIncrementalChunk[];
      type: "metadata";
    }
) &
  Partial<CollectionDocument>;

export interface IncrementalIndexedDBAdapterOptions {
  onversionchange?: (versionChangeEvent: IDBVersionChangeEvent) => void;
  onFetchStart?: () => void;
  onDidOverwrite?: () => void;
  serializeChunk?: (
    collectionName: string,
    chunk: IncrementalChunk[],
  ) => string;
  serializeChunkAsync?: (
    collectionName: string,
    chunk: IncrementalChunk[],
  ) => Promise<string>;
  deserializeChunk?: (
    collectionName: string,
    chunkString: string,
  ) => IncrementalChunk[];
  deserializeChunkAsync?: (
    collectionName: string,
    chunkString: string,
  ) => Promise<IncrementalChunk[]>;
  megachunkCount?: number;
  lazyCollections?: string[];
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
 * @param {function} options.(isData && isLazy))
 *  Called with a chunk (array of Loki documents) before
 *     it's saved to IndexedDB. You can use it to manually compress on-disk representation
 *     for faster database loads. Hint: Hand-written conversion of objects to arrays is very
 *     profitable for performance. If you use this, you must also pass options.deserializeChunk.
 * @param {function} options.deserializeChunk Called with a chunk serialized with options.serializeChunk
 *     Expects an array of Loki documents as the return value
 * @param {number} options.megachunkCount Number of parallel requests for data when loading database.
 *     Can be tuned for a specific application
 * @param {array} options.lazyCollections Names of collections that should be deserialized lazily
 *     Only use this for collections that aren't used at launch
 */
export class IncrementalIndexedDBAdapter
  implements IncrementalPersistenceAdapter
{
  mode: "incremental";
  options: Partial<IncrementalIndexedDBAdapterOptions>;
  chunkSize: number;
  megachunkCount: number;
  lazyCollections: string[];
  idb: null | IDBDatabase;
  _prevLokiVersionId: string | null;
  _prevCollectionVersionIds: {};
  operationInProgress: any;
  idbInitInProgress: any;

  constructor(options?: Partial<IncrementalIndexedDBAdapterOptions>) {
    this.mode = "incremental";
    this.options = options || {};
    this.chunkSize = 100;
    this.megachunkCount = this.options.megachunkCount || 24;
    this.lazyCollections = this.options.lazyCollections || [];
    this.idb = null; // will be lazily loaded on first operation that needs it
    this._prevLokiVersionId = null;
    this._prevCollectionVersionIds = {};

    if (!(this.megachunkCount >= 4 && this.megachunkCount % 2 === 0)) {
      throw new Error("megachunkCount must be >=4 and divisible by 2");
    }

    if (this.options.serializeChunk && !this.options.deserializeChunk) {
      throw new Error(
        "serializeChunk requires deserializeChunk to be set as well",
      );
    }

    if (
      [
        !!this.options.serializeChunkAsync,
        !!this.options.deserializeChunkAsync,
      ].filter(Boolean).length === 1
    ) {
      throw new Error(
        "serializeChunkAsync requires deserializeChunkAsync to be set as well",
      );
    }

    // deserializeChunkAsync is not supported if lazyCollections is set
    if (this.options.deserializeChunkAsync && this.lazyCollections.length > 0) {
      throw new Error(
        "deserializeChunkAsync is not supported if lazyCollections is set",
      );
    }
  }

  // chunkId - index of the data chunk - e.g. chunk 0 will be lokiIds 0-99
  _getChunk(collection: Collection<IncrementalChunk>, chunkId: number) {
    // 0-99, 100-199, etc.
    const minId = chunkId * this.chunkSize;
    const maxId = minId + this.chunkSize - 1;

    // use idIndex to find first collection.data position within the $loki range
    collection.ensureId();
    const idIndex = collection.idIndex;

    let firstDataPosition = null;

    let max = idIndex.length - 1;
    let min = 0;
    let mid;

    while (idIndex[min] < idIndex[max]) {
      mid = (min + max) >> 1;

      if (idIndex[mid] < minId) {
        min = mid + 1;
      } else {
        max = mid;
      }
    }

    if (max === min && idIndex[min] >= minId && idIndex[min] <= maxId) {
      firstDataPosition = min;
    }

    if (firstDataPosition === null) {
      // no elements in this chunk
      return [];
    }

    // find last position
    // if loki IDs are contiguous (no removed elements), last position will be first + chunk - 1
    // (and we look back in case there are missing pieces)
    // TODO: Binary search (not as important as first position, worst case scanario is only chunkSize steps)
    let lastDataPosition = null;
    for (
      let i = firstDataPosition + this.chunkSize - 1;
      i >= firstDataPosition;
      i--
    ) {
      if (idIndex[i] <= maxId) {
        lastDataPosition = i;
        break;
      }
    }

    // verify
    const firstElement = collection.data[firstDataPosition];
    if (
      !(
        firstElement &&
        firstElement.$loki >= minId &&
        firstElement.$loki <= maxId
      )
    ) {
      throw new Error("broken invariant firstelement");
    }

    const lastElement = collection.data[lastDataPosition];
    if (
      !(lastElement && lastElement.$loki >= minId && lastElement.$loki <= maxId)
    ) {
      throw new Error("broken invariant lastElement");
    }

    // this will have *up to* 'this.chunkSize' elements (might have less, because $loki ids
    // will have holes when data is deleted)
    const chunkData = collection.data.slice(
      firstDataPosition,
      lastDataPosition + 1,
    );

    if (chunkData.length > this.chunkSize) {
      throw new Error("broken invariant - chunk size");
    }

    return chunkData;
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
  saveDatabase = (
    dbname: string,
    getLokiCopy: () => Sylvie,
    callback: PersistenceAdapterCallback,
  ) => {
    const that = this;

    if (!this.idb) {
      this._initializeIDBAsync(dbname)
        .then(() => {
          that.saveDatabase(dbname, getLokiCopy, callback);
        })
        .catch(callback);
      return;
    }

    if (this.operationInProgress) {
      throw new Error(
        "Error while saving to database - another operation is already in progress. Please use throttledSaves=true option on Loki object",
      );
    }
    this.operationInProgress = true;

    DEBUG && console.log("saveDatabase - begin");
    DEBUG && console.time("saveDatabase");
    function finish(e?: Error | null) {
      DEBUG && e && console.error(e);
      DEBUG && console.timeEnd("saveDatabase");
      that.operationInProgress = false;
      callback(e);
    }

    // try..catch is required, e.g.:
    // InvalidStateError: Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.
    // (this may happen if another tab has called deleteDatabase)
    try {
      let updatePrevVersionIds = () => {
        console.error(
          "Unexpected successful tx - cannot update previous version ids",
        );
      };
      let didOverwrite = false;

      const tx = this.idb.transaction(["LokiIncrementalData"], "readwrite");
      tx.oncomplete = () => {
        updatePrevVersionIds();
        finish();
        if (didOverwrite && that.options.onDidOverwrite) {
          that.options.onDidOverwrite();
        }
      };

      tx.onerror = () => {
        finish(tx.error);
      };

      tx.onabort = () => {
        finish(tx.error);
      };

      const store = tx.objectStore("LokiIncrementalData");

      const performSaveAsync = async (maxChunkIds?: Record<string, number>) => {
        try {
          const incremental = !maxChunkIds;
          const chunkInfo = await that._putInChunksAsync(
            store,
            getLokiCopy(),
            incremental,
            maxChunkIds,
          );
          // Update last seen version IDs, but only after the transaction is successful
          updatePrevVersionIds = () => {
            that._prevLokiVersionId = chunkInfo.lokiVersionId;
            chunkInfo.collectionVersionIds.forEach(({ name, versionId }) => {
              that._prevCollectionVersionIds[name] = versionId;
            });
          };
          tx.commit && tx.commit();
        } catch (error) {
          console.error("idb performSave failed: ", error);
          tx.abort();
        }
      };

      // Incrementally saving changed chunks breaks down if there is more than one writer to IDB
      // (multiple tabs of the same web app), leading to data corruption. To fix that, we save all
      // metadata chunks (loki + collections) with a unique ID on each save and remember it. Before
      // the subsequent save, we read loki from IDB to check if its version ID changed. If not, we're
      // guaranteed that persisted DB is consistent with our diff. Otherwise, we fall back to the slow
      // path and overwrite *all* database chunks with our version. Both reading and writing must
      // happen in the same IDB transaction for this to work.
      // TODO: We can optimize the slow path by fetching collection metadata chunks and comparing their
      // version IDs with those last seen by us. Since any change in collection data requires a metadata
      // chunk save, we're guaranteed that if the IDs match, we don't need to overwrite chukns of this collection
      const getAllKeysThenSaveAsync = async () => {
        // NOTE: We must fetch all keys to protect against a case where another tab has wrote more
        // chunks whan we did -- if so, we must delete them.
        try {
          const result = await idbReqAsync(store.getAllKeys());
          const maxChunkIds = getMaxChunkIds(result);
          await performSaveAsync(maxChunkIds);
        } catch (e) {
          console.error("Getting all keys failed: ", e);
          tx.abort();
        }
      };

      const getLokiThenSaveAsync = async () => {
        try {
          const result = await idbReqAsync(store.get("loki"));
          if (lokiChunkVersionId(result) === that._prevLokiVersionId) {
            await performSaveAsync();
          } else {
            DEBUG &&
              console.warn(
                "Another writer changed Loki IDB, using slow path...",
              );
            didOverwrite = true;
            await getAllKeysThenSaveAsync();
          }
        } catch (e) {
          console.error("Getting loki chunk failed: ", e);
          tx.abort();
        }
      };

      getLokiThenSaveAsync().catch((e) => finish(e));
    } catch (error) {
      finish(error);
    }
  };

  async _putInChunksAsync(
    idbStore: IDBObjectStore,
    loki: Sylvie & { idbVersionId?: string },
    incremental: boolean,
    maxChunkIds: Record<string, number>,
  ) {
    const that = this;
    const collectionVersionIds = [];
    let savedSize = 0;

    const prepareCollectionAsync = async (collection, i) => {
      // Find dirty chunk ids
      const dirtyChunks = new Set();
      incremental &&
        collection.dirtyIds.forEach((lokiId) => {
          const chunkId = (lokiId / that.chunkSize) | 0;
          dirtyChunks.add(chunkId);
        });

      collection.dirtyIds = [];

      // Serialize chunks to save
      const prepareChunkAsync = async (chunkId) => {
        let chunkData: string | IncrementalChunk[] = that._getChunk(
          collection,
          chunkId,
        );

        if (that.options.serializeChunk) {
          chunkData = that.options.serializeChunk(collection.name, chunkData);
        }
        if (that.options.serializeChunkAsync) {
          chunkData = await that.options.serializeChunkAsync(
            collection.name,
            chunkData as IncrementalChunk[],
          );
        }

        // we must stringify now, because IDB is asynchronous, and underlying objects are mutable
        // In general, it's also faster to stringify, because we need serialization anyway, and
        // JSON.stringify is much better optimized than IDB's structured clone
        chunkData = JSON.stringify(chunkData);
        // console.warn(chunkData);
        savedSize += chunkData.length;
        DEBUG &&
          incremental &&
          console.log(`Saving: ${collection.name}.chunk.${chunkId}`);

        const res = idbStore.put({
          key: `${collection.name}.chunk.${chunkId}`,
          value: chunkData,
        });

        return new Promise((resolve, reject) => {
          res.onsuccess = () => resolve(res.result);
          res.onerror = () => reject(res.error);
        });
      };

      if (incremental) {
        await Promise.all([...dirtyChunks].map(prepareChunkAsync));
      } else {
        // add all chunks
        const maxChunkId = (collection.maxId / that.chunkSize) | 0;
        for (let j = 0; j <= maxChunkId; j += 1) {
          await prepareChunkAsync(j);
        }

        // delete chunks with larger ids than what we have
        // NOTE: we don't have to delete metadata chunks as they will be absent from loki anyway
        // NOTE: failures are silently ignored, so we don't have to worry about holes
        const persistedMaxChunkId = maxChunkIds[collection.name] || 0;
        for (let k = maxChunkId + 1; k <= persistedMaxChunkId; k += 1) {
          const deletedChunkName = `${collection.name}.chunk.${k}`;
          idbStore.delete(deletedChunkName);
          DEBUG && console.warn(`Deleted chunk: ${deletedChunkName}`);
        }
      }

      // save collection metadata as separate chunk (but only if changed)
      if (collection.dirty || dirtyChunks.size || !incremental) {
        collection.idIndex = []; // this is recreated lazily
        collection.data = [];
        collection.idbVersionId = randomVersionId();
        collectionVersionIds.push({
          name: collection.name,
          versionId: collection.idbVersionId,
        });

        const metadataChunk = JSON.stringify(collection);
        savedSize += metadataChunk.length;
        DEBUG &&
          incremental &&
          console.log(`Saving: ${collection.name}.metadata`);
        const metaPutRes = idbStore.put({
          key: `${collection.name}.metadata`,
          value: metadataChunk,
        });

        await new Promise((resolve, reject) => {
          metaPutRes.onsuccess = () => {
            resolve(metaPutRes.result);
          };
          metaPutRes.onerror = () => {
            reject(metaPutRes.error);
          };
        });
      }

      // leave only names in the loki chunk
      loki.collections[i] = { name: collection.name } as Collection<
        Partial<CollectionDocument>
      >;
    };

    for (const [i, collection] of loki.collections.entries()) {
      try {
        await prepareCollectionAsync(collection, i);
      } catch (e) {
        console.error(e);
        throw e;
      }
    }

    // await Promise.all(
    //   [...loki.collections.entries()].map(async ([i, collection]) => {
    //     return prepareCollectionAsync(collection, i);
    //   }),
    // );

    loki.idbVersionId = randomVersionId();
    const serializedMetadata = JSON.stringify(loki);
    savedSize += serializedMetadata.length;

    DEBUG && incremental && console.log("Saving: loki");

    const serMetaPutReq = idbStore.put({
      key: "loki",
      value: serializedMetadata,
    });

    await new Promise((resolve, reject) => {
      serMetaPutReq.onsuccess = () => {
        resolve(serMetaPutReq.result);
      };
      serMetaPutReq.onerror = () => {
        reject(serMetaPutReq.error);
      };
    });

    DEBUG && console.log(`saved size: ${savedSize}`);
    return {
      lokiVersionId: loki.idbVersionId,
      collectionVersionIds,
    };
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
  loadDatabase(
    dbname: string,
    callback: (value: string | Error | null) => void,
  ) {
    const that = this;

    if (this.operationInProgress) {
      throw new Error(
        "Error while loading database - another operation is already in progress. Please use throttledSaves=true option on Loki object",
      );
    }

    this.operationInProgress = true;

    DEBUG && console.log("loadDatabase - begin");
    DEBUG && console.time("loadDatabase");

    const finish = (value: string | Error | null) => {
      // console.log(
      //   "finish with ",
      //   "<<",
      //   typeof value,
      //   ": error: ",
      //   value instanceof Error,
      //   ">>",
      // );
      DEBUG && console.timeEnd("loadDatabase");
      that.operationInProgress = false;
      callback(value);
    };

    this._getAllChunksAsync(dbname).then(async (chunks: any[]) => {
      try {
        if (!Array.isArray(chunks)) {
          throw chunks; // we have an error
        }

        if (!chunks.length) {
          return finish(null);
        }

        DEBUG && console.log("Found chunks:", chunks.length);

        // repack chunks into a map
        let n_chunks = chunksToMap(chunks);
        const loki = n_chunks.loki;

        // populate collections with data
        populateLoki(
          n_chunks.loki,
          n_chunks.chunkMap,
          that.options.deserializeChunk,
          that.lazyCollections,
        );

        n_chunks = null; // gc

        // remember previous version IDs
        that._prevLokiVersionId = loki.idbVersionId || null;
        that._prevCollectionVersionIds = {};
        // console.log(loki.collections);
        loki.collections.forEach(({ name, idbVersionId }) => {
          that._prevCollectionVersionIds[name] = idbVersionId || null;
        });

        // console.log("PRINT COLL");
        // console.log(loki.collections);

        return finish(loki);
      } catch (error) {
        that._prevLokiVersionId = null;
        that._prevCollectionVersionIds = {};
        return finish(Error(error));
      }
    });
  }

  async _initializeIDBAsync(dbname: string) {
    return new Promise((resolve, reject) => {
      this._initializeIDB(dbname, reject, resolve);
    });
  }

  _initializeIDB(dbname: string, onError, onSuccess) {
    const that = this;
    DEBUG && console.log("initializing idb");

    if (this.idbInitInProgress) {
      throw new Error(
        "Cannot open IndexedDB because open is already in progress",
      );
    }
    this.idbInitInProgress = true;

    const openRequest = indexedDB.open(dbname, 1);

    openRequest.onupgradeneeded = ({ oldVersion }) => {
      const db = openRequest.result;
      DEBUG && console.log(`onupgradeneeded, old version: ${oldVersion}`);

      if (oldVersion < 1) {
        // Version 1 - Initial - Create database
        db.createObjectStore("LokiIncrementalData", { keyPath: "key" });
      } else {
        // Unknown version
        throw new Error(
          `Invalid old version ${oldVersion} for IndexedDB upgrade`,
        );
      }
    };

    openRequest.onsuccess = () => {
      that.idbInitInProgress = false;
      const db = openRequest.result;
      that.idb = db;

      if (!db.objectStoreNames.contains("LokiIncrementalData")) {
        onError(new Error("Missing LokiIncrementalData"));
        // Attempt to recover (after reload) by deleting database, since it's damaged anyway
        that.deleteDatabase(dbname);
        return;
      }

      DEBUG && console.log("init success");

      db.onversionchange = (versionChangeEvent) => {
        // Ignore if database was deleted and recreated in the meantime
        if (that.idb !== db) {
          return;
        }

        DEBUG && console.log("IDB version change", versionChangeEvent);
        // This function will be called if another connection changed DB version
        // (Most likely database was deleted from another browser tab, unless there's a new version
        // of this adapter, or someone makes a connection to IDB outside of this adapter)
        // We must close the database to avoid blocking concurrent deletes.
        // The database will be unusable after this. Be sure to supply `onversionchange` option
        // to force logout
        that.idb.close();
        that.idb = null;
        if (that.options.onversionchange) {
          that.options.onversionchange(versionChangeEvent);
        }
      };

      onSuccess();
    };

    openRequest.onblocked = (e) => {
      console.error("IndexedDB open is blocked", e);
      onError(new Error("IndexedDB open is blocked by open connection"));
    };

    openRequest.onerror = (e) => {
      that.idbInitInProgress = false;
      console.error("IndexedDB open error", e);
      onError(e);
    };
  }

  async _getAllChunksAsync(dbname: string): Promise<any[]> {
    const that = this;
    return new Promise((resolve, reject) => {
      if (!this.idb) {
        this._initializeIDBAsync(dbname)
          .then(() => {
            that._getAllChunksAsync(dbname).then((result) => {
              resolve(result);
            });
          })
          .catch(reject);
        return;
      }

      const tx = this.idb.transaction(["LokiIncrementalData"], "readonly");
      const store = tx.objectStore("LokiIncrementalData");

      const deserializeChunkAsync = this.options.deserializeChunkAsync;
      const deserializeChunk = this.options.deserializeChunk;
      const lazyCollections = this.lazyCollections;

      // If there are a lot of chunks (>100), don't request them all in one go, but in multiple
      // "megachunks" (chunks of chunks). This improves concurrency, as main thread is already busy
      // while IDB process is still fetching data. Details:

      async function getMegachunksAsync(keys: IDBValidKey[]) {
        const megachunkCount = that.megachunkCount;
        const keyRanges = createKeyRanges(keys, megachunkCount);

        const allChunks = [];
        let megachunksReceived = 0;

        async function processMegachunkAsync(
          result,
          megachunkIndex: number,
          keyRange: { lower: number; upper: number },
        ) {
          const debugMsg =
            "processing chunk " +
            megachunkIndex +
            " (" +
            keyRange.lower +
            " -- " +
            keyRange.upper +
            ")";
          DEBUG && console.time(debugMsg);
          const megachunk = result;

          for (const [i, chunk] of megachunk.entries()) {
            await parseChunkAsync(
              chunk,
              deserializeChunkAsync,
              deserializeChunk,
              lazyCollections,
            );
            allChunks.push(chunk);
            megachunk[i] = null; // gc
          }

          DEBUG && console.timeEnd(debugMsg);

          megachunksReceived += 1;
          if (megachunksReceived === megachunkCount) {
            resolve(allChunks);
          }
        }

        // Stagger megachunk requests - first one half, then request the second when first one comes
        // back. This further improves concurrency.
        const megachunkWaves = 2;
        const megachunksPerWave = megachunkCount / megachunkWaves;
        function requestMegachunk(index, wave) {
          const keyRange = keyRanges[index];
          idbReqAsync(store.getAll(keyRange))
            .then(async (e) => {
              if (wave < megachunkWaves) {
                requestMegachunk(index + megachunksPerWave, wave + 1);
              }

              await processMegachunkAsync(e, index, keyRange);
            })
            .catch((e) => {
              reject(e);
            });
        }

        for (let i = 0; i < megachunksPerWave; i += 1) {
          requestMegachunk(i, 1);
        }
      }

      async function getAllChunksAsync() {
        const result = await idbReqAsync(store.getAll());
        const allChunks = result as any[];
        for (const ch of allChunks) {
          await parseChunkAsync(
            ch,
            deserializeChunkAsync,
            deserializeChunk,
            lazyCollections,
          );
        }
        resolve(allChunks);
      }

      async function getAllKeysAsync() {
        async function onDidGetKeysAsync(keys: IDBValidKey[]) {
          keys.sort();
          if (keys.length > 100) {
            await getMegachunksAsync(keys);
          } else {
            await getAllChunksAsync();
          }
        }

        idbReqAsync(store.getAllKeys())
          .then(async (result) => {
            await onDidGetKeysAsync(result as IDBValidKey[]);
          })
          .catch((e) => {
            reject(e);
          });

        if (that.options.onFetchStart) {
          that.options.onFetchStart();
        }
      }

      getAllKeysAsync().then(() => {
        return;
      });
    });
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
  deleteDatabase(dbname: string, callback?: PersistenceAdapterCallback) {
    if (this.operationInProgress) {
      throw new Error(
        "Error while deleting database - another operation is already in progress. Please use throttledSaves=true option on Loki object",
      );
    }

    this.operationInProgress = true;

    const that = this;
    DEBUG && console.log("deleteDatabase - begin");
    DEBUG && console.time("deleteDatabase");

    this._prevLokiVersionId = null;
    this._prevCollectionVersionIds = {};

    if (this.idb) {
      this.idb.close();
      this.idb = null;
    }

    const request = indexedDB.deleteDatabase(dbname);

    request.onsuccess = () => {
      that.operationInProgress = false;
      DEBUG && console.timeEnd("deleteDatabase");
      callback({ success: true });
    };

    request.onerror = (e) => {
      that.operationInProgress = false;
      console.error("Error while deleting database", e);
      callback({ success: false, error: request.error });
    };

    request.onblocked = (e) => {
      // We can't call callback with failure status, because this will be called even if we
      // succeed in just a moment
      console.error(
        "Deleting database failed because it's blocked by another connection",
        e,
      );
    };
  }
}

// gets current largest chunk ID for each collection
function getMaxChunkIds(allKeys) {
  const maxChunkIds = {};

  allKeys.forEach((key) => {
    const keySegments = key.split(".");
    // table.chunk.2317
    if (keySegments.length === 3 && keySegments[1] === "chunk") {
      const collection = keySegments[0];
      const chunkId = parseInt(keySegments[2]) || 0;
      const currentMax = maxChunkIds[collection];

      if (!currentMax || chunkId > currentMax) {
        maxChunkIds[collection] = chunkId;
      }
    }
  });
  return maxChunkIds;
}

function lokiChunkVersionId(chunk) {
  try {
    if (chunk) {
      const loki = JSON.parse(chunk.value);
      return loki.idbVersionId || null;
    } else {
      return null;
    }
  } catch (e) {
    console.error("Error while parsing loki chunk", e);
    return null;
  }
}

function chunksToMap(chunks: IncrementalChunk[]): {
  loki: Sylvie;
  chunkMap: Record<string, IncrementalChunk>;
} {
  let loki;
  const chunkMap = {};

  sortChunksInPlace(chunks);

  chunks.forEach((chunk) => {
    const type = chunk.type;
    const value = chunk.value;
    const name = chunk.collectionName;
    if (type === "loki") {
      loki = value;
    } else if (type === "data") {
      if (chunkMap[name]) {
        chunkMap[name].dataChunks.push(value);
      } else {
        chunkMap[name] = {
          metadata: null,
          dataChunks: [value],
        };
      }
    } else if (type === "metadata") {
      if (chunkMap[name]) {
        chunkMap[name].metadata = value;
      } else {
        chunkMap[name] = { metadata: value, dataChunks: [] };
      }
    } else {
      throw new Error("unreachable");
    }
  });

  if (!loki) {
    throw new Error("Corrupted database - missing database metadata");
  }

  return { loki, chunkMap };
}

function populateLoki(
  {
    collections,
  }: Sylvie & {
    collections: Collection<IncrementalChunk & Partial<CollectionDocument>>[];
  },
  chunkMap: Record<string, any>,
  deserializeChunk: (collectionName: string, chunk: any) => any,
  lazyCollections: string[],
) {
  collections.forEach(function populateCollection(collectionStub, i) {
    const name = collectionStub.name;

    const chunkCollection = chunkMap[name];
    if (chunkCollection) {
      if (!chunkCollection.metadata) {
        throw new Error(
          `Corrupted database - missing metadata chunk for ${name}`,
        );
      }
      const collection = chunkCollection.metadata;
      chunkCollection.metadata = null;
      collections[i] = collection;

      const isLazy = lazyCollections.includes(name);
      const lokiDeserializeCollectionChunks = () => {
        DEBUG && isLazy && console.log(`lazy loading ${name}`);
        const data = [];
        const dataChunks = chunkCollection.dataChunks;

        dataChunks.forEach(function populateChunk(chunk, i) {
          if (isLazy) {
            chunk = JSON.parse(chunk);
            if (deserializeChunk) {
              chunk = deserializeChunk(name, chunk);
            }
          }
          chunk.forEach((doc) => {
            data.push(doc);
          });
          dataChunks[i] = null;
        });
        // console.log("data");
        // console.log(data);
        return data;
      };
      collection.getData = lokiDeserializeCollectionChunks;
    }
  });
}

function classifyChunk(chunk: IncrementalChunk) {
  const key = chunk.key;

  if (key === "loki") {
    chunk.type = "loki";
    return;
  } else if (key.includes(".")) {
    const keySegments = key.split(".");
    if (keySegments.length === 3 && keySegments[1] === "chunk") {
      chunk.type = "data";
      chunk.collectionName = keySegments[0];
      chunk.index = parseInt(keySegments[2], 10);
      return;
    } else if (keySegments.length === 2 && keySegments[1] === "metadata") {
      chunk.type = "metadata";
      chunk.collectionName = keySegments[0];
      return;
    }
  }

  console.error(`Unknown chunk ${key}`);
  throw new Error("Corrupted database - unknown chunk found");
}

// rewrite parseChunk to use Async and deserializeChunkAsync
async function parseChunkAsync(
  chunk: IncrementalChunk,
  deserializeChunkAsync: (
    collectionName: string,
    chunkString: string,
  ) => Promise<IncrementalChunk[]>,
  deserializeChunk: (
    collectionName: string,
    chunkString: string,
  ) => IncrementalChunk[],
  lazyCollections,
) {
  classifyChunk(chunk);

  const isData = chunk.type === "data";
  const isLazy = lazyCollections.includes(chunk.collectionName);

  if (!(isData && isLazy)) {
    chunk.value = JSON.parse(chunk.value as string);
  }
  if (isData && !isLazy) {
    if (deserializeChunk) {
      chunk.value = deserializeChunk(
        chunk.collectionName,
        chunk.value as string,
      );
    } else if (deserializeChunkAsync) {
      chunk.value = await deserializeChunkAsync(
        chunk.collectionName,
        chunk.value as string,
      );
    }
  }
}

function randomVersionId(): string {
  // Appears to have enough entropy for chunk version IDs
  // (Only has to be different than enough of its own previous versions that there's no writer
  // that thinks a new version is the same as an earlier one, not globally unique)
  return Math.random().toString(36).substring(2);
}

function sortChunksInPlace(chunks: IncrementalChunk[]) {
  // sort chunks in place to load data in the right order (ascending loki ids)
  // on both Safari and Chrome, we'll get chunks in order like this: 0, 1, 10, 100...
  chunks.sort(function (a, b) {
    return (a.index || 0) - (b.index || 0);
  });
}

function createKeyRanges(keys: IDBValidKey[], count: number) {
  const countPerRange = Math.floor(keys.length / count);
  const keyRanges = [];
  let minKey;
  let maxKey;
  for (let i = 0; i < count; i += 1) {
    minKey = keys[countPerRange * i];
    maxKey = keys[countPerRange * (i + 1)];
    if (i === 0) {
      // ... < maxKey
      keyRanges.push(IDBKeyRange.upperBound(maxKey, true));
    } else if (i === count - 1) {
      // >= minKey
      keyRanges.push(IDBKeyRange.lowerBound(minKey));
    } else {
      // >= minKey && < maxKey
      keyRanges.push(IDBKeyRange.bound(minKey, maxKey, false, true));
    }
  }
  return keyRanges;
}

async function idbReqAsync<T>(request: IDBRequest<T>) {
  return new Promise((resolve, reject) => {
    request.onsuccess = (e) => {
      resolve((e.target as any).result as T);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

if (window !== undefined) {
  Object.assign(window, { IncrementalIndexedDBAdapter });
}
