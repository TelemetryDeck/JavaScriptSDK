// Math.random is not cryptographically secure, but it's good enough for our purposes
export function randomString() {
  return (0 | (Math.random() * 9e6)).toString(36);
}
