import { version } from '../package.json';
import sha256 from './utils/sha256.mjs';
import assertKeyValue from './utils/assert-key-value.mjs';
import transformPayload from './utils/transform-payload.mjs';

const APP = 'app';
const USER = 'user';
const SIGNAL = 'signal';

export class TelemetryDeck {
  constructor(options = {}) {
    const { target, app, user } = options;

    this.target = target ?? 'https://nom.telemetrydeck.com/v1/';
    this._app = app;
    this._user = user;
  }

  async ingest(queue) {
    for (const [method, data] of queue) {
      try {
        await this[method].call(this, data);
      } catch (error) {
        console.error(error);
      }
    }
  }

  [APP](appId) {
    this._app = appId;
  }

  [USER](identifier) {
    this._user = identifier;
  }

  /**
   * This method is used to queue messages to be sent by TelemtryDeck
   * @param {string} type
   * @param {string} [payload]
   *
   * @returns {Promise<void>}
   */
  push([method, data] = []) {
    return this[method](data);
  }

  /**
   *
   * @param {Object?} payload custom payload to be stored with each signal
   * @returns <Promise<Response>> a promise with the response from the server, echoing the sent data
   */
  async [SIGNAL](payload = {}) {
    const { href: url } = location;
    const { userAgent: useragent, language: locale, userAgentData, vendor } = navigator;
    const { _app, target } = this;
    let { _user } = this;
    let { type } = payload;

    delete payload.type;

    assertKeyValue(APP, _app);
    assertKeyValue(USER, _user);

    _user = await sha256(_user);

    return fetch(target, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          appID: _app,
          clientUser: _user,
          sessionID: _user,
          telemetryClientVersion: version,
          type: type ?? 'pageview',
          payload: transformPayload({
            url,
            useragent,
            locale,
            platform: userAgentData ?? '',
            vendor,
            ...payload,
          }),
        },
      ]),
    });
  }
}

if (window && window.td) {
  const td = new TelemetryDeck({});
  td.ingest(window.td);
  window.td = td;
}
