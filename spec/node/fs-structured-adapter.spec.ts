import { FsStructuredAdapter } from "../../src/storage-adapter/fs-structured-adapter";
import { randomUUID } from "node:crypto";
import Sylvie from "../../src/sylviejs";
import { ResultType } from "../../src/storage-adapter/src/models/result-type";
import fs from "node:fs/promises";

describe("FsStructuredAdapter", function () {
  it("initializes Sylvie properly", async function () {
    const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;

    const adapter = new FsStructuredAdapter();
    const db = new Sylvie(TEST_DB_NAME, {
      adapter: adapter,
    });

    expect(adapter.loadDatabase).not.toBeNull();
    expect(adapter.exportDatabase).not.toBeNull();
  });

  it("can insert into database", async function () {
    const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;
    const adapter = new FsStructuredAdapter();
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

  it("can save, load, and delete database", function (done) {
    const adapter = new FsStructuredAdapter();
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

    db.saveDatabase(() => {
      const newAdapter = new FsStructuredAdapter();
      const newDb = new Sylvie(TEST_DB_NAME, {
        adapter: newAdapter,
      });

      newDb.loadDatabase({}, () => {
        expect(newDb.collections.length).toBe(1);

        const newCollection = newDb.getCollection("users");
        const docs = newCollection.find();

        expect(docs.length).toBe(2);
        expect(docs[0].name).toBe("joe");
        expect(docs[1].name).toBe("jack");

        // Clean up database from fs
        db.close(() => {
          db.deleteDatabase((res) => {
            expect((res as ResultType)?.success).toBe(true);
            done();
          });
        });
      });
    });
  });

  it("can delete large database with multiple collection partitions", async function () {
    const adapter = new FsStructuredAdapter();
    const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;
    const db = new Sylvie(TEST_DB_NAME, {
      adapter: adapter,
    });
    const COLL_COUNT = 10;
    const COLLECTIONS = [...Array(COLL_COUNT).keys()].map((i) => `users${i}`);
    const NUM_DOCS_PER_COL = 10000;
    for (const collectionName of COLLECTIONS) {
      const collection = db.addCollection(collectionName);
      for (let i = 0; i < NUM_DOCS_PER_COL; i++) {
        collection.insert({
          mass: true,
          i,
          blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
        });
      }
    }

    await new Promise<void>((resolve) => {
      db.saveDatabase(() => resolve());
    });

    const newAdapter = new FsStructuredAdapter();
    const newDb = new Sylvie(TEST_DB_NAME, {
      adapter: newAdapter,
    });

    await new Promise<void>((resolve) => {
      newDb.loadDatabase({}, () => resolve());
    });

    // Validate restore of database worked
    expect(newDb.collections.length).toBe(COLL_COUNT);
    for (const collectionName of COLLECTIONS) {
      const collection = db.getCollection(collectionName);
      const docs = collection.find();
      expect(docs.length).toBe(NUM_DOCS_PER_COL);
    }

    let files = await fs.readdir(".");
    let filesToDelete = [];
    for (const file of files) {
      if (
        file === TEST_DB_NAME ||
        file.startsWith(TEST_DB_NAME + ".") === true
      ) {
        filesToDelete.push(file);
      }
    }
    expect(filesToDelete.length).toBe(COLL_COUNT + 1);

    // Clean up database from fs
    await db.closeAsync();
    const res = await new Promise<Error | ResultType>((resolve) => {
      db.deleteDatabase((res) => resolve(res));
    });
    expect((res as ResultType)?.success).toBe(true);

    // Ensure all files have been deleted
    files = await fs.readdir(".");
    filesToDelete = [];
    for (const file of files) {
      if (
        file === TEST_DB_NAME ||
        file.startsWith(TEST_DB_NAME + ".") === true
      ) {
        filesToDelete.push(file);
      }
    }
    expect(filesToDelete.length).toBe(0);
  });
});
