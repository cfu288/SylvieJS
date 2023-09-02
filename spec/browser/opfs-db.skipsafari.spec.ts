import Sylvie from "../../src/sylviejs";
import { OPFSAdapter } from "../../src/storage-adapter/opfs-adapter";
import { ResultType } from "../../src/storage-adapter/src/models/result-type";

/**
 * Note: These tests fail in safari with webdriver, but work fine in chrome/firefox. Should work well in actual safari as well.
 * https://github.com/web-platform-tests/interop/issues/172#issuecomment-1265925763
 */

describe("OPFSAdapter", function () {
  it("initializes Sylvie/Loki properly", function () {
    const adapter = new OPFSAdapter();
    const db = new Sylvie("test.db", {
      adapter: adapter,
    });

    expect(db.persistenceAdapter).not.toBeNull();
  });

  it("insert() can insert data", function () {
    const db = new Sylvie("test.db", {
      adapter: new OPFSAdapter(),
    });
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);

    expect(db.collections.length).toBe(1);
    expect(db.collections[0].data.length).toBe(3);
    expect(db.collections[0].data[0].customId).toEqual(0);
    expect(db.collections[0].data[0].val).toEqual("hello");
    expect(db.collections[0].data[0].extra).toEqual("world");
  });

  it("findAndRemove() can remove data", function () {
    const db = new Sylvie("test.db", {
      adapter: new OPFSAdapter(),
    });
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);

    collection.findAndRemove({ customId: 1 });

    expect(db.collections[0].data.length).toBe(2);
    expect(db.collections[0].data[0].customId).toEqual(0);
    expect(db.collections[0].data[0].val).toEqual("hello");
    expect(db.collections[0].data[0].extra).toEqual("world");
    expect(db.collections[0].data[1].customId).toEqual(2);
    expect(db.collections[0].data[1].val).toEqual("hello2");
  });

  it("removeWhere() can remove data using function param", function () {
    const db = new Sylvie("test.db", {
      adapter: new OPFSAdapter(),
    });
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);

    collection.removeWhere({ customId: 1 });

    expect(db.collections[0].data.length).toBe(2);
    expect(db.collections[0].data[0].customId).toEqual(0);
    expect(db.collections[0].data[0].val).toEqual("hello");
    expect(db.collections[0].data[0].extra).toEqual("world");
    expect(db.collections[0].data[1].customId).toEqual(2);
    expect(db.collections[0].data[1].val).toEqual("hello2");
  });

  it("removeWhere() can remove data using mongo param", function () {
    const db = new Sylvie("test.db", {
      adapter: new OPFSAdapter(),
    });
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);
    collection.removeWhere((doc) => doc.customId === 1);

    expect(db.collections[0].data.length).toBe(2);
    expect(db.collections[0].data[0].customId).toEqual(0);
    expect(db.collections[0].data[0].val).toEqual("hello");
    expect(db.collections[0].data[0].extra).toEqual("world");
    expect(db.collections[0].data[1].customId).toEqual(2);
    expect(db.collections[0].data[1].val).toEqual("hello2");
  });

  it("saveDatabase() does not return error message", async function () {
    const adapter = new OPFSAdapter();
    // Force legacy use of callback sync API for testing purposes

    const db = new Sylvie("test.db", {
      adapter,
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);
    collection.removeWhere({ customId: 1 });
    expect(db.collections[0].data.length).toBe(2);

    // Save the database and try reloading it
    const res = await new Promise<Error | ResultType>((resolve) => {
      db.saveDatabase((_) => resolve(_));
    });
    expect(res instanceof Error).toBe(false);
  });

  it("loadDatabase() does not return error message", async function () {
    const db = new Sylvie("test.db", {
      adapter: new OPFSAdapter(),
    });

    const res = await new Promise((resolve) => {
      db.loadDatabase({}, (_) => resolve(_));
    });
    expect(res).toBe(null);
  });

  it("saveDatabase() and loadDatabase() the db works", function (done) {
    const adapter = new OPFSAdapter();
    // Force legacy use of callback sync API for testing purposes

    const db = new Sylvie("test.db", {
      adapter,
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);
    collection.removeWhere({ customId: 1 });
    expect(db.collections[0].data.length).toBe(2);

    // Save the database and try reloading it
    db.saveDatabase(function (errorMessage) {
      expect(errorMessage instanceof Error).toBe(false);
      collection.clear();
      db.loadDatabase({}, function (loadErrorMessage) {
        expect(loadErrorMessage).toBe(null);
        // Verify the database contents
        const newCollection = db.getCollection("items");
        const docs = newCollection.find();
        expect(docs.length).toEqual(2);
        expect(docs[0].customId).toEqual(0);
        expect(docs[0].val).toEqual("hello");
        expect(docs[0].extra).toEqual("world");
        expect(docs[1].customId).toEqual(2);
        expect(docs[1].val).toEqual("hello2");
        done();
      });
    });
  });

  it("saveDatabase() and loadDatabase() of a new instance of the db works", function (done) {
    const adapter = new OPFSAdapter();
    // Force legacy use of callback sync API for testing purposes

    const db = new Sylvie("test.db", {
      adapter,
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);
    collection.removeWhere({ customId: 1 });
    expect(db.collections[0].data.length).toBe(2);

    // Save the database and try reloading it
    db.saveDatabase(function (res) {
      expect((res as ResultType).success).toBe(true);
      // Create a new db instance
      const newAdapter = new OPFSAdapter();
      const newDb = new Sylvie("test.db", {
        adapter: newAdapter,
      });
      newDb.loadDatabase({}, function (loadErrorMessage) {
        expect(loadErrorMessage).toBe(null);
        // Verify the database contents
        const newCollection = newDb.getCollection("items");
        const docs = newCollection.find();
        expect(docs.length).toEqual(2);
        expect(docs[0].customId).toEqual(0);
        expect(docs[0].val).toEqual("hello");
        expect(docs[0].extra).toEqual("world");
        expect(docs[1].customId).toEqual(2);
        expect(docs[1].val).toEqual("hello2");
        done();
      });
    });
  });

  it("saveDatabase() should work", async function () {
    // Note that other tests may save dbs concurrently as well, can't rely on absolute db counts
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new OPFSAdapter();
    // Force legacy use of callback sync API for testing purposes

    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    const fs = await navigator.storage.getDirectory();
    // list all files in directory
    const files = [];
    // @ts-ignore
    for await (const name of fs.keys()) {
      files.push(name);
    }

    expect(files).not.toContain(TEST_DB_NAME);

    await new Promise<void>((resolve) => {
      db.saveDatabase(() => {
        resolve();
      });
    });

    const newFiles = [];
    // @ts-ignore
    for await (const name of fs.keys()) {
      newFiles.push(name);
    }

    expect(newFiles).toContain(TEST_DB_NAME);
  });

  it("deleteDatabase() the db should work", async function () {
    // Note that other tests may save dbs as well which are not cleared between test runs, can't rely on absolute counts
    const TEST_DB_NAME = `test_db_to_delete_${self.crypto.randomUUID()}.db`;
    const adapter = new OPFSAdapter();
    // Force legacy use of callback sync API for testing purposes
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);
    collection.removeWhere({ customId: 1 });
    expect(db.collections[0].data.length).toBe(2);

    // need to save db in order to delete
    const fs = await navigator.storage.getDirectory();
    const files = [];
    // @ts-ignore
    for await (const name of fs.keys()) {
      files.push(name);
    }
    expect(files).not.toContain(TEST_DB_NAME);

    await new Promise<void>((resolve) => {
      db.saveDatabase(() => {
        resolve();
      });
    });

    const newFiles = [];
    // @ts-ignore
    for await (const name of fs.keys()) {
      newFiles.push(name);
    }
    expect(newFiles).toContain(TEST_DB_NAME);

    await new Promise<void>((resolve) => {
      db.deleteDatabase(() => {
        resolve();
      });
    });

    const newFiles1 = [];
    // @ts-ignore
    for await (const name of fs.keys()) {
      newFiles1.push(name);
    }
    expect(newFiles1).not.toContain(TEST_DB_NAME);
  });
});
