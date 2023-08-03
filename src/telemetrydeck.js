import { randomString } from './utils/random-string.js';
import { sha256 } from './utils/sha256.js';
import { TimelineStore } from './utils/store.js';
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
  testMode = false;

  #queueMonotone = 0;

  /**
   *
   * @param {TelemetryDeckOptions} options
   */
  constructor(options = {}) {
    const { target, appID, user, sessionID, salt, testMode, store } = options;

    if (!appID) {
      throw new Error('appID is required');
    }

    this.store = store ?? new TimelineStore();

    this.target = target ?? this.target;
    this.appID = appID;
    this.user = user;
    this.sessionID = sessionID ?? randomString();
    this.salt = salt;
    this.testMode = testMode ?? this.testMode;
  }

  /**
   *
   * @param {string} type the type of telemetry data to send
   * @param {TelemetryDeckPayload?} payload custom payload to be stored with each signal
   * @param {TelemetryDeckOptions} options
   * @returns <Promise<Response>> a promise with the response from the server, echoing the sent data
   */
  async signal(type, payload, options) {
    const body = await this.#build(type, payload, options);

    return this.#post([body]);
  }

  async queue(type, payload, options) {
    const bodyPromise = this.#build(type, payload, options);

    return this.store.push(bodyPromise);
  }

  async flush() {
    const flushPromise = this.#post(this.store.values);

    this.store.clear();
    this.#queueMonotone = 0;

    return flushPromise;
  }

  async #build(type, payload, options) {
    const { appID, salt, testMode } = this;
    let { user, sessionID } = this;

    options = options ?? {};
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

    const body = {
      clientUser: user,
      sessionID,
      appID,
      type,
      telemetryClientVersion: `JavaScriptSDK ${version}`,
    };

    if (testMode) {
      body.isTestMode = true;
    }

    body.payload = {};

    for (const [key, value] of Object.entries(payload ?? {})) {
      if (key === 'floatValue') {
        body.payload[key] = Number.parseFloat(value);
      } else if (value instanceof Date) {
        body.payload[key] = value.toISOString();
      } else if (typeof value === 'string') {
        body.payload[key] = value;
      } else if (typeof value === 'object') {
        body.payload[key] = JSON.stringify(value);
      } else {
        body.payload[key] = `${value}`;
      }
    }

    return body;
  }

  #post(body) {
    const { target } = this;

    return fetch(target, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }
}
