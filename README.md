# Telemetry Deck JavaScript SDK

This package allows you to send events to [TelemetryDeck](https://telemetrydeck.com) from JavaScript code.

TelemetryDeck allows you to capture and analyize users moving through your app and get help deciding how to grow, all without compromising privacy!

> [!NOTE]  
> If you want to use TelemetryDeck for your blog or static website, we recommend the [TelemetryDeck Web SDK](https://github.com/TelemetryDeck/WebSDK) instead of this JavaScript SDK.

# Set Up

The TelemetryDeck SDK has no dependencies and supports **modern evergreen browsers** and **modern versions of Node.js** with support for [cryptography](https://caniuse.com/cryptography).

## Set up in Browser Based Applications that use a bundler (React, Vue, Angular, Svelte, Ember, …)

### 1. Installing the package

Please install the package using npm or the package manager of your choice

### 2. Initializing TelemetryDeck

Initialize the TelemetryDeck SDK with your app ID, your namespace and your user's user identifer.

```javascript
import TelemetryDeck from '@telemetrydeck/sdk';

const td = new TelemetryDeck({
  appID: '<YOUR_APP_ID>',
  namespace: '<YOUR_NAMESPACE>',
  clientUser: '<YOUR_USER_IDENTIFIER>',
});
```

Please replace `<YOUR_APP_ID>` with the app ID in TelemetryDeck ([Dashboard](https://dashboard.telemetrydeck.com) -> App -> Set Up App). Replace `<YOUR_NAMESPACE>` with the namespace of your organization, which the Dashboard also shows.

You also need to identify your logged in user. Instead of `<YOUR_USER_IDENTIFIER>`, pass in any string that uniquely identifies your user, such as an email address. It will be cryptographically anonymized with a hash function.

If can't specify a user identifer at initialization, you can set it later by setting `td.clientUser`.

Please note that `td.event` is an async function that returns a promise.

## Set up in Node.js Applications

### 1. Installing the package

Please install the package using npm or the package manager of your choice

### 2. Initializing TelemetryDeck

Initialize the TelemetryDeck SDK with your app ID, your namespace and your user's user identifer. Since `globalThis.crypto.subtle` does not exist in Node.js, you need to pass in an alternative implementation provided by Node.js.

```javascript
import TelemetryDeck from '@telemetrydeck/sdk';
import crypto from 'crypto';

const td = new TelemetryDeck({
  appID: '<YOUR_APP_ID>',
  namespace: '<YOUR_NAMESPACE>',
  clientUser: '<YOUR_USER_IDENTIFIER>',
  subtleCrypto: crypto.webcrypto.subtle,
});
```

Please replace `<YOUR_APP_ID>` with the app ID in TelemetryDeck ([Dashboard](https://dashboard.telemetrydeck.com) -> App -> Set Up App). Replace `<YOUR_NAMESPACE>` with the namespace of your organization, which the Dashboard also shows.

You also need to identify your logged in user. Instead of `<YOUR_USER_IDENTIFIER>`, pass in any string that uniquely identifies your user, such as an email address. It will be cryptographically anonymized with a hash function.

If can't specify a user identifer at initialization, you can set it later by setting `td.clientUser`.

Please note that `td.event` is an async function that returns a promise.

> [!NOTE]  
> If you are using React Native, React Native does not support the `crypto` module, which is required for the SDK to work. We found [react-native-quick-crypto](https://github.com/margelo/react-native-quick-crypto) to be a suitable polyfill. Please note that this is not an officially supported solution.

## Advanced Initalization Options

See the [source code](./src/telemetrydeck.js#L6-L18) for a full list of availble options acepted by the `TelemetryDeck` constructor.

# Sending Events

Send a basic event by calling `td.event()` with an event type:

```javascript
td.event('<EVENT_TYPE>');
```

Send an event with a custom payload by passing an object as the second argument. Strings, numbers and booleans keep their type. Dates become ISO 8601 strings, and objects and arrays become JSON strings. `floatValue` is always sent as a number. Payload keys can contain only letters, digits, dots, underscores and hyphens. The SDK replaces each other character with `_`.

```javascript
td.event('Volume.Set', {
  band: 'Spinal Tap',
  floatValue: 11.0,
});
```

# Heartbeats

A heartbeat is a small event that the SDK sends again and again. It shows that the user is still there.

Start a heartbeat with a frequency. The frequency must be `'minute'`, `'hour'` or `'day'`.

```javascript
td.startHeartbeat('minute');
```

The SDK sends the first heartbeat event immediately. Then it sends one event each minute, hour or day.

You can give the heartbeat a name. If you do not give a name, the name is `heartbeat`.

```javascript
td.startHeartbeat('hour', 'Knee Pain App');
```

Each name has its own heartbeat. If you start heartbeats with different names, the SDK sends one event for each name. If you start a heartbeat with a name that is already in use, the new heartbeat replaces the old one.

Stop a heartbeat with its name. If you do not give a name, the SDK stops the heartbeat with the name `heartbeat`.

```javascript
td.stopHeartbeat();
td.stopHeartbeat('Knee Pain App');
```

A heartbeat event has the type `TelemetryDeck.Session.heartbeat` and these two parameters, together with the fields that each event has:

```json
{
  "type": "TelemetryDeck.Session.heartbeat",
  "TelemetryDeck.Session.Heartbeat.name": "Knee Pain App",
  "TelemetryDeck.Session.Heartbeat.frequency": "hour"
}
```

Obey these rules:

- Set `clientUser` before you start a heartbeat. The SDK cannot send a heartbeat event without it.
- The SDK does not send a heartbeat event again if the request fails. It does not show an error.
- A heartbeat stops when the page closes or the app stops. Start it again after each start of the app.
- In Node.js, a heartbeat keeps the process in operation. Stop all heartbeats before the process must end.

# Advanced: Queueing Events

The `TelemetryDeck` class comes with a built-in queuing mechanism for storing events until they are flushed in a single request. Each event has a `receivedAt` value, which is the time when you called `event()` or `queue()`.

This uses an in-memory store by default. The store is not persisted between page reloads or app restarts. If you want to persist the store, you can pass a `store` object to the `TelemetryDeck` constructor. The store must implement the following interface:

```javascript
export class Store {
  async push() // event bodys are async and need to be awaited before stored
  clear() // called after flush
  values() // returns an array of resolved event bodys in the order they were pushed
}
```

The default implementation can be found in `src/utils/store.js`.

---

[TelemetryDeck](https://telemetrydeck.com?source=github) helps you build better products with live usage data. Try it out for free.
