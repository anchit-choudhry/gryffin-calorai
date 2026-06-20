const PBKDF2_ITERATIONS = 600_000;
const KEY_ALGORITHM = { name: "AES-GCM", length: 256 } as const;

/** Derives a non-extractable AES-GCM-256 key from a passphrase and salt using PBKDF2. */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_ALGORITHM,
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Helper to encode Uint8Array to base64 efficiently,
 * avoiding stack overflow on large arrays.
 */
function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 65536;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...chunk));
  }
  return btoa(chunks.join(""));
}

/**
 * Helper to decode base64 to Uint8Array with an ArrayBuffer backing,
 * suitable for crypto.subtle operations.
 */
function base64ToBytes(base64: string): Uint8Array {
  const str = atob(base64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

/** Encrypts plaintext with a fresh 96-bit IV. Returns base64-encoded iv and ciphertext. */
export async function encryptBlob(
  key: CryptoKey,
  plaintext: unknown,
): Promise<{ iv: string; ciphertext: string }> {
  const ivBuf = new ArrayBuffer(12);
  const iv = crypto.getRandomValues(new Uint8Array(ivBuf));
  const encoded = new TextEncoder().encode(JSON.stringify(plaintext));
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: bytesToBase64(new Uint8Array(buf)),
  };
}

/**
 * Decrypts a base64-encoded blob. Throws DOMException if the key is wrong
 * (AES-GCM authentication tag verification fails).
 */
export async function decryptBlob(
  key: CryptoKey,
  iv: string,
  ciphertext: string,
): Promise<unknown> {
  const ivBytes = base64ToBytes(iv);
  const ctBytes = base64ToBytes(ciphertext);
  // WebCrypto API boundary: cast to BufferSource to satisfy crypto.subtle.
  const buf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes as BufferSource },
    key,
    ctBytes as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(buf)) as unknown;
}
