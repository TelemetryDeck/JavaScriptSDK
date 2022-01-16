// https://stackoverflow.com/a/48161723/54547
export default async function sha256(message) {
  // encode as UTF-8
  const messageBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);

  // convert ArrayBuffer to Array
  const hashArray = [...new Uint8Array(hashBuffer)];

  // convert bytes to hex string
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}