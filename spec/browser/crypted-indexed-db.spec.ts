import Sylvie from "../../src/sylviejs";
import { CryptedIndexedDBAdapter } from "../../src/storage-adapter/crypted-indexeddb-adapter";

describe("CryptedIndexedDBAdapter", function () {
  this.timeout(10000);

  it("initializes Sylvie/Loki properly", function () {
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    const db = new Sylvie("test.db", {
      adapter: adapter,
    });

    expect(adapter.usePassword).not.toBeNull();
    expect(adapter.changePassword).not.toBeNull();
  });

  it("insert() can insert data", function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
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

  it("findAndRemove() can remove data", function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
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

  it("removeWhere() can remove data using function param", function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
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

  it("removeWhere() can remove data using mongo param", function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
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

  it("saveDatabase() and loadDatabase() the db works", function (done) {
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    // Force legacy use of callback sync API for testing purposes
    delete adapter.isAsync;
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
      expect(errorMessage).toBeFalsy();
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

  it("saveDatabaseAsync() and loadDatabaseAsync() the db works", async function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
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
    await db.saveDatabaseAsync();
    collection.clear();
    await db.loadDatabaseAsync();

    // Verify the database contents
    const newCollection = db.getCollection("items");
    const docs = newCollection.find();
    expect(docs.length).toEqual(2);
    expect(docs[0].customId).toEqual(0);
    expect(docs[0].val).toEqual("hello");
    expect(docs[0].extra).toEqual("world");
    expect(docs[1].customId).toEqual(2);
    expect(docs[1].val).toEqual("hello2");
  });

  it("saveDatabase() and loadDatabase() of a new instance of the db works", function (done) {
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    // Force legacy use of callback sync API for testing purposes
    delete adapter.isAsync;
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
      expect(errorMessage).toBeFalsy();
      // Create a new db instance
      const newAdapter = new CryptedIndexedDBAdapter({
        secret: "password",
      });
      // Force legacy use of callback sync API for testing purposes
      delete newAdapter.isAsync;
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

  it("saveDatabaseAsync() and loadDatabaseAsync() of a new instance of the db works", async function () {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
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
    await db.saveDatabaseAsync();
    // Create a new db instance
    const newDb = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
        secret: "password",
      }),
    });
    await newDb.loadDatabaseAsync();

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

  it("saveDatabase() should work", function (done) {
    // Note that other tests may save dbs concurrently as well, can't rely on absolute db counts
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    // Force legacy use of callback sync API for testing purposes
    delete adapter.isAsync;
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // Need to test the lazy load of the db
    adapter.getDatabaseList((keys) => {
      expect(keys).not.toContain(TEST_DB_NAME);
      db.saveDatabase(() => {
        adapter.getDatabaseList((newKeys) => {
          expect(newKeys).toContain(TEST_DB_NAME);
          done();
        });
      });
    });
  });

  it("saveDatabaseAsync() should work", async function () {
    // Note that other tests may save dbs concurrently as well, can't rely on absolute db counts
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // Need to test the lazy load of the db
    let keys = await adapter.getDatabaseListAsync();
    expect(keys).not.toContain(TEST_DB_NAME);

    await db.saveDatabaseAsync();
    keys = await adapter.getDatabaseListAsync();

    expect(keys).toContain(TEST_DB_NAME);
  });

  it("saveDatabaseAsync() with no password set should not throw", async () => {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({}),
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", extra: "world" },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);

    // Save the database
    await db.saveDatabaseAsync();
  });

  it("passing 'closeAfterSave' = false option to Crypted constructor should close the database after saveDatabase()", function (done) {
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
      closeAfterSave: true,
    });
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([{ customId: 0, val: "hello", extra: "world" }]);

    // Save the database
    db.saveDatabase(function () {
      // Verify that the database is closed
      expect(adapter.idbAdapter.catalog.db).toBeNull();
      done();
    });
  });

  it("passing 'closeAfterSave' = false option to Crypted constructor should close the database after saveDatabase()", function (done) {
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([{ customId: 0, val: "hello", extra: "world" }]);

    // Save the database
    db.saveDatabase(function () {
      // Verify that the database is closed
      expect(adapter.idbAdapter.catalog.db).not.toBeNull();
      done();
    });
  });

  it("passing 'closeAfterSave' = true option to Crypted constructor should close the database after saveDatabaseAsync()", async function () {
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
      closeAfterSave: true,
    });
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([{ customId: 0, val: "hello", extra: "world" }]);

    // Save the database
    await db.saveDatabaseAsync();
    // Verify that the database is closed
    expect(adapter.idbAdapter.catalog.db).toBeNull();
  });

  it("passing 'closeAfterSave' = false option to Crypted constructor should close the database after saveDatabaseAsync()", async function () {
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // Add some data, manipulate it
    const collection = db.addCollection("items");
    collection.insert([{ customId: 0, val: "hello", extra: "world" }]);

    // Save the database
    await db.saveDatabaseAsync();
    // Verify that the database is closed
    expect(adapter.idbAdapter.catalog.db).not.toBeNull();
  });

  it("loadDatabaseAsync() should work", async function () {
    // Note that other tests may save dbs as well, can't rely on absolute counts

    // Create test db instance
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
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
      adapter: new CryptedIndexedDBAdapter({
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

  it("loadDatabase() using the wrong password should throw", function (done) {
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    // Force legacy use of callback sync API for testing purposes
    delete adapter.isAsync;
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

    // Save the database and try reloading it
    db.saveDatabase(function (errorMessage) {
      expect(errorMessage).toBeFalsy();
      // Create a new db instance
      const newDbWithWrongPass = new Sylvie("test.db", {
        adapter: new CryptedIndexedDBAdapter({
          secret: "wrongpassword",
        }),
      });
      newDbWithWrongPass.loadDatabase({}, (error) => {
        expect((error as Error)?.name).toBe("OperationError");
        done();
      });
    });
  });

  it("loadDatabaseAsync() using the wrong password should throw", async () => {
    const db = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
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

    // Save the database
    await db.saveDatabaseAsync();

    // Create a new db instance
    const newDbWithWrongPass = new Sylvie("test.db", {
      adapter: new CryptedIndexedDBAdapter({
        secret: "wrongpassword",
      }),
    });
    try {
      await newDbWithWrongPass.loadDatabaseAsync();
    } catch (error) {
      expect((error as Error).name).toBe("OperationError");
    }
  });

  it("deleteDatabase() the db should work", function (done) {
    // Note that other tests may save dbs as well which are not cleared between test runs, can't rely on absolute counts
    const TEST_DB_NAME = `test_db_to_delete_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    // Force legacy use of callback sync API for testing purposes
    delete adapter.isAsync;
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // need to save db in order to delete
    db.saveDatabase(function () {
      adapter.getDatabaseList(function (keys) {
        if (keys instanceof Error) {
          throw keys;
        }
        const currentDbInstances = keys.length;
        expect(keys).toContain(TEST_DB_NAME);
        // Delete the database
        db.deleteDatabase(function (err) {
          expect((err as { success: true }).success).toBe(true);
          adapter.getDatabaseList(function (keys) {
            if (keys instanceof Error) {
              throw keys;
            }
            expect(keys.length).toBe(currentDbInstances - 1);
            expect(keys).not.toContain(TEST_DB_NAME);
            done();
          });
        });
      });
    });
  });

  it("deleteDatabaseAsync() should work", function (done) {
    // Note that other tests may save dbs as well which are not cleared between test runs, can't rely on absolute counts
    const TEST_DB_NAME = `test_db_to_delete_async_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });

    // need to save db in order to delete
    db.saveDatabase(function () {
      adapter.getDatabaseList(function (keys) {
        if (keys instanceof Error) {
          throw keys;
        }
        const currentDbInstances = keys.length;
        expect(keys).toContain(TEST_DB_NAME);
        // Delete the database
        db.deleteDatabaseAsync()
          .then(() => {
            adapter.getDatabaseList(function (keys) {
              if (keys instanceof Error) {
                throw keys;
              }
              expect(keys.length).toBe(currentDbInstances - 1);
              expect(keys).not.toContain(TEST_DB_NAME);
              done();
            });
          })
          .catch((err) => {
            expect(err).toBeFalsy();
          });
      });
    });
  });

  it("getDatabaseList() should return list of dbs after saveDatabase()", function (done) {
    // Note that other tests may save dbs as well, can't rely on absolute counts
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    // Force legacy use of callback sync API for testing purposes
    delete adapter.isAsync;
    const db = new Sylvie("test.db", {
        adapter,
      }),
      db1 = new Sylvie("test1.db", {
        adapter,
      }),
      db2 = new Sylvie("test2.db", {
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

  it("getDatabaseListAsync() should return list of dbs after saveDatabaseAsync()", async () => {
    // Note that other tests may save dbs as well, can't rely on absolute counts
    const TEST_DB_NAME = `test_db_${self.crypto.randomUUID()}.db`,
      TEST_DB1_NAME = `test_db_${self.crypto.randomUUID()}.db`,
      TEST_DB2_NAME = `test_db_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    const db = new Sylvie(TEST_DB_NAME, {
        adapter,
      }),
      db1 = new Sylvie(TEST_DB1_NAME, {
        adapter,
      }),
      db2 = new Sylvie(TEST_DB2_NAME, {
        adapter,
      });

    await db.saveDatabaseAsync();
    await db1.saveDatabaseAsync();
    await db2.saveDatabaseAsync();

    const keys = await adapter.getDatabaseListAsync();

    expect(keys).toContain(TEST_DB_NAME);
    expect(keys).toContain(TEST_DB1_NAME);
    expect(keys).toContain(TEST_DB2_NAME);
  });

  it("getDatabaseListAsync() shows multiple databases after saveDatabaseAsync()", async () => {
    // Note that other tests may save dbs as well, can't rely on absolute counts
    const TEST_DB_NAME = `test_db_${self.crypto.randomUUID()}.db`;
    const TEST_DB1_NAME = `test_db_${self.crypto.randomUUID()}.db`;
    const TEST_DB2_NAME = `test_db_${self.crypto.randomUUID()}.db`;

    const adapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    const db = new Sylvie(TEST_DB_NAME, {
      adapter,
    });
    const db1 = new Sylvie(TEST_DB1_NAME, {
      adapter,
    });
    const db2 = new Sylvie(TEST_DB2_NAME, {
      adapter,
    });

    await db.saveDatabaseAsync();
    await db1.saveDatabaseAsync();
    await db2.saveDatabaseAsync();

    const keys = await adapter.getDatabaseListAsync();
    expect(keys).toContain(TEST_DB_NAME);
    expect(keys).toContain(TEST_DB1_NAME);
    expect(keys).toContain(TEST_DB2_NAME);
  });

  it("changePassword() should re-encrypt database with new password", async function () {
    // Create test db instance
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
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

    // Change password on database using async changePassword(dbname: string, newPassword: string): Promise<void>
    await adapter.changePassword(TEST_DB_NAME, "newpassword");

    // Open a new db instance
    const newDb = new Sylvie(TEST_DB_NAME, {
      adapter: new CryptedIndexedDBAdapter({
        secret: "newpassword",
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

  it("loadDatabaseAsync() using old password after changePassword() should fail", async function () {
    // Create test db instance
    const TEST_DB_NAME = `test_${self.crypto.randomUUID()}.db`;
    const adapter = new CryptedIndexedDBAdapter({
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

    // Change password on database using async changePassword(dbname: string, newPassword: string): Promise<void>
    await adapter.changePassword(TEST_DB_NAME, "newpassword");

    // Open a new db instance
    const newAdapter = new CryptedIndexedDBAdapter({
      secret: "password",
    });
    const newDb = new Sylvie(TEST_DB_NAME, {
      adapter: newAdapter,
    });

    // Load the database with old password should fail
    try {
      await newDb.loadDatabaseAsync({});
    } catch (error) {
      expect(error).toBeTruthy();
      expect((error as Error).name).toBe("OperationError");
    }

    // Load the database with new password should work
    newAdapter.usePassword("newpassword");
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
