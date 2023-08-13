import Sylvie from "../../src/sylviejs";
import { PersistenceAdapter } from "../../src/storage-adapter/persistence-adapter";
import { CollectionDocument } from "../../src/modules/collection";
const loki = Sylvie;

describe("dirtyIds", function () {
  it("doesnt do anything unless using incremental adapters", function () {
    const db = new loki("test.db");
    const coll = db.addCollection("coll");

    const doc1 = { foo: "1" } as CollectionDocument,
      doc2 = { foo: "2" } as CollectionDocument,
      doc3 = { foo: "3" } as CollectionDocument;
    coll.insert([doc1, doc2, doc3]);
    doc2.bar = "true";
    coll.update(doc2);
    coll.remove(doc3);

    expect(coll.dirtyIds).toEqual([]);
  });
  it("loki and db are incremental if adapter is incremental", function () {
    const adapter = { mode: "incremental" };
    const db = new loki("test.db", {
      adapter: adapter as PersistenceAdapter,
    });
    const coll = db.addCollection("coll");

    expect(db.isIncremental).toBe(true);
    expect(coll.isIncremental).toBe(true);
  });
  it("tracks inserts", function () {
    const adapter = { mode: "incremental" };
    const db = new loki("test.db", {
      adapter: adapter as PersistenceAdapter,
    });
    const coll = db.addCollection("coll");

    const doc1 = { foo: "1" } as CollectionDocument;
    coll.insert(doc1);

    expect(coll.dirtyIds).toEqual([doc1.$loki]);
  });
  it("tracks updates", function () {
    const adapter = { mode: "incremental" };
    const db = new loki("test.db", {
      adapter: adapter as PersistenceAdapter,
    });
    const coll = db.addCollection("coll");

    const doc1 = { foo: "1" } as CollectionDocument;
    coll.insert(doc1);
    doc1.change = "true";
    coll.update(doc1);

    expect(coll.dirtyIds).toEqual([doc1.$loki, doc1.$loki]);
  });
  it("tracks deletes", function () {
    const adapter = { mode: "incremental" };
    const db = new loki("test.db", {
      adapter: adapter as PersistenceAdapter,
    });
    const coll = db.addCollection("coll");

    const doc1 = { foo: "1" } as CollectionDocument;
    coll.insert(doc1);
    const id = doc1.$loki;
    coll.remove(doc1);

    expect(coll.dirtyIds).toEqual([id, id]);
  });
  it("tracks many changes", function () {
    const adapter = { mode: "incremental" };
    const db = new loki("test.db", {
      adapter: adapter as PersistenceAdapter,
    });
    const coll = db.addCollection("coll");

    const doc1 = { foo: "1" } as CollectionDocument,
      doc2 = { foo: "2" } as CollectionDocument,
      doc3 = { foo: "3" } as CollectionDocument;
    coll.insert([doc1, doc2, doc3]);
    const doc3id = doc3.$loki;
    doc2.bar = "true";
    coll.update(doc2);
    coll.remove(doc3);

    expect(coll.dirtyIds).toEqual([
      doc1.$loki,
      doc2.$loki,
      doc3id,
      doc2.$loki,
      doc3id,
    ]);
  });
});
