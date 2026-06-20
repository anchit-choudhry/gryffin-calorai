import { afterEach, describe, expect, it } from "vitest";
import { clearE2EKey, getE2EKey, isE2EKeyReady, setE2EKey } from "./e2eKeyStore";

const makeFakeKey = () => ({ type: "secret" }) as unknown as CryptoKey;

afterEach(() => {
  clearE2EKey();
});

describe("e2eKeyStore", () => {
  it("starts with no key", () => {
    expect(getE2EKey()).toBeUndefined();
    expect(isE2EKeyReady()).toBe(false);
  });

  it("setE2EKey makes isE2EKeyReady return true", () => {
    setE2EKey(makeFakeKey());
    expect(isE2EKeyReady()).toBe(true);
  });

  it("getE2EKey returns the stored key", () => {
    const key = makeFakeKey();
    setE2EKey(key);
    expect(getE2EKey()).toBe(key);
  });

  it("clearE2EKey removes the key", () => {
    setE2EKey(makeFakeKey());
    clearE2EKey();
    expect(getE2EKey()).toBeUndefined();
    expect(isE2EKeyReady()).toBe(false);
  });
});
