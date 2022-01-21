/* eslint-disable jest/no-conditional-expect */
import { TelemetryDeck } from '../src/telemetrydeck.mjs';
import { version } from '../package.json';

const oldWindowLocation = window.location;

beforeAll(() => {
  delete window.location;
  window.location = { href: '/' };
});

afterAll(() => {
  window.location = oldWindowLocation;
  window.td = undefined;
});

describe('TelemetryDeck constructor', () => {
  test('can be instantiated with defaults', async () => {
    const td = new TelemetryDeck();
    expect(td).toBeDefined();
    expect(td.target).toBe('https://nom.telemetrydeck.com/v1/');
    expect(td._app).toBeUndefined();
    expect(td._user).toBeUndefined();
  });
});

describe('TelemetryDeck.signal()', () => {
  test('throws error if app is not set', async () => {
    const td = new TelemetryDeck({ user: 'foo' });

    await expect(td.signal()).rejects.toThrow('TelemetryDeck: "app" is not set');
  });

  test('throws error if user is not set', async () => {
    const td = new TelemetryDeck({ app: 'foo' });

    await expect(td.signal()).rejects.toThrow('TelemetryDeck: "user" is not set');
  });

  test('sends signal to TelemetryDeck with basic data', async () => {
    window.location.href = 'https://nasa.gov';

    const spy = jest.spyOn(window, 'fetch');
    const queue = [['app', 'foo'], ['user', 'bar'], ['signal']];
    const td = new TelemetryDeck();
    await td.ingest(queue);

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

  test('sends signals to TelemetryDeck with additional payload data', async () => {
    const spy = jest.spyOn(window, 'fetch');
    const queue = [['app', 'foo'], ['user', 'bar'], ['signal'], ['signal', { baz: 'bat' }]];
    const td = new TelemetryDeck();
    await td.ingest(queue);

    expect(spy).toHaveBeenCalledTimes(2);
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

  // TODO: test that queued data is sent by the default instance
});
