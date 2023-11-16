import { randomString } from './utils/random-string.js';
import { sha256 } from './utils/sha256.js';
import { Store } from './utils/store.js';
import { version } from './utils/version.js';

/**
 * @typedef {Object} TelemetryDeckOptions
 *
 * @property {string} appID the app ID to send telemetry data to
 * @property {string} clientUser the clientUser ID to send telemetry data to
 * @property {string} [target] the target URL to send telemetry data to
 * @property {string} [sessionID] An optional session ID to include in each signal
 * @property {string} [salt] A salt to use when hashing the clientUser ID
 * @property {boolean} [testMode] If "true", signals will be marked as test signals and only show up in Test Mode in the Dashbaord
 * @property {Store} [store] A store to use for queueing signals
 * @property {Function} [subtleCrypto] Used for providing an alternative implementation of SubtleCrypto where no browser is available. Expects a class providing a `.digest(method, value)` method.
 */

export default class TelemetryDeck {
  appID = '';
  clientUser = '';
  salt = '';
  target = 'https://nom.telemetrydeck.com/v2/';
  testMode = false;

  /**
   *
   * @param {TelemetryDeckOptions} options
   */
  constructor(options = {}) {
    const { target, appID, clientUser, sessionID, salt, testMode, store, subtleCrypto } = options;

    if (!appID) {
      throw new Error('appID is required');
    }

    this.store = store ?? new Store();
    this.target = target ?? this.target;
    this.appID = appID;
    this.clientUser = clientUser;
    this.sessionID = sessionID ?? randomString();
    this.salt = salt ?? this.salt;
    this.testMode = testMode ?? this.testMode;
    this.subtleCrypto = subtleCrypto;
  }

  /**
   * Send a TelemetryDeck signal
   *
   * @param {string} type the type of telemetry data to send
   * @param {TelemetryDeckPayload} [payload] custom payload to be stored with each signal
   * @param {TelemetryDeckOptions} [options]
   * @returns <Promise<Response>> a promise with the response from the server, echoing the sent data
   */
  async signal(type, payload, options) {
    const body = await this._build(type, payload, options);

    return this._post([body]);
  }

  /**
   * Enqueue a signal to be sent to TelemetryDeck later.
   *
   * Use flush() to send all queued signals.
   *
   * @param {string} type
   * @param {TelemetryDeckPayload} [payload]
   * @param {TelemetryDeckOptions} [options]
   * @returns <Promise>
   */
  async queue(type, payload, options) {
    const receivedAt = new Date().toISOString();
    const bodyPromise = this._build(type, payload, options, receivedAt);

    return this.store.push(bodyPromise);
  }

  /**
   * Send all queued signals to TelemetryDeck.
   *
   * Enqueue signals with queue().
   *
   * @returns <Promise<Response>> a promise with the response from the server, echoing the sent data
   */
  async flush() {
    const flushPromise = this._post(this.store.values());

    this.store.clear();

    return flushPromise;
  }

  _clientUserAndSalt = '';
  _clientUserHashed = '';

  async _hashedClientUser(clientUser, salt) {
    if (clientUser + salt !== this._clientUserAndSalt) {
      this._clientUserHashed = await sha256([clientUser, salt].join(''), this.subtleCrypto);
      this._clientUserAndSalt = clientUser + salt;
    }

    return this._clientUserHashed;
  }

  async _build(type, payload, options, receivedAt) {
    const { appID, testMode } = this;
    let { clientUser, salt, sessionID } = this;

    options = options ?? {};
    clientUser = options.clientUser ?? clientUser;
    salt = options.salt ?? salt;
    sessionID = options.sessionID ?? sessionID;

    if (!type) {
      throw new Error(`TelemetryDeck: "type" is not set`);
    }

    if (!appID) {
      throw new Error(`TelemetryDeck: "appID" is not set`);
    }

    if (!clientUser) {
      throw new Error(`TelemetryDeck: "clientUser" is not set`);
    }

    clientUser = await this._hashedClientUser(clientUser, salt);

    const body = {
      clientUser,
      sessionID,
      appID,
      type,
      telemetryClientVersion: `JavaScriptSDK ${version}`,
    };

    if (receivedAt) {
      body.receivedAt = receivedAt;
    }

    if (testMode) {
      body.isTestMode = true;
    }

    return this._appendPayload(body, payload);
  }

  _appendPayload(body, payload) {
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      return body;
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

  _post(body) {
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
