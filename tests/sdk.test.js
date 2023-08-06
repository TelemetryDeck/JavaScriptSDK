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
    user: 'bar',
    target: 'https://example.com',
    testMode: false,
  });

  t.is(td.appID, 'foo');
  t.is(td.user, 'bar');
  t.is(td.target, 'https://example.com');
  t.is(td.testMode, false);
});

test.serial('Can send a signal', async (t) => {
  const { fake } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    user: 'anonymous',
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
        clientUser: '2f183a4e64493af3f377f745eda502363cd3e7ef6e4d266d444758de0a85fcc8',
        sessionID: '255s0',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        payload: {},
      },
    ])
  );
});

test.serial("Can't send a signal without a type", async (t) => {
  const td = new TelemetryDeck({
    appID: 'foo',
    user: 'anonymous',
  });

  await t.throwsAsync(
    async () => {
      await td.signal();
    },
    { message: 'TelemetryDeck: "type" is not set' }
  );
});

test.serial('Can send additional payload attributes', async (t) => {
  const { fake } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    user: 'anonymous',
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
        clientUser: '2f183a4e64493af3f377f745eda502363cd3e7ef6e4d266d444758de0a85fcc8',
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
  const { fake } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    user: 'anonymous',
    salt: 'salty',
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
        clientUser: '85ffa7bff7a597cf138a5195efaeb5ddc4df87392eaaf32b670e3173305351b5',
        sessionID: '255s0',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        payload: {},
      },
    ])
  );
});

test.serial('Can send a signal with sessionID', async (t) => {
  const { fake } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    user: 'anonymous',
    sessionID: '1234567890',
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
        clientUser: '2f183a4e64493af3f377f745eda502363cd3e7ef6e4d266d444758de0a85fcc8',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        payload: {},
      },
    ])
  );
});

test.serial('Can queue signals and send them later', async (t) => {
  const clock = FakeTimers.install({
    advanceTimeDelta: 10,
  });
  const now = new Date();
  const { fake } = t.context;

  const td = new TelemetryDeck({
    appID: 'foo',
    user: 'anonymous',
    sessionID: '1234567890',
  });

  await td.queue('foo');
  await td.queue('bar');

  t.deepEqual(td.store.values(), [
    {
      appID: 'foo',
      clientUser: '2f183a4e64493af3f377f745eda502363cd3e7ef6e4d266d444758de0a85fcc8',
      payload: {},
      receivedAt: now.toISOString(),
      sessionID: '1234567890',
      telemetryClientVersion: 'JavaScriptSDK __PACKAGE_VERSION__',
      type: 'foo',
    },
    {
      appID: 'foo',
      clientUser: '2f183a4e64493af3f377f745eda502363cd3e7ef6e4d266d444758de0a85fcc8',
      payload: {},
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
        clientUser: '2f183a4e64493af3f377f745eda502363cd3e7ef6e4d266d444758de0a85fcc8',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'test',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        payload: {},
      },
    ])
  );
  t.is(
    fake.secondCall.args[1].body,
    JSON.stringify([
      {
        clientUser: '2f183a4e64493af3f377f745eda502363cd3e7ef6e4d266d444758de0a85fcc8',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'foo',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        receivedAt: now.toISOString(),
        payload: {},
      },
      {
        clientUser: '2f183a4e64493af3f377f745eda502363cd3e7ef6e4d266d444758de0a85fcc8',
        sessionID: '1234567890',
        appID: 'foo',
        type: 'bar',
        telemetryClientVersion: `JavaScriptSDK __PACKAGE_VERSION__`,
        receivedAt: now.toISOString(),
        payload: {},
      },
    ])
  );

  clock.uninstall();
});
