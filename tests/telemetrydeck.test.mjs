/* eslint-disable jest/no-conditional-expect */
import TelemetryDeck from '../src/telemetrydeck.mjs';
import { version } from '../package.json';

const oldWindowLocation = window.location;

beforeAll(() => {
  delete window.location;
  window.location = { href: '/' };
});

afterAll(() => {
  window.location = oldWindowLocation;
});

describe('TelemetryDeck constructor', () => {
  test('throws error if appID is not passed', async () => {
    expect.assertions(1);

    try {
      new TelemetryDeck();
    } catch (error) {
      expect(error.message).toMatch('TelemetryDeck: appID is not set');
    }
  });
});

describe('TelemetryDeck.signal()', () => {
  test('throws error if userIdentifier is not passed', async () => {
    const td = new TelemetryDeck('foo');

    await expect(td.signal()).rejects.toThrow('TelemetryDeck: userIdentifier is not set');
  });

  test('sends signal to a different TelemetryDeck host with basic data', async () => {
    window.location.href = 'https://nasa.gov';

    const spy = jest.spyOn(window, 'fetch');
    const td = new TelemetryDeck('foo', 'https://nom.nasa.gov/v1/');

    await td.signal('bar');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('https://nom.nasa.gov/v1/', {
      body: JSON.stringify([
        {
          appID: 'foo',
          clientUser: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
          sessionID: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
          telemetryClientVersion: version,
          type: 'pageview',
          payload: [
            `url:${location.href}`,
            `useragent:${navigator.userAgent}`,
            `locale:${navigator.language}`,
            `platform:${navigator.userAgentData ?? ''}`,
            `vendor:${navigator.vendor}`,
          ],
        },
      ]),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
    });
  });

  test('sends signal to TelemetryDeck with basic data', async () => {
    window.location.href = 'https://nasa.gov';

    const spy = jest.spyOn(window, 'fetch');
    const td = new TelemetryDeck('foo');

    await td.signal('bar');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('https://nom.telemetrydeck.com/v1/', {
      body: JSON.stringify([
        {
          appID: 'foo',
          clientUser: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
          sessionID: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
          telemetryClientVersion: version,
          type: 'pageview',
          payload: [
            `url:${location.href}`,
            `useragent:${navigator.userAgent}`,
            `locale:${navigator.language}`,
            `platform:${navigator.userAgentData ?? ''}`,
            `vendor:${navigator.vendor}`,
          ],
        },
      ]),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
    });
  });

  test('sends signal to TelemetryDeck with additional payload data', async () => {
    const spy = jest.spyOn(window, 'fetch');
    const td = new TelemetryDeck('foo');

    await td.signal('bar', {
      baz: 'bat',
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('https://nom.telemetrydeck.com/v1/', {
      body: JSON.stringify([
        {
          appID: 'foo',
          clientUser: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
          sessionID: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
          telemetryClientVersion: version,
          type: 'pageview',
          payload: [
            `url:${location.href}`,
            `useragent:${navigator.userAgent}`,
            `locale:${navigator.language}`,
            `platform:${navigator.userAgentData ?? ''}`,
            `vendor:${navigator.vendor}`,
            `baz:bat`,
          ],
        },
      ]),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
    });
  });
});
