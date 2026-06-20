import { describe, expect, it } from "vitest";
import { decryptBlob, deriveKey, encryptBlob } from "./e2eEncryption";

const TEST_PASSPHRASE = "correct-horse-battery-staple";
const TEST_SALT = crypto.getRandomValues(new Uint8Array(16));

describe("deriveKey", () => {
  it("produces a CryptoKey object", async () => {
    const key = await deriveKey(TEST_PASSPHRASE, TEST_SALT);
    expect(key).toBeInstanceOf(CryptoKey);
  });

  it("returns extractable=false", async () => {
    const key = await deriveKey(TEST_PASSPHRASE, TEST_SALT);
    expect(key.extractable).toBe(false);
  });
});

describe("encryptBlob / decryptBlob", () => {
  it("round-trips a simple object", async () => {
    const key = await deriveKey(TEST_PASSPHRASE, TEST_SALT);
    const original = { calories: 350, name: "apple" };
    const { iv, ciphertext } = await encryptBlob(key, original);
    const result = await decryptBlob(key, iv, ciphertext);
    expect(result).toStrictEqual(original);
  });

  it("produces a different IV on each call for identical plaintext", async () => {
    const key = await deriveKey(TEST_PASSPHRASE, TEST_SALT);
    const { iv: iv1 } = await encryptBlob(key, { x: 1 });
    const { iv: iv2 } = await encryptBlob(key, { x: 1 });
    expect(iv1).not.toBe(iv2);
  });

  it("round-trips a large payload without data loss", async () => {
    const key = await deriveKey(TEST_PASSPHRASE, TEST_SALT);
    const big = { data: "x".repeat(1_100_000) };
    const { iv, ciphertext } = await encryptBlob(key, big);
    const result = await decryptBlob(key, iv, ciphertext);
    expect((result as typeof big).data).toHaveLength(1_100_000);
  });

  it("throws DOMException when decrypting with wrong key", async () => {
    const rightKey = await deriveKey(TEST_PASSPHRASE, TEST_SALT);
    const wrongKey = await deriveKey("wrong-passphrase", TEST_SALT);
    const { iv, ciphertext } = await encryptBlob(rightKey, { secret: "data" });
    const decryptErr = await decryptBlob(wrongKey, iv, ciphertext).catch((e: unknown) => e);
    expect(decryptErr).toBeInstanceOf(Error);
    expect((decryptErr as Error & { name: string }).name).toBe("OperationError");
  });
});
