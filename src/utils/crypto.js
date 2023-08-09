export async function getCrypto() {
  let crypto = globalThis.crypto;

  if (!crypto) {
    // eslint-disable-next-line unicorn/prefer-node-protocol
    crypto = await import('crypto').then((m) => m.webcrypto);
  }

  return crypto;
}
