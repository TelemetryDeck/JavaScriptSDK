import { version } from '../package.json';

const transformPayload = (payload) => Object.entries(payload).map((entry) => entry.join(':'));

const assertOption = (options, key) => {
  if (!options[key]) {
    throw new Error(`TelemetryDeck: options.${key} is not set`);
  }
};

// https://stackoverflow.com/a/48161723/54547
async function sha256(message) {
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

/**
 * @typedef {Object} TelemetryDeckTrackOptions
 *
 * @property {string?} host override the default TelemetryDeck ingestion host
 * @property {string} appID the id of your app in TelemetryDeck (required)
 * @property {string} userIdentifier  the identifier of your current user (required)
 */

/**
 *
 * @param {TelemetryDeckTrackOptions} options
 * @param {Object?} payload custom payload to be stored with each signal
 * @returns <Promise<Response>> a promise with the response from the server, echoing the sent data
 */
async function signal(options, payload) {
  options = {
    host: 'https://nom.telemetrydeck.com',
    appID: undefined,
    userIdentifier: undefined,
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

  let { appID, host, userIdentifier } = options;

  userIdentifier = await sha256(userIdentifier);

  return fetch(`${host}/api/v1/apps/app/signals/multiple/`, {
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
        telemetryClientVersion: version,
        type: 'pageview',
        payload: transformPayload(payload),
      },
    ]),
  });
}

export { signal };
