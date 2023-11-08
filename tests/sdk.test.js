import test from 'ava';
import sinon from 'sinon';
import FakeTimers from '@sinonjs/fake-timers';

import TelemetryDeck from '../src/telemetrydeck.js';

test.beforeEach((t) => {
  const fake = sinon.fake(() => new Response('OK LOL'));

  t.context.fake = fake;

  sinon.replace(globalThis, 'fetch', fake);

  const random = sinon.fake.returns(0.4); // chosen by fair dice roll. guaranteed to be random.
  sinon.replace(Math, 'random', random);

  t.context.cryptoDigest = sinon.fake.returns(
    Promise.resolve(Buffer.from('THIS IS NOT A REAL HASH'))
  );
});

test.afterEach.always(() => {
  sinon.restore();
});

test.serial("Can't instantiate without appID", (t) => {
  t.throws(
    () => {
      new TelemetryDeck({
        appID: undefined,
      });
    },
    { message: 'appID is required' }
  );
});

test.serial('Can pass optional user, target and testMode flag', (t) => {
  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'bar',
    target: 'https://example.com',
    testMode: false,
  });

  t.is(td.appID, 'foo');
  t.is(td.clientUser, 'bar');
  t.is(td.target, 'https://example.com');
  t.is(td.testMode, false);
});

test.serial('Can send a signal', async (t) => {
  const { fake, cryptoDigest } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'anonymous',
    cryptoDigest,
  });

  const response = await td.signal('test');

  t.is(await response.text(), 'OK LOL');
  t.is(fake.callCount, 1);
  t.is(fake.firstCall.args[0], 'https://nom.telemetrydeck.com/v2/');
  t.is(fake.firstCall.args[1].method, 'POST');
  t.is(fake.firstCall.args[1].headers['Content-Type'], 'application/json');
  t.is(
    fake.firstCall.args[1].body,
    JSON.stringify([
      {
        clientUser: '54484953204953204e4f542041205245414c2048415348',
        sessionID: '255s0',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
      },
    ])
  );
});

test.serial("Can't send a signal without a type", async (t) => {
  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'anonymous',
  });

  await t.throwsAsync(
    async () => {
      await td.signal();
    },
    { message: 'TelemetryDeck: "type" is not set' }
  );
});

test.serial('Can send additional payload attributes', async (t) => {
  const { fake, cryptoDigest } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'anonymous',
    cryptoDigest,
  });

  const response = await td.signal('test', {
    foo: 'bar',
    blah: '0.1',
  });

  const text = await response.text();

  t.is(text, 'OK LOL');
  t.is(fake.callCount, 1);
  t.is(fake.firstCall.args[0], 'https://nom.telemetrydeck.com/v2/');
  t.is(fake.firstCall.args[1].method, 'POST');
  t.is(fake.firstCall.args[1].headers['Content-Type'], 'application/json');
  t.is(
    fake.firstCall.args[1].body,
    JSON.stringify([
      {
        clientUser: '54484953204953204e4f542041205245414c2048415348',
        sessionID: '255s0',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        payload: {
          foo: 'bar',
          blah: '0.1',
        },
      },
    ])
  );
});

test.serial('Can send a signal with salty user', async (t) => {
  const { fake, cryptoDigest } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'anonymous',
    salt: 'salty',
    cryptoDigest,
  });

  const response = await td.signal('test');

  t.is(await response.text(), 'OK LOL');
  t.is(fake.callCount, 1);
  t.is(fake.firstCall.args[0], 'https://nom.telemetrydeck.com/v2/');
  t.is(fake.firstCall.args[1].method, 'POST');
  t.is(fake.firstCall.args[1].headers['Content-Type'], 'application/json');
  t.is(
    fake.firstCall.args[1].body,
    JSON.stringify([
      {
        clientUser: '54484953204953204e4f542041205245414c2048415348',
        sessionID: '255s0',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
      },
    ])
  );
});

test.serial('Can send a signal with sessionID', async (t) => {
  const { fake, cryptoDigest } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'anonymous',
    sessionID: '1234567890',
    cryptoDigest,
  });

  const response = await td.signal('test');

  t.is(await response.text(), 'OK LOL');
  t.is(fake.callCount, 1);
  t.is(fake.firstCall.args[0], 'https://nom.telemetrydeck.com/v2/');
  t.is(fake.firstCall.args[1].method, 'POST');
  t.is(fake.firstCall.args[1].headers['Content-Type'], 'application/json');
  t.is(
    fake.firstCall.args[1].body,
    JSON.stringify([
      {
        clientUser: '54484953204953204e4f542041205245414c2048415348',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
      },
    ])
  );
});

test.serial('Can queue signals and send them later', async (t) => {
  const clock = FakeTimers.install({
    advanceTimeDelta: 10,
  });
  const now = new Date();
  const { fake, cryptoDigest } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'anonymous',
    sessionID: '1234567890',
    cryptoDigest,
  });

  await td.queue('foo');
  await td.queue('bar');

  t.deepEqual(td.store.values(), [
    {
      appID: 'foo',
      clientUser: '54484953204953204e4f542041205245414c2048415348',
      receivedAt: now.toISOString(),
      sessionID: '1234567890',
      telemetryClientVersion: 'JavaScriptSDK __PACKAGE_VERSION__',
      type: 'foo',
    },
    {
      appID: 'foo',
      clientUser: '54484953204953204e4f542041205245414c2048415348',
      receivedAt: now.toISOString(),
      sessionID: '1234567890',
      telemetryClientVersion: 'JavaScriptSDK __PACKAGE_VERSION__',
      type: 'bar',
    },
  ]);

  const response = await td.signal('test');
  await td.flush();

  t.is(await response.text(), 'OK LOL');
  t.is(fake.callCount, 2);
  t.is(fake.firstCall.args[0], 'https://nom.telemetrydeck.com/v2/');
  t.is(fake.firstCall.args[1].method, 'POST');
  t.is(fake.firstCall.args[1].headers['Content-Type'], 'application/json');
  t.is(
    fake.firstCall.args[1].body,
    JSON.stringify([
      {
        clientUser: '54484953204953204e4f542041205245414c2048415348',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
      },
    ])
  );
  t.is(
    fake.secondCall.args[1].body,
    JSON.stringify([
      {
        clientUser: '54484953204953204e4f542041205245414c2048415348',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'foo',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        receivedAt: now.toISOString(),
      },
      {
        clientUser: '54484953204953204e4f542041205245414c2048415348',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'bar',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        receivedAt: now.toISOString(),
      },
    ])
  );

  clock.uninstall();
});

test.serial('Can build signal payloads', async (t) => {
  const { fake, cryptoDigest } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'anonymous',
    sessionID: '1234567890',
    cryptoDigest,
  });

  const response = await td.signal('test', {
    floatValue: '0.4',
    dateValue: new Date('2021-01-01T00:00:00.000Z'),
    stringValue: 'foo',
    objectValue: { foo: 'bar' },
    numberValue: 42,
    arrayValue: ['foo', 'bar'],
  });

  t.is(await response.text(), 'OK LOL');
  t.is(fake.callCount, 1);
  t.is(fake.firstCall.args[0], 'https://nom.telemetrydeck.com/v2/');
  t.is(fake.firstCall.args[1].method, 'POST');
  t.is(fake.firstCall.args[1].headers['Content-Type'], 'application/json');
  t.is(
    fake.firstCall.args[1].body,
    JSON.stringify([
      {
        clientUser: '54484953204953204e4f542041205245414c2048415348',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        payload: {
          floatValue: 0.4,
          dateValue: '2021-01-01T00:00:00.000Z',
          stringValue: 'foo',
          objectValue: '{"foo":"bar"}',
          numberValue: '42',
          arrayValue: '["foo","bar"]',
        },
      },
    ])
  );
});

test.serial('Can find build-in crypto digest', async (t) => {
  globalThis.crypto = {
    subtle: {
      digest: t.context.cryptoDigest,
    },
  };

  const td = new TelemetryDeck({
    appID: 'foo',
    clientUser: 'anonymous',
  });

  await td.signal('test');
  t.is(t.context.cryptoDigest.callCount, 1);

  delete globalThis.crypto;
});
