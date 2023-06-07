import { SortedIndex } from "../../src/modules/index/sorted-index";
import { BSonSort, binarySearch } from "../../src/utils/binary-search";
describe("binary search", function () {
  it("can find a value in an array", function () {
    const arr = [1, 2, 3, 4, 5];
    const pos = binarySearch(arr, 3, function (a, b) {
      return a - b;
    });
    expect(pos.found).toEqual(true);
    expect(pos.index).toEqual(2);
  });
  it("can find a value in an array with a custom sort", function () {
    const arr = [1, 2, 3, 4, 5];
    const pos = binarySearch(arr, 3, function (a, b) {
      return b - a;
    });
    expect(pos.found).toEqual(true);
    expect(pos.index).toEqual(2);
  });
  it("returns an index equal to the size of the array if the value is not found", function () {
    const arr = [1, 2, 3, 4, 5];
    const pos = binarySearch(arr, 6, function (a, b) {
      return a - b;
    });
    expect(pos.found).toEqual(false);
    expect(pos.index).toEqual(5);
  });
});

describe("BSonSort", function () {
  it("returns a function", function () {
    const fun = BSonSort(function (a, b) {
      return a - b;
    });
    expect(typeof fun).toEqual("function");
  });
  it("can find a value in an array", function () {
    const arr = [1, 2, 3, 4, 5];
    const fun = BSonSort(function (a, b) {
      return a - b;
    });
    const pos = fun(arr, 3);
    expect(pos.found).toEqual(true);
    expect(pos.index).toEqual(2);
  });
});

describe("sorted index", function () {
  let idx;
  beforeEach(function () {
    idx = new SortedIndex("testIndex");
  });
  it("can set a value to a key and get that value as an single object array", function () {
    idx.set(1, 10);
    expect(idx.get(1)).toEqual([10]);
  });
  it("can get an array of multiple values that have been set on an key", function () {
    idx.set(1, 10);
    idx.set(1, 20);
    expect(idx.get(1)).toEqual([10, 20]);
    idx.set(1, 30);
    expect(idx.get(1)).toEqual([10, 20, 30]);
  });
  it("can remove a value from a key", function () {
    idx.set(1, 10);
    idx.set(1, 20);
    idx.set(1, 30);
    idx.remove(1, 20);
    expect(idx.get(1)).toEqual([10, 30]);
  });
  it("get returns an empty array when the last value is removed from a key", function () {
    idx.set(1, 10);
    idx.remove(1, 10);
    expect(idx.get(1)).toEqual([]);
  });
  it("can clear the index", function () {
    idx.set(1, 10);
    idx.set(1, 20);
    idx.set(1, 30);
    idx.clear();
    expect(idx.get(1)).toEqual([]);
  });
  it("getAll() can get all values which have a key <= the given key", function () {
    idx.set(1, 10);
    idx.set(2, 20);
    idx.set(3, 30);
    idx.set(4, 40);
    idx.set(5, 50);
    expect(idx.getAll(1, 4)).toEqual([20, 30, 40]);
  });
  it("getLt() can get all values which have a key < the given key", function () {
    idx.set(1, 10);
    idx.set(2, 20);
    idx.set(3, 30);
    idx.set(4, 40);
    idx.set(5, 50);
    expect(idx.getLt(3)).toEqual([10, 20]);
  });
  it("getGt() can get all values which have a key > the given key", function () {
    idx.set(1, 10);
    idx.set(2, 20);
    idx.set(3, 30);
    idx.set(4, 40);
    idx.set(5, 50);
    expect(idx.getGt(3)).toEqual([40, 50]);
  });
  it("getPos() can get the position of a key", function () {
    idx.set(1, 10);
    idx.set(2, 20);
    idx.set(3, 30);
    idx.set(4, 40);
    idx.set(5, 50);
    expect(idx.getPos(3).index).toEqual(2);
  });
});
