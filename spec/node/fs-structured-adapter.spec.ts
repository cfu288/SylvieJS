import { FsStructuredAdapter } from "../../src/storage-adapter/fs-structured-adapter";
import { randomUUID } from "node:crypto";
import Sylvie from "../../src/sylviejs";
import { ResultType } from "../../src/storage-adapter/src/models/result-type";

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

  it("can load database", function (done) {
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

  // it("can delete database", function (done) {
  //   const adapter = new FsStructuredAdapter();
  //   const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;
  //   const db = new Sylvie(TEST_DB_NAME, {
  //     adapter: adapter,
  //   });

  //   const collection = db.addCollection("users");
  //   collection.insert([
  //     {
  //       name: "joe",
  //     },
  //     {
  //       name: "jack",
  //     },
  //   ]);

  //   db.saveDatabase(() => {
  //     const newAdapter = new FsStructuredAdapter();
  //     const newDb = new Sylvie(TEST_DB_NAME, {
  //       adapter: newAdapter,
  //     });

  //     newDb.loadDatabase({}, () => {
  //       expect(newDb.collections.length).toBe(1);

  //       const newCollection = newDb.getCollection("users");
  //       const docs = newCollection.find();

  //       expect(docs.length).toBe(2);
  //       expect(docs[0].name).toBe("joe");
  //       expect(docs[1].name).toBe("jack");

  //       // Clean up database from fs
  //       db.close(() => {
  //         db.deleteDatabase((res) => {
  //           expect((res as ResultType)?.success).toBe(true);
  //           done();
  //         });
  //       });
  //     });
  //   });
  // });

  // it("can export database", function (done) {
  //   const adapter = new FsStructuredAdapter();
  //   const TEST_DB_NAME = `fs_test_${randomUUID()}.db`;
  //   const db = new Sylvie(TEST_DB_NAME, {
  //     adapter: adapter,
  //   });

  //   const collection = db.addCollection("users");
  //   collection.insert([
  //     {
  //       name: "joe",
  //     },
  //     {
  //       name: "jack",
  //     },
  //   ]);

  //   db.saveDatabase(() => {
  //     const newAdapter = new FsStructuredAdapter();
  //     const newDb = new Sylvie(TEST_DB_NAME, {
  //       adapter: newAdapter,
  //     });

  //     newDb.loadDatabase({}, () => {
  //       expect(newDb.collections.length).toBe(1);

  //       const newCollection = newDb.getCollection("users");
  //       const docs = newCollection.find();

  //       expect(docs.length).toBe(2);
  //       expect(docs[0].name).toBe("joe");
  //       expect(docs[1].name).toBe("jack");

  //       // Clean up database from fs
  //       db.close(() => {
  //         db.deleteDatabase((res) => {
  //           expect((res as ResultType)?.success).toBe(true);
  //           done();
  //         });
  //       });
  //     });
  //   });
  // });
});
