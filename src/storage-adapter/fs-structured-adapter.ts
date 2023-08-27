/* eslint-disable @typescript-eslint/no-this-alias */
/*
  Loki (node) fs structured Adapter (need to require this script to instance and use it).

  This adapter will save database container and each collection to separate files and
  save collection only if it is dirty.  It is also designed to use a destructured serialization 
  method intended to lower the memory overhead of json serialization.
  
  This adapter utilizes ES6 generator/iterator functionality to stream output and
  uses node linereader module to stream input.  This should lower memory pressure 
  in addition to individual object serializations rather than loki's default deep object
  serialization.
*/
import fsPromise from "node:fs/promises";
import fs from "node:fs";
import readline from "node:readline";
import stream from "node:stream";
import { ReferencePersistenceAdapter } from "./src/models/persistence-adapter";
import Sylvie from "../sylviejs";
import { PersistenceAdapterCallback } from "./src/models/persistence-adapter-callback";

/**
 * Loki structured (node) filesystem adapter class.
 *     This class fulfills the loki 'reference' abstract adapter interface which can be applied to other storage methods.
 */
export class FsStructuredAdapter implements ReferencePersistenceAdapter {
  mode: "reference";
  dbref?: Sylvie;
  constructor() {
    this.mode = "reference";
    this.dbref = null;
  }

  /**
   * Loki reference adapter interface function.  Saves structured json via loki database object reference.
   *
   * @param {string} dbname - the name to give the serialized database within the catalog.
   * @param {object} dbref - the loki database object reference to save.
   * @param {function} callback - callback passed obj.success with true or false
   * @memberof LokiFsStructuredAdapter
   */
  exportDatabase(
    dbname: string,
    dbref: Sylvie,
    callback?: PersistenceAdapterCallback,
  ): void {
    this.dbref = dbref;

    // create (dirty) partition generator/iterator
    const pi = this.#getPartition();

    this.#saveNextPartition(dbname, pi, () => {
      callback({ success: true });
    });
  }

  deleteDatabase(dbName: string, callback: PersistenceAdapterCallback): void {
    fsPromise
      .readdir(".")
      .then((files) => {
        for (const file of files) {
          if (file === dbName || file.startsWith(dbName + ".") === true) {
            fsPromise.unlink(file).catch((err) => {
              callback(err);
              return;
            });
          }
        }
        callback({ success: true });
      })
      .catch((err) => {
        callback(err);
      });
  }

  /**
   * Loki persistence adapter interface function which outputs un-prototype db object reference to load from.
   *
   * @param {string} dbname - the name of the database to retrieve.
   * @param {function} callback - callback should accept string param containing db object reference.
   * @memberof LokiFsStructuredAdapter
   */
  loadDatabase(
    dbname: string,
    callback: (value: string | Error | Sylvie | null) => void,
  ) {
    let instream;
    let outstream;
    let rl;
    const self = this;

    this.dbref = null;

    // make sure file exists
    fsPromise
      .stat(dbname)
      .then((stats) => {
        let jsonErr;

        if (!stats.isFile()) {
          // something exists at this path but it isn't a file.
          callback(new Error(`${dbname} is not a valid file.`));
          return;
        }

        instream = fs.createReadStream(dbname);
        outstream = new stream();
        rl = readline.createInterface(instream, outstream);

        // first, load db container component
        rl.on("line", (line) => {
          // it should single JSON object (a one line file)
          if (self.dbref === null && line !== "") {
            try {
              self.dbref = JSON.parse(line);
            } catch (e) {
              jsonErr = e;
            }
          }
        });

        // when that is done, examine its collection array to sequence loading each
        rl.on("close", () => {
          if (jsonErr) {
            // a json error was encountered reading the container file.
            callback(jsonErr);
          } else if (self.dbref.collections.length > 0) {
            self.#loadNextCollection(dbname, 0, () => {
              callback(self.dbref);
            });
          }
        });
      })
      .catch((fileErr) => {
        if (fileErr.code === "ENOENT") {
          // file does not exist, so callback with null
          callback(null);
          return;
        } else {
          // some other file system error.
          callback(fileErr);
          return;
        }
      });
  }

  /**
   * Generator for constructing lines for file streaming output of db container or collection.
   *
   * @param {object=} options - output format options for use externally to loki
   * @param {int=} options.partition - can be used to only output an individual collection or db (-1)
   *
   * @returns {string|array} A custom, restructured aggregation of independent serializations.
   * @memberof LokiFsStructuredAdapter
   */
  *#generateDestructured(options) {
    let idx;
    let dbcopy;

    options = options || {};

    if (!Object.hasOwn(options, "partition")) {
      options.partition = -1;
    }

    // if partition is -1 we will return database container with no data
    if (options.partition === -1) {
      // instantiate lightweight clone and remove its collection data
      dbcopy = this.dbref.copy();

      for (idx = 0; idx < dbcopy.collections.length; idx++) {
        dbcopy.collections[idx].data = [];
      }

      yield dbcopy.serialize({
        serializationMethod: "normal",
      });

      return;
    }

    // 'partitioned' along with 'partition' of 0 or greater is a request for single collection serialization
    if (options.partition >= 0) {
      let docidx;

      // dbref collections have all data so work against that
      const doccount = this.dbref.collections[options.partition].data.length;

      for (docidx = 0; docidx < doccount; docidx++) {
        yield JSON.stringify(
          this.dbref.collections[options.partition].data[docidx],
        );
      }
    }
  }

  /**
   * Recursive function to chain loading of each collection one at a time.
   * If at some point i can determine how to make async driven generator, this may be converted to generator.
   *
   * @param {string} dbname - the name to give the serialized database within the catalog.
   * @param {int} collectionIndex - the ordinal position of the collection to load.
   * @param {function} callback - callback to pass to next invocation or to call when done
   * @memberof LokiFsStructuredAdapter
   */
  #loadNextCollection(dbname, collectionIndex, callback) {
    let instream = fs.createReadStream(`${dbname}.${collectionIndex}`);
    let outstream = new stream() as unknown as NodeJS.WritableStream;
    let rl = readline.createInterface(instream, outstream);
    const self = this;
    let obj;

    rl.on("line", (line) => {
      if (line !== "") {
        try {
          obj = JSON.parse(line);
        } catch (e) {
          callback(e);
        }
        self.dbref.collections[collectionIndex].data.push(obj);
      }
    });

    rl.on("close", (line) => {
      instream = null;
      outstream = null;
      rl = null;
      obj = null;

      // if there are more collections, load the next one
      if (++collectionIndex < self.dbref.collections.length) {
        self.#loadNextCollection(dbname, collectionIndex, callback);
      }
      // otherwise we are done, callback to loadDatabase so it can return the new db object representation.
      else {
        callback();
      }
    });
  }

  /**
   * Generator for yielding sequence of dirty partition indices to iterate.
   */
  *#getPartition() {
    let idx;
    const clen = this.dbref.collections.length;

    // since database container (partition -1) doesn't have dirty flag at db level, always save
    yield -1;

    // yield list of dirty partitions for iterateration
    for (idx = 0; idx < clen; idx++) {
      if (this.dbref.collections[idx].dirty) {
        yield idx;
      }
    }
  }

  /**
   * Utility method for queueing one save at a time
   */
  #saveNextPartition(dbname, pi, callback: () => void) {
    const self = this;
    const pinext = pi.next();

    if (pinext.done) {
      callback();
      return;
    }

    // db container (partition -1) uses just dbname for filename,
    // otherwise append collection array index to filename
    const filename = dbname + (pinext.value === -1 ? "" : `.${pinext.value}`);

    const wstream = fs.createWriteStream(filename);
    //wstream.on('finish', function() {
    wstream.on("close", () => {
      self.#saveNextPartition(dbname, pi, callback);
    });

    const li = this.#generateDestructured({ partition: pinext.value });

    // iterate each of the lines generated by generateDestructured()
    for (const outline of li) {
      wstream.write(`${outline}\n`);
    }

    wstream.end();
  }
}

if (typeof window !== "undefined") {
  Object.assign(window, {
    FsStructuredAdapter: FsStructuredAdapter,
  });
}
