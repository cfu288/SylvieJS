/* eslint-disable @typescript-eslint/no-var-requires */
import Sylvie from "../../src/sylviejs";
import { CryptedIndexedDBAdapter } from "../../src/storage-adapter/crypted-indexeddb-adapter";

describe("CryptedIndexedDBAdapter", function () {
  this.timeout(5000);

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
    collection.removeWhere({ customId: 1 });
    expect(db.collections[0].data.length).toBe(2);

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
    const adapter = new CryptedIndexedDBAdapter("tests", {
      secret: "password",
    });
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

    adapter.getDatabaseList(function (keys) {
      expect(keys.length).toBe(1);
      expect(keys[0]).toBe("test.db");
    });

    // Delete the database
    db.deleteDatabase(function (err) {
      expect((err as { success: true }).success).toBe(true);
      adapter.getDatabaseList(function (keys) {
        expect(keys.length).toBe(0);
        done();
      });
    });
  });
});
