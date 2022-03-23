export const assertKeyValue = (key, value) => {
  if (!value) {
    throw new Error(`TelemetryDeck: "${key}" is not set`);
  }
};
