import test from 'ava';
import sinon from 'sinon';
import FakeTimers from '@sinonjs/fake-timers';

import TelemetryDeck from '../src/telemetrydeck.js';

const anonymousInHex = Buffer.from('anonymous').toString('hex');
const url = 'https://nom.telemetrydeck.com/v3/com.example/';

const options = (overrides) => ({
  appID: 'foo',
  namespace: 'com.example',
  clientUser: 'anonymous',
  sessionID: '1234567890',
  ...overrides,
});

const event = (overrides) => ({
  clientUser: anonymousInHex,
  sessionID: '1234567890',
  appID: 'foo',
  type: 'test',
  receivedAt: new Date().toISOString(),
  isTestMode: 'false',
  'TelemetryDeck.SDK.name': 'JavaScriptSDK',
  'TelemetryDeck.SDK.version': '__PACKAGE_VERSION__',
  'TelemetryDeck.SDK.nameAndVersion': 'JavaScriptSDK __PACKAGE_VERSION__',
  ...overrides,
});

const sentBody = (call) => JSON.parse(call.args[1].body);

test.beforeEach((t) => {
  const fake = sinon.fake(() => new Response('1'));

  t.context.fake = fake;

  sinon.replace(globalThis, 'fetch', fake);

  const random = sinon.fake.returns(0.4); // chosen by fair dice roll. guaranteed to be random.
  sinon.replace(Math, 'random', random);

  t.context.subtleCrypto = {
    digest: sinon.fake((_, value) => Promise.resolve(Buffer.from(value))),
  };

  t.context.clock = FakeTimers.install({ toFake: ['Date'] });
});

test.afterEach.always((t) => {
  t.context.clock.uninstall();
  sinon.restore();
});

test.serial("Can't instantiate without appID", (t) => {
  t.throws(() => new TelemetryDeck({ namespace: 'com.example' }), {
    message: 'appID is required',
  });
});

test.serial("Can't instantiate without namespace", (t) => {
  t.throws(() => new TelemetryDeck({ appID: 'foo' }), { message: 'namespace is required' });
});

test.serial('Can pass optional user, target and testMode flag', (t) => {
  const td = new TelemetryDeck({
    appID: 'foo',
    namespace: 'com.example',
    clientUser: 'bar',
    target: 'https://example.com',
    testMode: false,
  });

  t.is(td.appID, 'foo');
  t.is(td.namespace, 'com.example');
  t.is(td.clientUser, 'bar');
  t.is(td.target, 'https://example.com');
  t.is(td.testMode, false);
});

test.serial('Can send a signal', async (t) => {
  const { fake, subtleCrypto } = t.context;

  const td = new TelemetryDeck(options({ sessionID: undefined, subtleCrypto }));

  const response = await td.signal('test');

  t.is(await response.text(), '1');
  t.is(fake.callCount, 1);
  t.is(fake.firstCall.args[0], url);
  t.is(fake.firstCall.args[1].method, 'POST');
  t.is(fake.firstCall.args[1].headers['Content-Type'], 'application/json; charset=utf-8');
  t.deepEqual(sentBody(fake.firstCall), [event({ sessionID: '255s0' })]);
});

test.serial('Appends the namespace to a custom target', async (t) => {
  const { fake, subtleCrypto } = t.context;

  const td = new TelemetryDeck(options({ target: 'https://example.com/v3', subtleCrypto }));

  await td.signal('test');

  t.is(fake.firstCall.args[0], 'https://example.com/v3/com.example/');
});

test.serial("Can't send a signal without a type", async (t) => {
  const td = new TelemetryDeck(options());

  await t.throwsAsync(() => td.signal(), { message: 'TelemetryDeck: "type" is not set' });
});

test.serial('Can send a signal in test mode', async (t) => {
  const { fake, subtleCrypto } = t.context;

  const td = new TelemetryDeck(options({ testMode: true, subtleCrypto }));

  await td.signal('test');

  t.deepEqual(sentBody(fake.firstCall), [event({ isTestMode: 'true' })]);
});

test.serial('Can send additional payload attributes', async (t) => {
  const { fake, subtleCrypto } = t.context;

  const td = new TelemetryDeck(options({ subtleCrypto }));

  await td.signal('test', { foo: 'bar', blah: '0.1' });

  t.is(fake.firstCall.args[0], url);
  t.deepEqual(sentBody(fake.firstCall), [event({ foo: 'bar', blah: '0.1' })]);
});

test.serial('Can send a signal with salty user', async (t) => {
  const { fake, subtleCrypto } = t.context;

  const td = new TelemetryDeck(options({ salt: 'salty', subtleCrypto }));

  await td.signal('test');

  const saltyInHex = Buffer.from('salty').toString('hex');

  t.deepEqual(sentBody(fake.firstCall), [event({ clientUser: anonymousInHex + saltyInHex })]);
});

test.serial('Can queue signals and send them later', async (t) => {
  const { fake, subtleCrypto, clock } = t.context;

  const td = new TelemetryDeck(options({ subtleCrypto }));

  await td.queue('foo');
  await td.queue('bar');

  const queued = [event({ type: 'foo' }), event({ type: 'bar' })];

  t.deepEqual(td.store.values(), queued);

  clock.tick(1000);

  await td.signal('test');
  await td.flush();

  t.is(fake.callCount, 2);
  t.deepEqual(sentBody(fake.firstCall), [event()]);
  t.deepEqual(sentBody(fake.secondCall), queued);
  t.deepEqual(td.store.values(), []);
});

test.serial('Can build signal payloads', async (t) => {
  const { fake, subtleCrypto } = t.context;

  const td = new TelemetryDeck(options({ subtleCrypto }));

  await td.signal('test', {
    floatValue: '0.4',
    dateValue: new Date('2021-01-01T00:00:00.000Z'),
    stringValue: 'foo',
    objectValue: { foo: 'bar' },
    numberValue: 42,
    booleanValue: true,
    arrayValue: ['foo', 'bar'],
    'bad key!': 'x',
    type: 'ignored',
  });

  t.deepEqual(sentBody(fake.firstCall), [
    event({
      floatValue: 0.4,
      dateValue: '2021-01-01T00:00:00.000Z',
      stringValue: 'foo',
      objectValue: '{"foo":"bar"}',
      numberValue: 42,
      booleanValue: true,
      arrayValue: '["foo","bar"]',
      bad_key_: 'x',
    }),
  ]);
});

test.serial('Can find build-in crypto digest', async (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  Object.defineProperty(globalThis, 'crypto', {
    value: { subtle: t.context.subtleCrypto },
    configurable: true,
  });

  const td = new TelemetryDeck(options());

  await td.signal('test');
  t.is(t.context.subtleCrypto.digest.callCount, 1);

  if (original) {
    Object.defineProperty(globalThis, 'crypto', original);
  } else {
    delete globalThis.crypto;
  }
});

test.serial('Changing the salt also changes the hash', async (t) => {
  const { fake, subtleCrypto } = t.context;

  const td = new TelemetryDeck(options({ subtleCrypto }));

  await td.signal('test');
  t.deepEqual(sentBody(fake.firstCall), [event()]);

  td.salt = 'salz';

  const salzInHex = Buffer.from('salz').toString('hex');

  await td.signal('test');
  t.deepEqual(sentBody(fake.secondCall), [event({ clientUser: anonymousInHex + salzInHex })]);
});
