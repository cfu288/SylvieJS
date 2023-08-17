/* eslint-disable @typescript-eslint/no-var-requires */
import Sylvie from "../../src/sylviejs";
import { CryptedIndexedDBAdapter } from "../../src/storage-adapter/crypted-indexeddb-adapter";

describe("CryptedIndexedDBAdapter", function () {
  this.timeout(10000);

  it("initializes Loki properly", function () {
    const adapter = new CryptedIndexedDBAdapter("tests", {
      secret: "password",
    });
    const db = new Sylvie("test.db", {
      adapter: adapter,
    });
    const coll = db.addCollection("coll");

    // @ts-ignore
    expect(adapter.setSecret).not.toBeNull();
  });

  it("can insert data", function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
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

  it("findAndRemove can remove data", function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
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

  it("removeWhere can remove data using function param", function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
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

  it("removeWhere can remove data using mongo param", function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
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

  it("saving and reloading the db works", function (done) {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
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
      expect(errorMessage).toBeFalsy();
      collection.clear();
      db.loadDatabase({}, function (loadErrorMessage) {
        expect(loadErrorMessage).toBeFalsy();
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

  it("saving and reloading the db using a new instance works", function (done) {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
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
      expect(errorMessage).toBeFalsy();
      // Create a new db instance
      const newDb = new Sylvie("test.db", {
        adapter: new CryptedIndexedDBAdapter("tests", {
          secret: "password",
        }),
      });
      newDb.loadDatabase({}, function (loadErrorMessage) {
        expect(loadErrorMessage).toBeFalsy();
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

  it("opening the db using the wrong password should throw", function (done) {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);

    // Save the database and try reloading it
    db.saveDatabase(function (errorMessage) {
      expect(errorMessage).toBeFalsy();
      // Create a new db instance
      const newDbWithWrongPass = new Sylvie("test.db", {
        adapter: new CryptedIndexedDBAdapter("tests", {
          secret: "wrongpassword",
        }),
      });
      newDbWithWrongPass.loadDatabase({}, (error) => {
        expect(error).toBeTruthy();
        expect((error as Error).name).toBe("OperationError");
        done();
      });
    });
  });

  it("deleting the db should work", function (done) {
    // Note that other tests may save dbs as well which are not cleared between test runs, can't rely on absolute counts
    const adapter = new CryptedIndexedDBAdapter("tests", {
      secret: "password",
    });
    const db = new Sylvie("test_db_to_delete.db", {
      adapter,
    });

    // need to save db in order to delete
    db.saveDatabase(function () {
      adapter.getDatabaseList(function (keys) {
        const currentDbInstances = keys.length;
        expect(keys).toContain("test_db_to_delete.db");
        // Delete the database
        db.deleteDatabase(function (err) {
          expect((err as { success: true }).success).toBe(true);
          adapter.getDatabaseList(function (keys) {
            expect(keys.length).toBe(currentDbInstances - 1);
            expect(keys).not.toContain("test_db_to_delete.db");
            done();
          });
        });
      });
    });
  });

  it("getDatabaseList should return list of db", function (done) {
    // Note that other tests may save dbs as well, can't rely on absolute counts
    const adapter = new CryptedIndexedDBAdapter("tests", {
      secret: "password",
    });
    const db = new Sylvie("test.db", {
      adapter,
    });
    const db1 = new Sylvie("test1.db", {
      adapter,
    });
    const db2 = new Sylvie("test2.db", {
      adapter,
    });

    db.saveDatabase(function () {
      db1.saveDatabase(function () {
        db2.saveDatabase(function () {
          adapter.getDatabaseList(function (keys) {
            expect(keys).toContain("test.db");
            expect(keys).toContain("test1.db");
            expect(keys).toContain("test2.db");
            done();
          });
        });
      });
    });
  });

  it("getDatabaseListAsync should return list of db", function (done) {
    // Note that other tests may save dbs as well, can't rely on absolute counts
    const adapter = new CryptedIndexedDBAdapter("tests", {
      secret: "password",
    });
    const db = new Sylvie("test_a.db", {
      adapter,
    });
    const db1 = new Sylvie("test1_a.db", {
      adapter,
    });
    const db2 = new Sylvie("test2_a.db", {
      adapter,
    });

    db.saveDatabase(function () {
      db1.saveDatabase(function () {
        db2.saveDatabase(function () {
          adapter.getDatabaseListAsync().then((keys) => {
            expect(keys).toContain("test_a.db");
            expect(keys).toContain("test1_a.db");
            expect(keys).toContain("test2_a.db");
            done();
          });
        });
      });
    });
  });

  it("TODO: MOVE THIS TEST SOMEWHERE ELSE: saveDatabaseAsync should work", async function () {
    // Note that other tests may save dbs as well, can't rely on absolute counts
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter("tests", {
      secret: "password",
    });
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    await db.saveDatabaseAsync();
    const keys = await adapter.getDatabaseListAsync();

    expect(keys).toContain(TEST_DB_NAME);
  });

  it("TODO: MOVE THIS TEST SOMEWHERE ELSE: loadDatabaseAsync should work", async function () {
    // Note that other tests may save dbs as well, can't rely on absolute counts

    // Create test db instance
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter("tests", {
      secret: "password",
    });
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

    // Save db to disk
    await db.saveDatabaseAsync();
    collection.clear();

    // Open a new db instance
    const newDb = new Sylvie(TEST_DB_NAME, {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
    });
    // Load the database
    await newDb.loadDatabaseAsync({});

    // Verify the database contents
    const newCollection = newDb.getCollection("items");
    const docs = newCollection.find();

    expect(docs.length).toEqual(2);
    expect(docs[0].customId).toEqual(0);
    expect(docs[0].val).toEqual("hello");
    expect(docs[0].extra).toEqual("world");
    expect(docs[1].customId).toEqual(2);
    expect(docs[1].val).toEqual("hello2");
  });
});
