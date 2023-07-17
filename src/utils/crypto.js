export async function getCrypto() {
  let crypto = globalThis.crypto;

  if (!crypto) {
    crypto = await import('node:crypto').then((m) => m.webcrypto);
  }

  return crypto;
}
