# Telemetry Deck JavaScript SDK

This package allows you to send signals to [TelemetryDeck](https://telemetrydeck.com) from your JavaScript code.

It has no package dependencies and supports **modern evergreen browsers** which support [cryptography](https://caniuse.com/cryptography).

Signals sent with this version of the SDK automatically send the following payload items:

- `url`
- `useragent`
- `locale`
- `platform`

You can filter and show these values in the TelemetryDeck dashboard.

Test Mode is currently not supported.

## Usage

### 📄 Usage via Script tag

For websites and to try out the code quickly, you can use [UNPKG](https://unpkg.com), a free CDN which allows you to load files from any npm package.

Include the following snippet inside the `<head>` of your HTML page:

```html
<script src="https://unpkg.com/@telemtrydeck/sdk/dist/telemetrydeck.min.js" defer></script>
```

Then add a second script tag after it like this to send a signal once every time the page loads:

```html
<script>
  window.td = window.td || [];
  td.push(['app', YOUR_APP_ID], ['user', USER_IDENTIFIER], ['signal']);
</script>
```

Please replace `YOUR_APP_ID` with the app ID you received from TelemetryDeck, and `USER_IDENTIFIER` with a user identifier. If you have none, consider `anonymous`.

You can add as many signals as you need to track different interactions with your page. Once the page and script are fully loaded, signals will be sent immediatlty.

```js
// basic signal
td.push('signal');

// with custom data
td.push('signal', { route: '/' });
```

#### Alternative usage for more complex tracking needs

```html
<script>
  // Required: queue setup
  td = window.td || [];
  // Required: Set your application id
  td.push(['app', YOUR_APP_ID]);
  // Required: Set a user idenfitier. `anonymous` is a recommended default
  td.push(['user', USER_IDENTIFIER ?? 'anonymous']);

  // Custom payload sent with the signal
  td.push(['signal']);
  td.push([
    'signal',
    {
      route: 'some/page/path',
    },
  ]);
</script>
```

### 📦 Advanced usage for applications that use a bundler (like Webpack, Rollup, …)

After installing the package via NPM, use it like this:

```js
import { TelemetryDeck } from 'telemetry-deck';

const td = new TelemetryDeck({ app: YOUR_APP_ID, user: YOUR_USER_IDENTIFIER });

// Process any events that have been qeued up
// Queued signals do not contain a client side timestamp and will be timestamped
// on the server at the time of arrival. Consider adding a timestamp value to
// your payloads if you need to be able to correlate them.
const queuedEvents = [
  ['app', YOUR_APP_ID],
  ['user', YOUR_USER_IDENTIFIER],
  ['signal'],
  ['signal', { route: 'some/page/path' }],
];
td.ingest(qeuedEvents);

// Basic signal
td.signal();

// Update app or user identifier
td.app(YOUR_NEW_APP_ID);
td.user(YOUR_NEW_USER_IDENTIFIER);

// Signal with custom payload
td.signal({
  route: 'some/page/path',
});
```

Please replace `YOUR_APP_ID` with the app ID you received from TelemetryDeck. If you have any string that identifies your user, such as an email address, use it as `YOUR_USER_IDENTIFIER` – it will be cryptographically anonymized with a hash function.

If you want to pass optional parameters to the signal being sent, add them to the optional payload object.

## More Info

### 📱 You need an App ID

Every application and website registered to TelemetryDeck has its own unique ID that we use to assign incoming signals to the correct app. To get started, create a new app in the TelemetryDeck UI and copy its ID.

### 👤 Optional: User Identifiers

TelemetryDeck can count users if you assign it a unique identifier for each user that doesn't change. This identifier can be any string that is unique to the user, such as their email address, or a randomly generated UUID.

Feel free to use personally identifiable information as the user identifier: We use a cryptographically secure double-hasing process on client and server to make sure the data that arrives at our servers is anonymized and can not be traced back to individual users via their identifiers. A user's identifier is hashed inside the library, and then salted+hashed again on arrival at the server. This way the data is anonymized as defined by the GDPR and you don't have to ask for user consent for procesing or storing this data.

### 🚛 Optional: Payload

You can optionally attach an object with string values to the signal. This will allow you to filter and aggregate signal by these values in the dashboard.

### 📚 Full Docs

Go to [docs.telemetrydeck.com](https://docs.telemetrydeck.com) to see all documentation articles
