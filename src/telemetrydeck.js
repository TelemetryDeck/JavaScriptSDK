import { randomString } from './utils/random-string.js';
import { sha256 } from './utils/sha256.js';
import { Store } from './utils/store.js';
import { version } from './utils/version.js';

/**
 * @typedef {Object} TelemetryDeckOptions
 *
 * @property {string} appID the app ID to send telemetry data to
 * @property {string} namespace the namespace of your organization, shown in the TelemetryDeck Dashboard
 * @property {string} clientUser the clientUser ID to send telemetry data to
 * @property {string} [target] the base URL to send telemetry data to. The namespace is appended to it.
 * @property {string} [sessionID] An optional session ID to include in each event
 * @property {string} [salt] A salt to use when hashing the clientUser ID
 * @property {boolean} [testMode] If "true", events will be marked as test events and only show up in Test Mode in the Dashbaord
 * @property {Store} [store] A store to use for queueing events
 * @property {Function} [subtleCrypto] Used for providing an alternative implementation of SubtleCrypto where no browser is available. Expects a class providing a `.digest(method, value)` method.
 */

/**
 * @typedef {Object.<string, any>} TelemetryDeckPayload
 */

export default class TelemetryDeck {
  appID = '';
  namespace = '';
  clientUser = '';
  salt = '';
  target = 'https://nom.telemetrydeck.com/v3/';
  testMode = false;

  /**
   *
   * @param {TelemetryDeckOptions} options
   */
  constructor(options = {}) {
    const { target, appID, namespace, clientUser, sessionID, salt, testMode, store, subtleCrypto } =
      options;

    if (!appID) {
      throw new Error('appID is required');
    }

    if (!namespace) {
      throw new Error('namespace is required');
    }

    this.store = store ?? new Store();
    this.target = target ?? this.target;
    this.appID = appID;
    this.namespace = namespace;
    this.clientUser = clientUser;
    this.sessionID = sessionID ?? randomString();
    this.salt = salt ?? this.salt;
    this.testMode = testMode ?? this.testMode;
    this.subtleCrypto = subtleCrypto;
  }

  /**
   * Send a TelemetryDeck event
   *
   * @param {string} type the type of telemetry data to send
   * @param {TelemetryDeckPayload} [payload] custom payload to be stored with each event
   * @param {TelemetryDeckOptions} [options]
   * @returns <Promise<Response>> a promise with the response from the server. The body is the number of accepted events.
   */
  async event(type, payload, options) {
    const body = await this._build(type, payload, options);

    return this._post([body]);
  }

  /**
   * Enqueue an event to be sent to TelemetryDeck later.
   *
   * Use flush() to send all queued events.
   *
   * @param {string} type
   * @param {TelemetryDeckPayload} [payload]
   * @param {TelemetryDeckOptions} [options]
   * @returns <Promise>
   */
  async queue(type, payload, options) {
    const bodyPromise = this._build(type, payload, options);

    return this.store.push(bodyPromise);
  }

  /**
   * Send all queued events to TelemetryDeck.
   *
   * Enqueue events with queue().
   *
   * @returns <Promise<Response>> a promise with the response from the server. The body is the number of accepted events.
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

  async _build(type, payload, options) {
    const receivedAt = new Date().toISOString();
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

    return {
      ...this._flatPayload(payload),
      clientUser,
      sessionID,
      appID,
      type,
      receivedAt,
      isTestMode: testMode ? 'true' : 'false',
      'TelemetryDeck.SDK.name': 'JavaScriptSDK',
      'TelemetryDeck.SDK.version': version,
      'TelemetryDeck.SDK.nameAndVersion': `JavaScriptSDK ${version}`,
    };
  }

  _flatPayload(payload) {
    const result = {};

    if (!payload || typeof payload !== 'object') {
      return result;
    }

    for (const [name, value] of Object.entries(payload)) {
      // The server rejects the full batch if a key has other characters
      const key = name.replaceAll(/[^\w.-]/g, '_');

      if (key === 'floatValue') {
        result[key] = Number.parseFloat(value);
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (value !== null && typeof value === 'object') {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  _post(body) {
    const { target, namespace } = this;

    return fetch(`${target.replace(/\/+$/, '')}/${namespace}/`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });
  }
}
