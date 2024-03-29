import Sylvie from "../../src/sylviejs";
import { ExactIndex } from "../../src/database/indexes/exact-index";

describe("exact index", function () {
  it("can set a value to a key and get that value as an single object array", function () {
    const idx = new ExactIndex("testIndex");
    idx.set(1, 1);
    expect(idx.get(1)).toEqual([1]);
  });
  it("can get an array of multiple values that have been set on an key", function () {
    const idx = new ExactIndex("testIndex");
    idx.set(1, 1);
    idx.set(1, 2);
    idx.set(1, 3);
    expect(idx.get(1)).toEqual([1, 2, 3]);
  });
  it("can remove a value from a key", function () {
    const idx = new ExactIndex("testIndex");
    idx.set(1, 1);
    idx.set(1, 2);
    idx.set(1, 3);
    idx.remove(1, 2);
    expect(idx.get(1)).toEqual([1, 3]);
  });
  it("get returns undefined when the last value is removed from a key", function () {
    const idx = new ExactIndex("testIndex");
    idx.set(1, 1);
    idx.remove(1, 1);
    expect(idx.get(1)).toEqual(undefined);
  });
  it("can clear the index", function () {
    const idx = new ExactIndex("testIndex");
    idx.set(1, 1);
    idx.set(1, 2);
    idx.set(1, 3);
    idx.clear();
    expect(idx.get(1)).toEqual(undefined);
  });
});
