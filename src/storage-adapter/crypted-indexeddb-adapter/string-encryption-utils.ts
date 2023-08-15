export function base64ToBytes(str: string) {
  if (str.length % 4 !== 0) {
    throw new Error("Unable to parse base64 string (invalid length).");
  }
  const index = str.indexOf("=");
  if (index !== -1 && index < str.length - 2) {
    throw new Error("Unable to parse base64 string (octets).");
  }
  const missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0,
    n = str.length,
    result = new Uint8Array(3 * (n / 4));
  let buffer;
  for (let i = 0, j = 0; i < n; i += 4, j += 3) {
    buffer =
      (getBase64Code(str.charCodeAt(i)) << 18) |
      (getBase64Code(str.charCodeAt(i + 1)) << 12) |
      (getBase64Code(str.charCodeAt(i + 2)) << 6) |
      getBase64Code(str.charCodeAt(i + 3));
    result[j] = buffer >> 16;
    result[j + 1] = (buffer >> 8) & 255;
    result[j + 2] = buffer & 255;
  }
  return result.subarray(0, result.length - missingOctets);
}

const base64abc = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "_",
  "-",
];

export const base64codes = (() => {
  const l = 256;
  const base64codes = new Uint8Array(l);
  for (let i = 0; i < l; ++i) {
    base64codes[i] = 255; // invalid character
  }
  base64abc.forEach((char, index) => {
    base64codes[char.charCodeAt(0)] = index;
  });
  base64codes["=".charCodeAt(0)] = 0; // ignored anyway, so we just need to prevent an error
  return base64codes;
})();

export function getBase64Code(charCode: number) {
  if (charCode >= base64codes.length) {
    throw new Error("Unable to parse base64 string (code beyond length).");
  }
  const code = base64codes[charCode]!;
  if (code === 255) {
    throw new Error("Unable to parse base64 string (invalid code).");
  }
  return code;
}

export function bytesToBase64(bytes: Uint8Array) {
  let result = "",
    i,
    l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i - 2]! >> 2];
    result += base64abc[((bytes[i - 2]! & 0x03) << 4) | (bytes[i - 1]! >> 4)];
    result += base64abc[((bytes[i - 1]! & 0x0f) << 2) | (bytes[i]! >> 6)];
    result += base64abc[bytes[i]! & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[bytes[i - 2]! >> 2];
    result += base64abc[(bytes[i - 2]! & 0x03) << 4];
    result += "==";
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[bytes[i - 2]! >> 2];
    result += base64abc[((bytes[i - 2]! & 0x03) << 4) | (bytes[i - 1]! >> 4)];
    result += base64abc[(bytes[i - 1]! & 0x0f) << 2];
    result += "=";
  }
  return result;
}

export function base64encode(str: string, encoder = new TextEncoder()) {
  return bytesToBase64(encoder.encode(str));
}

export function base64decode(str: string, decoder = new TextDecoder()) {
  return decoder.decode(base64ToBytes(str));
}

export const getPasswordKey = (password) => {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
};

export const deriveKey = (passwordKey, salt, keyUsage) =>
  window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 250000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    keyUsage
  );

export async function encryptData(secretData, password) {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ["encrypt"]);
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      new TextEncoder().encode(secretData)
    );

    const encryptedContentArr = new Uint8Array(encryptedContent);
    const buff = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
    );
    buff.set(salt, 0);
    buff.set(iv, salt.byteLength);
    buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);
    const base64Buff = bytesToBase64(buff);
    return base64Buff;
  } catch (e) {
    console.log(`Encryption Error - ${e}`);
    throw e;
  }
}

export async function decryptData(encryptedData, password) {
  try {
    const encryptedDataBuff = base64ToBytes(encryptedData);
    const salt = encryptedDataBuff.slice(0, 16);
    const iv = encryptedDataBuff.slice(16, 16 + 12);
    const data = encryptedDataBuff.slice(16 + 12);
    const passwordKey = await getPasswordKey(password);

    const aesKey = await deriveKey(passwordKey, salt, ["decrypt"]);
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      data
    );
    return new TextDecoder().decode(decryptedContent);
  } catch (e) {
    console.log(`Decryption Error - ${e}`);
    throw e;
  }
}
