let _key: CryptoKey | undefined;

export function setE2EKey(key: CryptoKey): void {
  _key = key;
}

export function getE2EKey(): CryptoKey | undefined {
  return _key;
}

export function clearE2EKey(): void {
  _key = undefined;
}

export function isE2EKeyReady(): boolean {
  return _key !== undefined;
}
