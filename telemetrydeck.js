const transformPayload = (payload) =>
  Object.entries(payload).map((entry) => entry.join(':'));

const assertOption = (options, key) => {
  if (!options[key]) {
    throw Error(`TelemetryDeck: options.${key} is not set`);
  }
};

export default async function sendTelemetry(options, payload) {
  options = {
    host: 'https://nom.telemetrydeck.com',
    appID: null,
    userIdentifier: null,
    ...options,
  };

  payload = {
    url: location.href,
    useragent: navigator.userAgent,
    locale: navigator.language,
    platform: navigator.userAgentData,
    vendor: navigator.vendor,
    ...payload,
  };

  assertOption(options, 'appID');
  assertOption(options, 'userIdentifier');

  let { appID, userIdentifier } = options;

  userIdentifier = await sha256(userIdentifier);

  return fetch(`${options.host}/api/v1/apps/app/signals/multiple/`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        appID: appID,
        clientUser: userIdentifier,
        sessionID: userIdentifier,
        telemetryClientVersion: '0.1.0',
        type: 'pageview',
        payload: transformPayload(payload),
      },
    ]),
  });
}

// https://stackoverflow.com/a/48161723/54547
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}
