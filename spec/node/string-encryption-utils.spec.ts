import { bytesToBase64 } from "../../src/storage-adapter/src/utils/string-encryption-utils";

describe("string encryption utils", function () {
  it("bytesToBase64() should encode a large all 0xff input", function () {
    // big enough that one replace over the whole output crashes V8
    const bytes = new Uint8Array(3 * 2 ** 24).fill(255);
    expect(bytesToBase64(bytes) === "-".repeat(4 * 2 ** 24)).toBe(true);
  }, 30000);
});
