# Telemetry Deck JavaScript SDK

This package allows you to send signals to [TelemetryDeck](https://telemetrydeck.com) from JavaScript code.

TelemetryDeck allows you to capture and analyize users moving through your app and get help deciding how to grow, all without compromising privacy!

> [!NOTE]  
> If you want to use TelemetryDeck for your blog or static website, we recommend the [TelemetryDeck Web SDK](https://github.com/TelemetryDeck/WebSDK) instead of this JavaScript SDK.

# Set Up

The TelemetryDeck SDK has no dependencies and supports **modern evergreen browsers** and **modern versions of Node.js** with support for [cryptography](https://caniuse.com/cryptography).

## Set up in Browser Based Applications that use a bundler (React, Vue, Angular, Svelte, Ember, …)

### 1. Installing the package

Please install the package using npm or the package manager of your choice

### 2. Initializing TelemetryDeck

Initialize the TelemetryDeck SDK with your app ID and your user's user identifer.

```javascript
import TelemetryDeck from '@telemetrydeck/sdk';

const td = new TelemetryDeck({
  appID: '<YOUR_APP_ID>'
  user: '<YOUR_USER_IDENTIFIER>',
});
```

Please replace `<YOUR_APP_ID>` with the app ID in TelemetryDeck ([Dashboard](https://dashboard.telemetrydeck.com) -> App -> Set Up App).

You also need to identify your logged in user. Instead of `<YOUR_USER_IDENTIFIER>`, pass in any string that uniquely identifies your user, such as an email address. It will be cryptographically anonymized with a hash function.

If can't specify a user identifer at initialization, you can set it later by setting `td.clientUser`.

Please note that `td.signal` is an async function that returns a promise.

## Set up in Node.js Applications

### 1. Installing the package

Please install the package using npm or the package manager of your choice

### 2. Initializing TelemetryDeck

Initialize the TelemetryDeck SDK with your app ID and your user's user identifer. Since `globalThis.crypto.subtle` does not exist in Node.js, you need to pass in an alternative implementation provided by Node.js.

```javascript
import TelemetryDeck from '@telemetrydeck/sdk';
import crypto from 'crypto';

const td = new TelemetryDeck({
  appID: '<YOUR_APP_ID>'
  user: '<YOUR_USER_IDENTIFIER>',
  subtleCrypto: crypto.webcrypto.subtle,
});
```

Please replace `<YOUR_APP_ID>` with the app ID in TelemetryDeck ([Dashboard](https://dashboard.telemetrydeck.com) -> App -> Set Up App).

You also need to identify your logged in user. Instead of `<YOUR_USER_IDENTIFIER>`, pass in any string that uniquely identifies your user, such as an email address. It will be cryptographically anonymized with a hash function.

If can't specify a user identifer at initialization, you can set it later by setting `td.clientUser`.

Please note that `td.signal` is an async function that returns a promise.

> [!NOTE]  
> If you are using React Native, React Native does not support the `crypto` module, which is required for the SDK to work. We found [react-native-quick-crypto](https://github.com/margelo/react-native-quick-crypto) to be a suitable polyfill. Please note that this is not an officially supported solution.

## Advanced Initalization Options

See the [source code](./src/telemetrydeck.js#L6-L17) for a full list of availble options acepted by the `TelemetryDeck` constructor.

# Sending Signals

Send a basic signal by calling `td.signal()` with a signal type:

```javascript
td.signal('<SIGNAL_TYPE>');
```

Send a signal with a custom payload by passing an object as the second argument. The payload's values will be [converted to Strings](./src/tests/store.test.js.js#L278-L310), except for `floatValue`, which can be a Float.

```javascript
td.signal('Volume.Set', {
  band: 'Spinal Tap',
  floatValue: 11.0,
});
```

# Advanced: Queueing Signals

The `TelemetryDeck` class comes with a built-in queuing mechanism for storing signals until they are flushed in a single request. Queued signals are sent with `receivedAt` prefilled with the time they were queued.

This uses an in-memory store by default. The store is not persisted between page reloads or app restarts. If you want to persist the store, you can pass a `store` object to the `TelemetryDeck` constructor. The store must implement the following interface:

```javascript
export class Store {
  async push() // signal bodys are async and need to be awaited before stored
  clear() // called after flush
  values() // returns an array of resolved signal bodys in the order they were pushed
}
```

The default implementation can be found in `src/utils/store.js`.

---

[TelemetryDeck](https://telemetrydeck.com?source=github) helps you build better products with live usage data. Try it out for free.
