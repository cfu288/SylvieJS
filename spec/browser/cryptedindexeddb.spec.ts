/* eslint-disable @typescript-eslint/no-var-requires */
import Sylvie from "../../src/sylviejs";
import { Collection } from "../../src/modules/collection";
import { CryptedIndexedDBAdapter } from "../../src/storage-adapter/crypted-indexeddb-adapter";
const loki = Sylvie;

describe("CryptedIndexedDBAdapter", function () {
  this.timeout(5000);

  it("initializes Loki properly", function () {
    const adapter = new CryptedIndexedDBAdapter("tests", {
      secret: "password",
    });
    const db = new loki("test.db", {
      adapter: adapter,
    });
    const coll = db.addCollection("coll");

    // @ts-ignore
    expect(adapter.setSecret).not.toBeNull();
  });

  it("can insert data", function (done) {
    const db = new loki("test.db", {
      adapter: new CryptedIndexedDBAdapter("tests", {
        secret: "password",
      }),
    });
    const collection = db.addCollection("items");
    collection.insert([
      { customId: 0, val: "hello", constraints: 100 },
      { customId: 1, val: "hello1" },
      { customId: 2, val: "hello2" },
    ]);
    expect(db.collections.length).toBe(1);
    expect(db.collections[0].data.length).toBe(3);

    db.saveDatabase(function () {
      collection.clear();

      db.loadDatabase({}, function () {
        const collection = db.getCollection("items");
        done();

        const docs = collection.find();
        expect(docs.length).toEqual(3);
      });
    });

    // await db.saveDatabase();

    // const db2 = new loki("test.db", {
    //   adapter: new CryptedIndexedDBAdapter("tests", {
    //     secret: "password",
    //   }),
    // });
    // await db2.loadDatabase();

    // db.saveDatabase(function (e) {
    //   expect(e).toBe(undefined);

    //   // eslint-disable-next-line prefer-const
    //   let adapter2 = new CryptedIndexedDBAdapter("tests", {
    //     secret: "password",
    //   });
    //   const db2 = new loki("test.db", { adapter: adapter2 });

    //   db2.loadDatabase({}, function (e) {
    //     expect(e).toBe(undefined);
    //     expect(db.collections.length).toBe(1);
    //     expect(db.collections[1].data.length).toBe(2);
    //     expect(db2.collections.length).toBe(1);
    //     expect(db2.collections[1].data.length).toBe(2);
    //     // checkDatabaseCopyIntegrity(db, db2);
    //     done();
    //   });
    // });
  });

  function checkDatabaseCopyIntegrity(source, copy) {
    source.collections.forEach(function (sourceCol: Collection<any>, i) {
      const copyCol = copy.collections[i];
      expect(copyCol.name).toBe(sourceCol.name);
      expect(copyCol.data.length).toBe(sourceCol.data.length);
      JSON.stringify(copyCol.data);
      copyCol.data.every(function (copyEl, elIndex) {
        console.log(JSON.stringify(copyEl));
        expect(JSON.stringify(copyEl)).toBe(
          JSON.stringify(source.collections[i].data[elIndex])
        );
      });
    });
  }

  // it('basically works', function(done) {
  //   var adapter = new IncrementalIndexedDBAdapter('tests');
  //   var db = new loki('test.db', { adapter: adapter });
  //   var col1 = db.addCollection('test_collection');

  //   col1.insert({ customId: 0, val: 'hello', constraints: 100 });
  //   col1.insert({ customId: 1, val: 'hello1' });
  //   var h2 = col1.insert({ customId: 2, val: 'hello2' });
  //   var h3 = col1.insert({ customId: 3, val: 'hello3' });
  //   var h4 = col1.insert({ customId: 4, val: 'hello4' });
  //   var h5 = col1.insert({ customId: 5, val: 'hello5' });

  //   h2.val = 'UPDATED';
  //   col1.update(h2);

  //   h3.val = 'UPDATED';
  //   col1.update(h3);
  //   h3.val2 = 'added!';
  //   col1.update(h3);

  //   col1.remove(h4);

  //   var h6 = col1.insert({ customId: 6, val: 'hello6' });

  //   db.saveDatabase(function (e) {
  //     expect(e).toBe(undefined);

  //     var adapter2 = new IncrementalIndexedDBAdapter('tests');
  //     var db2 = new loki('test.db', { adapter: adapter2 });

  //     db2.loadDatabase({}, function (e) {
  //       expect(e).toBe(undefined);

  //       checkDatabaseCopyIntegrity(db, db2);
  //       done()
  //     });
  //   });
  // })
  // it('works with a lot of fuzzed data', function() {
  // })
  // it('can delete database', function() {
  // })
  // it('stores data in the expected format', function() {
  // })
  // NOTE: Because PhantomJS doesn't support IndexedDB, I moved tests to spec/incrementalidb.html
});
