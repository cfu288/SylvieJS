import Sylvie from "../../src/sylviejs";
import Collection from "../../src/database/collection";
import { CollectionDocument } from "../../src/database/collection/collection-document";
import { PersistenceAdapter } from "../../src/storage-adapter/src/models/persistence-adapter";
import { CryptedIncrementalIndexedDBAdapter } from "../../src/storage-adapter/crypted-incremental-indexeddb-adapter";
const loki = Sylvie;

describe("CryptedIncrementalIndexedDBAdapter", function () {
  this.timeout(30000); // mocha timout
  function checkDatabaseCopyIntegrity(source, copy) {
    source.collections.forEach(function (sourceCol: Collection<any>, i) {
      expect(copy.collections.length).toBe(source.collections.length);
      const copyCol = copy.collections[i];
      expect(copyCol.name).toBe(sourceCol.name);
      expect(copyCol.data.length).toBe(sourceCol.data.length);

      copyCol.data.every(function (copyEl, elIndex) {
        expect(JSON.stringify(copyEl)).toBe(
          JSON.stringify(source.collections[i].data[elIndex]),
        );
      });
    });
  }

  // it("initializes Sylvie/Loki properly", function () {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({
  //     secret: "pass",
  //   }) as unknown as PersistenceAdapter;
  //   const db = new loki("incremental_idb_tester", {
  //     adapter: adapter,
  //   });
  //   const coll = db.addCollection("coll");

  //   expect(db.isIncremental).toBe(true);
  //   expect(coll.isIncremental).toBe(true);
  //   // @ts-ignore
  //   expect(adapter.mode).toBe("incremental");
  // });

  // it("checkDatabaseCopyIntegrity works", function () {
  //   const db = new loki("incremental_idb_tester");
  //   const col1 = db.addCollection("test_collection");

  //   const doc1 = { foo: "1" };
  //   const doc2: Record<string, string> = { foo: "2" };
  //   const doc3 = { foo: "3" };
  //   col1.insert([doc1, doc2, doc3]);
  //   doc2.bar = "true";
  //   col1.update(doc2);
  //   col1.remove(doc3);

  //   // none of these should throw
  //   checkDatabaseCopyIntegrity(db, db);
  //   checkDatabaseCopyIntegrity(db, db.copy());
  //   checkDatabaseCopyIntegrity(db, JSON.parse(db.serialize()));

  //   // this should throw
  //   expect(function () {
  //     const copy = db.copy();
  //     copy.collections[0].data.push({ hello: "!" });
  //     checkDatabaseCopyIntegrity(db, copy);
  //   }).toThrow();
  // });

  it("basic save and loading works (6 records)", async function () {
    const source = new loki("incremental_idb_tester", {
      adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "123" }),
    });
    const col1 = source.addCollection("test_collection");
    col1.insert({ customId: 0, val: "hello", constraints: 100 });
    col1.insert({ customId: 1, val: "hello1" });
    col1.insert({ customId: 2, val: "hello2" });
    col1.insert({ customId: 3, val: "hello3" });
    col1.insert({ customId: 4, val: "hello4" });
    col1.insert({ customId: 5, val: "hello5" });
    col1.insert({ customId: 6, val: "hello6" });

    await source.saveDatabaseAsync();

    const copy = new loki("incremental_idb_tester", {
      adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "123" }),
    });
    source.loadCollection("test_collection");

    await copy.loadDatabaseAsync();
    checkDatabaseCopyIntegrity(source, copy);
  });

  // it("large save with fuzzed changes works (75K records)", async function () {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({ secret: "pass" });
  //   const source = new loki("incremental_idb_tester", { adapter: adapter });

  //   source.collections.forEach((col) => {
  //     console.time("massAdd");
  //     const numberOfRecords = 32000;
  //     for (let i = 0; i < numberOfRecords; i++) {
  //       col.insert({
  //         mass: true,
  //         i,
  //         blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //       });
  //     }
  //     console.timeEnd("massAdd");

  //     // remove many contiguous records to have empty chunks
  //     const dataToDelete = col.data.slice(200, 95);
  //     col.remove(dataToDelete);

  //     // fuzz changes
  //     const numberOfDeletions = 2500;
  //     for (let i = 0; i < numberOfDeletions; i++) {
  //       const id = Math.floor(Math.random() * col.data.length);
  //       col.remove(col.data[id]);
  //     }

  //     const numberOfUpdates = 2500;
  //     for (let i = 0; i < numberOfUpdates; i++) {
  //       const id = Math.floor(Math.random() * col.data.length);
  //       const doc = col.data[id];
  //       doc.blah = "UPDATED_" + doc.blah;
  //       col.update(doc);
  //     }
  //   });

  //   await source.saveDatabaseAsync();

  //   const copy = new loki("incremental_idb_tester", {
  //     adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "pass" }),
  //     verbose: true,
  //   });

  //   await copy.loadDatabaseAsync({});
  //   checkDatabaseCopyIntegrity(source, copy);
  // });
});
