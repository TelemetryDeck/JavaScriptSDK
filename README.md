# Telemetry Deck JavaScript SDK

This package allows you to send signals to [TelemetryDeck](https://telemetrydeck.com) from your JavaScript code.

It has no dependencies and supports **modern evergreen browsers** and modern versions of Node.js with support for [cryptography](https://caniuse.com/cryptography).

Signals sent with this SDK do not send any default values, besides signal `type`, `appID`, `user` and `sessionID`.

If you want to use this package in your web application, see recommended parameters below.

## Usage

### 📦 Advanced usage for applications that use a bundler (like Webpack, Rollup, …)

After installing the package via NPM, use it like this:

```javascript
import TelemetryDeck from '@telemetrydeck/sdk';

const td = new TelemetryDeck({
  appID: '<YOUR_APP_ID>'
  user: '<YOUR_USER_IDENTIFIER>',
});

// Basic signal
td.signal('<SIGNAL_TYPE>');

// Adanced: Signal with custom payload
td.signal('<SIGNAL_TYPE>', {
  volume: '11',
});
```

Please replace `YOUR_APP_ID` with the app ID you received from TelemetryDeck. If you have any string that identifies your user, such as an email address, use it as `YOUR_USER_IDENTIFIER` – it will be cryptographically anonymized with a hash function.

If you want to pass optional parameters to the signal being sent, add them to the optional payload object.

## Usage with React Native

React Native does not support the `crypto` module, which is required for the SDK to work. We found [react-native-quick-crypto](https://github.com/margelo/react-native-quick-crypto) to be a suitable polyfill. Please note that this is not an officially supported solution.

## Queueing Signals

The `TelemetryDeck` class comes with a built-in queuing mechanism for storing signals until they are flushed in a single request. 

This uses an in-memory store. The store is not persisted between page reloads or app restarts. If you want to persist the store, you can pass a `store` object to the `TelemetryDeck` constructor. The store must implement the following interface:

```javascript
export class TimelineStore {
  async push() // signal bodys are async and need to be awaited before stored
  clear() // called after flush
  values() // returns an array of resolved signal bodys in the order they were pushed
}
```

The default implementation can be found in `src/utils/store.js` and uses a monotone counter to keep track of the order of signals. 

### 📱 You need an App ID

Every application and website registered to TelemetryDeck has a unique ID that we use to assign incoming signals to the correct app. To get started, create a new app in the TelemetryDeck UI and copy the ID from there.

### 👤 Optional: User Identifiers

TelemetryDeck can count users if you assign it a unique identifier for each user that doesn't change. This identifier can be any string that is unique to the user, such as their email address, or a randomly generated UUID.

Feel free to use personally identifiable information as the user identifier: We use a cryptographically secure double-hashing process on client and server to make sure the data that arrives at our servers is anonymized and can not be traced back to individual users via their identifiers. A user's identifier is hashed inside the library and then salted+hashed again on arrival at the server. This way the data is anonymized as defined by the GDPR and you don't have to ask for user consent for processing or storing this data.

### 🚛 Optional: Payload

You can optionally attach an object with values to the signal. This will allow you to filter and aggregate signals by these values in the dashboard.

Values will be stringified through `JSON.stringify()`, with few exceptions:

- Dates will be converted to ISO strings using `.toISOString()`
- Strings are passed as is (this prevents the JSON stringification of strings, which would add quotes around the string)
- `floatValue` is the only key in the payload that may hold a float value. Any value passed to this will be converted to a float using `Number.parseFloat()`.

#### Payload recommendations for Web Apps

In most web apps you probably want to see a few default values which you can read from the browser. We recommend sending the following values in your custom payload:

```javascript
td.signal('navigation', {
  referrer: globalThis.document?.referrer,
  locale: globalThis.navigator?.language,
  url: globalThis.location?.href,
  // ...
});
```

#### Test Mode

You can enable test mode by setting `testMode` to `true` on your `TelemetryDeck` instance.

```javascript
td.testMode = true;
td.signal('navigation', { /* ... */ }); // send with testMode enabled
td.testMode = false;
td.signal('navigation', { /* ... */ }); // send with testMode disabled
```

### 📚 Full Docs

Go to [telemetrydeck.com/docs](https://telemetrydeck.com/docs) to see all documentation articles
