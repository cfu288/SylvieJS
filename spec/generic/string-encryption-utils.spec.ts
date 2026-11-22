import {
  base64ToBytes,
  bytesToBase64,
} from "../../src/storage-adapter/src/utils/string-encryption-utils";

describe("string encryption utils", function () {
  it("bytesToBase64() returns known values", function () {
    expect(bytesToBase64(new Uint8Array([]))).toEqual("");
    expect(bytesToBase64(new Uint8Array([0]))).toEqual("AA==");
    expect(bytesToBase64(new Uint8Array([0, 0]))).toEqual("AAA=");
    expect(bytesToBase64(new Uint8Array([251, 255]))).toEqual("_-8=");
    expect(bytesToBase64(new Uint8Array([255, 255, 255]))).toEqual("----");
    expect(bytesToBase64(new Uint8Array([251, 239, 190]))).toEqual("____");
    expect(bytesToBase64(new TextEncoder().encode("hello"))).toEqual(
      "aGVsbG8=",
    );
    const allBytes = new Uint8Array(256).map((_, i) => i);
    expect(bytesToBase64(allBytes)).toEqual(
      "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0_P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn_AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq_wsbKztLW2t7i5uru8vb6-wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t-g4eLj5OXm5_jp6uvs7e7v8PHy8-T19vf4_fr7-P3_-w==",
    );
  });

  it("bytesToBase64() output can be read back by base64ToBytes()", function () {
    for (const length of [1, 2, 3, 4, 5, 32768 * 3 + 1, 32768 * 3 + 2]) {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = (i * 7919) % 256;
      }
      expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(
        Array.from(bytes),
      );
    }
  });
});
