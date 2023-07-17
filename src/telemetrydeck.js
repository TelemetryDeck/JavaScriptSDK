import { sha256 } from './utils/sha256.js';
import { version } from './utils/version.js';

/**
 * @typedef {Object} TelemetryDeckOptions
 *
 * @property {string} appID the app ID to send telemetry data to
 * @property {string} user the user ID to send telemetry data to
 * @property {string} [target] the target URL to send telemetry data to
 * @property {string} [sessionID]
 * @property {string} [salt]
 */

export default class TelemetryDeck {
  appID = '';
  user = '';
  salt = '';
  target = 'https://nom.telemetrydeck.com/v2/';
  isEnabled = true;

  /**
   *
   * @param {TelemetryDeckOptions} options
   */
  constructor(options = {}) {
    const { target, appID, user, isEnabled, sessionID, salt } = options;

    if (!appID) {
      throw new Error('appID is required');
    }

    this.target = target ?? this.target;
    this.appID = appID;
    this.user = user;
    this.isEnabled = isEnabled ?? this.isEnabled;
    // Math.random is not cryptographically secure, but it's good enough for our purposes – the session ID needs to be unique enough in combination with the user ID
    this.sessionID = sessionID ?? (0 | (Math.random() * 9e6)).toString(36);
    this.salt = salt;
  }

  /**
   *
   * @param {string} type the type of telemetry data to send
   * @param {TelemetryDeckPayload?} payload custom payload to be stored with each signal
   * @param {TelemetryDeckOptions} options
   * @returns <Promise<Response>> a promise with the response from the server, echoing the sent data
   */
  async signal(type, payload = {}, options = {}) {
    const { appID, target, salt } = this;
    let { user, sessionID } = this;

    user = options.user ?? user;
    sessionID = options.sessionID ?? sessionID;

    if (!type) {
      throw new Error(`TelemetryDeck: "type" is not set`);
    }

    if (!appID) {
      throw new Error(`TelemetryDeck: "appID" is not set`);
    }

    if (!user) {
      throw new Error(`TelemetryDeck: "user" is not set`);
    }

    user = await sha256([user, salt].join(''));

    return fetch(target, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          clientUser: user,
          sessionID,
          appID,
          telemetryClientVersion: `JavaScriptSDK ${version}`,
          payload,
        },
      ]),
    });
  }
}
