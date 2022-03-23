export const transformPayload = (payload) =>
  Object.entries(payload).map((entry) => entry.join(':'));
