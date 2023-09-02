import { FsAdapter } from "../../src/storage-adapter/fs-adapter";
import { randomUUID } from "node:crypto";
import Sylvie from "../../src/sylviejs";
import fs from "node:fs/promises";

describe("FsAdapter", function () {
  it("initializes Sylvie properly", async function () {
    const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;

    const adapter = new FsAdapter();
    const db = new Sylvie(TEST_DB_NAME, {
      adapter: adapter,
    });

    expect(adapter.loadDatabase).not.toBeNull();
    expect(adapter.saveDatabase).not.toBeNull();
    expect(adapter.deleteDatabase).not.toBeNull();
  });

  it("can insert into database", async function () {
    const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;
    const adapter = new FsAdapter();
    const db = new Sylvie(TEST_DB_NAME, {
      adapter: adapter,
    });

    const collection = db.addCollection("users");
    collection.insert([
      {
        name: "joe",
      },
      {
        name: "jack",
      },
    ]);

    expect(db.collections.length).toBe(1);
  });

  it("can load, save, and delete database", async function () {
    const adapter = new FsAdapter();
    const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;
    const db = new Sylvie(TEST_DB_NAME, {
      adapter: adapter,
    });

    const collection = db.addCollection("users");
    collection.insert([
      {
        name: "joe",
      },
      {
        name: "jack",
      },
    ]);

    // Expect database to not exist in fs
    let files = await fs.readdir(".");
    expect(files).not.toContain(TEST_DB_NAME);

    await db.saveDatabaseAsync();

    // Expect database to exist in fs
    files = await fs.readdir(".");
    expect(files).toContain(TEST_DB_NAME);

    const newAdapter = new FsAdapter();
    const newDb = new Sylvie(TEST_DB_NAME, {
      adapter: newAdapter,
    });

    // Load new instance of database from fs
    await newDb.loadDatabaseAsync();
    expect(newDb.collections.length).toBe(1);

    const newCollection = newDb.getCollection("users");
    const docs = newCollection.find();

    expect(docs.length).toBe(2);
    expect(docs[0].name).toBe("joe");
    expect(docs[1].name).toBe("jack");

    // Clean up database from fs
    try {
      await db.closeAsync();
      await db.deleteDatabaseAsync();

      // Expect database to not exist in fs
      const files = await fs.readdir(".");
      expect(files).not.toContain(TEST_DB_NAME);
    } catch (e) {
      expect(e).toBeUndefined();
    }
  });
});

// users.insert([{
// 	name: 'joe'
// }, {
// 	name: 'jack'
// }]);

// db.saveDatabase( function reload(){

// var reloaded = new loki('./loki.json');
// 	reloaded.loadDatabase({}, function () {
// 		var users2 = reloaded.getCollection('users');
// 		suite.assertEqual('There are 2 objects in the reloaded db', 2, users2.data.length);
// 		require('fs').unlink('./loki.json');
// 	});
// });

// // test autoload callback fires even when database does not exist
// function testAutoLoad() {
// 	var cbSuccess = false;

// 	var tdb = new loki('nonexistent.db',
// 	{
//         autoload: true,
//         autoloadCallback : function() { cbSuccess = true; }
//     });

// 	setTimeout(function() {
// 		suite.assertEqual('autoload callback was called', cbSuccess, true);
// 		suite.report();
// 	}, 500);
// }

// // due to async nature of top inline test, give it some time to complete
// setTimeout(testAutoLoad, 500);
