import { version } from '../package.json';

const transformPayload = (payload) => Object.entries(payload).map((entry) => entry.join(':'));

const assertKeyValue = (key, value) => {
  if (!value) {
    throw new Error(`TelemetryDeck: ${key} is not set`);
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

class TelemetryDeck {
  constructor(appID, target) {
    this.appID = appID;
    this.target = target ?? 'https://nom.telemetrydeck.com/v1/';

    assertKeyValue('appID', appID);
  }

  /**
   *
   * @paam {string} userIdentifier to be hashed
   * @param {Object?} payload custom payload to be stored with each signal
   * @returns <Promise<Response>> a promise with the response from the server, echoing the sent data
   */
  async signal(userIdentifier, payload) {
    const { href: url } = location;
    const { userAgent: useragent, language: locale, userAgentData, vendor } = navigator;

    payload = {
      url,
      useragent,
      locale,
      platform: userAgentData ?? '',
      vendor,
      ...payload,
    };

    let { appID, target } = this;

    assertKeyValue('userIdentifier', userIdentifier);

    userIdentifier = await sha256(userIdentifier);

    return fetch(target, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          appID,
          clientUser: userIdentifier,
          sessionID: userIdentifier,
          telemetryClientVersion: version,
          type: 'pageview',
          payload: transformPayload(payload),
        },
      ]),
    });
  }
}

export default TelemetryDeck;
