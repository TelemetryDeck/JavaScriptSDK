/**
 * Calculate the SHA-256 hash of a string using a provided instance of SubtleCrypto
 * (e.g. window.crypto.subtle).
 *
 * Requires `.digest()` to be available on the SubtleCrypto instance.
 *
 * Defaults to globalThis.crypto.subtle if available.
 *
 * // https://stackoverflow.com/a/48161723/54547
 *
 * @param {Function} subtleCrypto
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function sha256(message, subtleCrypto = globalThis?.crypto?.subtle) {
  // encode as UTF-8
  const messageBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await subtleCrypto.digest('SHA-256', messageBuffer);

  // convert ArrayBuffer to Array
  const hashArray = [...new Uint8Array(hashBuffer)];

  // convert bytes to hex string
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
