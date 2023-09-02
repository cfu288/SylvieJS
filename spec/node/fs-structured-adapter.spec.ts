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

  it("can delete large database with multiple collection partitions", function (done) {
    const adapter = new FsStructuredAdapter();
    const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;
    const db = new Sylvie(TEST_DB_NAME, {
      adapter: adapter,
    });
    const NUM_DOCS_PER_COL = 100000;
    const collection = db.addCollection("users");
    const collection1 = db.addCollection("users1");
    const collection2 = db.addCollection("users2");
    for (let i = 0; i < NUM_DOCS_PER_COL; i++) {
      collection.insert({
        mass: true,
        i,
        blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
      });
      collection1.insert({
        mass: true,
        i,
        blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
      });
      collection2.insert({
        mass: true,
        i,
        blah: "accumsan congue. Lorem ipsum primis in nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam. Ut sagittis, ipsum dolor quam. nibh vel risus. Sed vel lectus. Ut sagittis, ipsum dolor quam",
      });
    }

    db.saveDatabase(() => {
      const newAdapter = new FsStructuredAdapter();
      const newDb = new Sylvie(TEST_DB_NAME, {
        adapter: newAdapter,
      });

      newDb.loadDatabase({}, () => {
        expect(newDb.collections.length).toBe(3);

        const newCollection = newDb.getCollection("users");
        const newCollection1 = newDb.getCollection("users1");
        const newCollection2 = newDb.getCollection("users2");
        const docs = newCollection.find();
        const docs1 = newCollection1.find();
        const docs2 = newCollection2.find();

        expect(docs.length).toBe(NUM_DOCS_PER_COL);
        expect(docs1.length).toBe(NUM_DOCS_PER_COL);
        expect(docs2.length).toBe(NUM_DOCS_PER_COL);

        fs.readdir(".").then((files) => {
          const filesToDelete = [];
          for (const file of files) {
            if (
              file === TEST_DB_NAME ||
              file.startsWith(TEST_DB_NAME + ".") === true
            ) {
              filesToDelete.push(file);
            }
          }
          expect(filesToDelete.length).toBe(4);
          // Clean up database from fs
          db.close(() => {
            db.deleteDatabase((res) => {
              expect((res as ResultType)?.success).toBe(true);
              fs.readdir(".").then((files) => {
                const filesToDelete = [];
                for (const file of files) {
                  if (
                    file === TEST_DB_NAME ||
                    file.startsWith(TEST_DB_NAME + ".") === true
                  ) {
                    filesToDelete.push(file);
                  }
                }
                expect(filesToDelete.length).toBe(0);
                done();
              });
            });
          });
        });
      });
    });
  });
});
