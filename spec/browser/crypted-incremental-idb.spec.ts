import Sylvie from "../../src/sylviejs";
import Collection from "../../src/database/collection";
import { CollectionDocument } from "../../src/database/collection/collection-document";
import { PersistenceAdapter } from "../../src/storage-adapter/src/models/persistence-adapter";
import { CryptedIncrementalIndexedDBAdapter } from "../../src/storage-adapter/crypted-incremental-indexeddb-adapter";
const loki = Sylvie;

describe("CryptedIncrementalIndexedDBAdapter", function () {
  this.timeout(30000); // mocha timout
  // function checkDatabaseCopyIntegrity(source, copy) {
  //   source.collections.forEach(function(sourceCol: Collection<any>, i) {
  //     const copyCol = copy.collections[i];
  //     expect(copyCol.name).toBe(sourceCol.name);
  //     expect(copyCol.data.length).toBe(sourceCol.data.length);

  //     copyCol.data.every(function(copyEl, elIndex) {
  //       expect(JSON.stringify(copyEl)).toBe(
  //         JSON.stringify(source.collections[i].data[elIndex]),
  //       );
  //     });
  //   });
  // }

  // it("initializes Sylvie/Loki properly", function() {
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

  // it("checkDatabaseCopyIntegrity works", function() {
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
  //   expect(function() {
  //     const copy = db.copy();
  //     copy.collections[0].data.push({ hello: "!" });
  //     checkDatabaseCopyIntegrity(db, copy);
  //   }).toThrow();
  // });

  // it("basic save and loading works (6 records)", function (done) {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({ secret: "pass" });
  //   const source = new loki("incremental_idb_tester", { adapter: adapter });
  //   const col1 = source.addCollection("test_collection");

  //   col1.insert({ customId: 0, val: "hello", constraints: 100 });
  //   col1.insert({ customId: 1, val: "hello1" });
  //   const h2 = col1.insert({ customId: 2, val: "hello2" });
  //   const h3 = col1.insert({ customId: 3, val: "hello3" });
  //   const h4 = col1.insert({ customId: 4, val: "hello4" });
  //   const h5 = col1.insert({ customId: 5, val: "hello5" });

  //   h2.val = "UPDATED";
  //   col1.update(h2);

  //   h3.val = "UPDATED";
  //   col1.update(h3);
  //   (h3 as CollectionDocument).val2 = "added!";
  //   col1.update(h3);

  //   col1.remove(h4);

  //   const h6 = col1.insert({ customId: 6, val: "hello6" });

  //   source.saveDatabase(function (saveError) {
  //     expect(saveError).toBe(undefined);

  //     const copy = new loki("incremental_idb_tester", {
  //       adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "pass" }),
  //       verbose: true,
  //     });

  //     copy.loadDatabase({}, (loadError) => {
  //       expect(loadError).toBeFalsy();
  //       checkDatabaseCopyIntegrity(source, copy);
  //       done();
  //     });
  //   });
  // });

  // it("large save works (10K records)", function (done) {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({ secret: "pass" });
  //   const source = new loki("incremental_idb_tester", { adapter: adapter });
  //   const col1 = source.addCollection("test_collection");

  //   for (let i = 0; i < 10000; i++) {
  //     col1.insert({
  //       mass: true,
  //       i,
  //       blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //     });
  //   }

  //   source.saveDatabase(function (saveError) {
  //     expect(saveError).toBe(undefined);

  //     const copy = new loki("incremental_idb_tester", {
  //       adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "pass" }),
  //       verbose: true,
  //     });

  //     copy.loadDatabase({}, (loadError) => {
  //       expect(loadError).toBeFalsy();
  //       checkDatabaseCopyIntegrity(source, copy);
  //       done();
  //     });
  //   });
  // });

  // it("large save with fuzzed changes works (75K records)", function (done) {
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

  //   source.saveDatabase(function (saveError) {
  //     expect(saveError).toBe(undefined);

  //     const copy = new loki("incremental_idb_tester", {
  //       adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "pass" }),
  //       verbose: true,
  //     });

  //     copy.loadDatabase({}, (loadError) => {
  //       expect(loadError).toBeFalsy();
  //       checkDatabaseCopyIntegrity(source, copy);
  //       done();
  //     });
  //   });
  // });

  // it("regression test: batch removing records works", function (done) {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({ secret: "pass" });
  //   const source = new loki("incremental_idb_tester", { adapter: adapter });
  //   const col1 = source.addCollection("test_collection");

  //   for (let i = 0; i < 10000; i++) {
  //     col1.insert({
  //       mass: true,
  //       i,
  //       blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //     });
  //   }

  //   source.collections.forEach((col) => {
  //     col.remove(col.data.slice(col.data.length - 215));
  //   });

  //   source.saveDatabase(function (saveError) {
  //     expect(saveError).toBe(undefined);

  //     const copy = new loki("incremental_idb_tester", {
  //       adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "pass" }),
  //       verbose: true,
  //     });

  //     copy.loadDatabase({}, (loadError) => {
  //       expect(loadError).toBeFalsy();
  //       checkDatabaseCopyIntegrity(source, copy);
  //       done();
  //     });
  //   });
  // });

  // it("regression test: loading db with a large chunk missing", function (done) {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({ secret: "pass" });
  //   const source = new loki("incremental_idb_tester", { adapter: adapter });
  //   const col1 = source.addCollection("test_collection");
  //   for (let i = 0; i < 10000; i++) {
  //     col1.insert({
  //       mass: true,
  //       i,
  //       blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //     });
  //   }

  //   source.collections.forEach((col) => {
  //     // remove enough contiguous records to have the last chunk empty
  //     const numberOfRecords = 300;
  //     for (let i = 0; i < numberOfRecords; i++) {
  //       col.insert({
  //         mass: true,
  //         i,
  //         blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //       });
  //     }
  //     col.remove(col.data.slice(col.data.length - 215));

  //     // now add a new record to the end
  //     col.insert({
  //       mass: true,
  //       blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //     });
  //   });

  //   // Check
  //   source.saveDatabase(function (saveError) {
  //     expect(saveError).toBe(undefined);

  //     const copy = new loki("incremental_idb_tester", {
  //       adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "pass" }),
  //       verbose: true,
  //     });

  //     copy.loadDatabase({}, (loadError) => {
  //       expect(loadError).toBeFalsy();
  //       checkDatabaseCopyIntegrity(source, copy);
  //       done();
  //     });
  //   });
  // });

  // it("lazy collection deserialization", function (done) {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({ secret: "pass" });
  //   const initDb = new loki("incremental_idb_tester", { adapter: adapter });
  //   const col = initDb.addCollection("test_collection");
  //   for (let i = 0; i < 10000; i++) {
  //     col.insert({
  //       mass: true,
  //       i,
  //       blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //     });
  //   }

  //   const lazyCopyDb = new loki("incremental_idb_tester", {
  //     adapter: new CryptedIncrementalIndexedDBAdapter({
  //       secret: "pass",
  //       lazyCollections: ["test_collection"],
  //     }),
  //   });

  //   // Check
  //   lazyCopyDb.saveDatabase(function (saveError) {
  //     expect(saveError).toBe(undefined);

  //     const copy = new loki("incremental_idb_tester", {
  //       adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "pass" }),
  //       verbose: true,
  //     });

  //     copy.loadDatabase({}, (loadError) => {
  //       expect(loadError).toBeFalsy();
  //       checkDatabaseCopyIntegrity(lazyCopyDb, copy);
  //       done();
  //     });
  //   });
  // });

  // function fuzz(dbToFuzz) {
  //   const changeSize = Math.random();
  //   const sizeFactor = changeSize < 0.1 ? 0.1 : changeSize > 0.9 ? 10 : 1;

  //   const numberOfInsertions = 20 * sizeFactor;
  //   const numberOfDeletions = 15 * sizeFactor;
  //   const numberOfUpdates = 15 * sizeFactor;
  //   const total = numberOfInsertions + numberOfDeletions + numberOfUpdates;

  //   dbToFuzz.collections.forEach((col) => {
  //     // inserts
  //     for (let i = 0; i < numberOfInsertions; i++) {
  //       col.insert({
  //         mass: true,
  //         i,
  //         blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //       });
  //     }

  //     // deletions
  //     for (let i = 0; i < numberOfDeletions; i++) {
  //       const id = Math.floor(Math.random() * col.data.length);
  //       col.remove(col.data[id]);
  //     }

  //     // updates
  //     for (let i = 0; i < numberOfUpdates; i++) {
  //       const id = Math.floor(Math.random() * col.data.length);
  //       const doc = col.data[id];
  //       doc.blah = "UPDATED_" + doc.blah;
  //       col.update(doc);
  //     }
  //   });
  // }

  // it("long running fuzz tests", function (done) {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({ secret: "pass" });
  //   const db = new loki("incremental_idb_tester", { adapter: adapter });
  //   const col = db.addCollection("test_collection");
  //   for (let i = 0; i < 10000; i++) {
  //     col.insert({
  //       mass: true,
  //       i,
  //       blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
  //     });
  //   }

  //   const fuzzes = 100;

  //   let doneCount = 0;
  //   for (let i = 0; i < fuzzes; i++) {
  //     fuzz(db);
  //     db.saveDatabase(function (saveError) {
  //       expect(saveError).toBe(undefined);

  //       const copy = new loki("incremental_idb_tester", {
  //         adapter: new CryptedIncrementalIndexedDBAdapter({ secret: "pass" }),
  //         verbose: true,
  //       });

  //       copy.loadDatabase({}, (loadError) => {
  //         expect(loadError).toBeFalsy();
  //         checkDatabaseCopyIntegrity(db, copy);
  //         if (++doneCount === fuzzes) {
  //           done();
  //         }
  //       });
  //     });
  //   }
  // });

  // it("handles dirtyIds during save properly", function () {
  //   const adapter = new CryptedIncrementalIndexedDBAdapter({ secret: "pass" });
  //   const db = new loki("incremental_idb_tester", {
  //     adapter: adapter as unknown as PersistenceAdapter,
  //   });
  //   const col1 = db.addCollection("test_collection");
  //   const col2 = db.addCollection("test_collection2");
  //   col2.dirty = false;

  //   const doc1 = { foo: "1" };
  //   const doc2: Record<string, string> = { foo: "2" };
  //   const doc3 = { foo: "3" };
  //   col1.insert([doc1, doc2, doc3]);
  //   doc2.bar = "true";
  //   col1.update(doc2);
  //   col1.remove(doc3);

  //   const dirty = col1.dirtyIds;
  //   expect(dirty.length).toBe(5);
  //   expect(col1.dirty).toBe(true);
  //   expect(col2.dirty).toBe(false);

  //   // simulate save - don't go through IDB, just check that logic is good
  //   let callCallback;
  //   adapter.saveDatabase = function (dbname, getLokiCopy, callback) {
  //     getLokiCopy();
  //     callCallback = callback;
  //   };

  //   // dirty ids zero out and roll back in case of error
  //   db.saveDatabase();
  //   expect(col1.dirtyIds).toEqual([]);
  //   expect(col1.dirty).toBe(false);
  //   callCallback(new Error("foo"));
  //   expect(col1.dirtyIds).toEqual(dirty);
  //   expect(col1.dirty).toBe(true);
  //   expect(col2.dirty).toBe(false);

  //   // new dirtied ids get added in case of rollback
  //   db.saveDatabase();
  //   const doc4 = { foo: "4" } as { foo: string; $loki: number };
  //   col1.insert(doc4);
  //   expect(col1.dirtyIds).toEqual([doc4.$loki]);
  //   const doc5 = { foo: "5" } as { foo: string; $loki: number };
  //   col2.insert(doc5);
  //   expect(col2.dirty).toBe(true);
  //   expect(col2.dirtyIds).toEqual([doc5.$loki]);
  //   callCallback(new Error("foo"));
  //   expect(col1.dirtyIds).toEqual([doc4.$loki].concat(dirty));
  //   expect(col1.dirty).toBe(true);
  //   expect(col2.dirtyIds).toEqual([doc5.$loki]);
  //   expect(col2.dirty).toBe(true);

  //   // if successful, dirty ids don't zero out
  //   db.saveDatabase();
  //   expect(col1.dirtyIds).toEqual([]);
  //   const doc6 = { foo: "6" } as { foo: string; $loki: number };
  //   col1.insert(doc6);
  //   expect(col1.dirtyIds).toEqual([doc6.$loki]);
  //   callCallback();
  //   expect(col1.dirtyIds).toEqual([doc6.$loki]);
  // });
});
