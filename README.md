# Telemetry Deck JavaScript SDK

This package allows you to send signals to [TelemetryDeck](https://telemetrydeck.com) from your JavaScript code. 

It has no package dependencies and supports modern evergreen browsers which support [cryptography](https://caniuse.com/cryptography).

Signals sent with this version of the SDK automatically send the following payload items:

- url
- useragent
- locale
- platform

You can filter and show these values in the TelemetryDeck dashboard.

Test Mode is currently not supported.

## Usage

### 📄 Usage via Script Tag 

For regular websites and to try out the code quickly, you can use [UNPKG](https://unpkg.com), a free CDN which allows you to load files from any npm package.

Include the following snippet in your page header:

```html
<script src="https://unpkg.com/@telemtrydeck/sdk/dist/telemetrydeck.min.js">
```

then include a script tag at the bottom of your page like this to send a signal once every time the page loads:

```html
<script>
signal(
  // required options to identify your app and the user
  {
    appID: 'YOUR_APP_ID',
    userIdentifier: 'ANONYMOUS',
  },
  // optional: custom payload stored with the signal
  {
    route: 'some/page/path',
  }
);
</script>
```

Please replace `YOUR_APP_ID` with the app ID you received from TelemetryDeck, and set a user identifier if possible.

### 📦 Usage for applications that use a bundler (like Webpack, Rollup, …)

After installing the package via NPM, use it like this:

```js
import { signal } from 'telemetry-deck';

//
signal(
  // required options to identify your app and the user
  {
    appID: 'YOUR_APP_ID',
    userIdentifier: 'ANONYMOUS',
  },
  // custom payload stored with the signal
  {
    route: 'some/page/path',
  }
);
```

Please replace `YOUR_APP_ID` with the app ID you received from TelemetryDeck. If you have any string that identifies your user, such as an email address, pass it into `userIdentifier` – it will be cryptographically anonymized with a hash function.

If you want to pass optional parameters to the signal being sent, add them to the optional paylaod object. 

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