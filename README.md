# Telemetry Deck JavaScript SDK

Support modern evergreen browsers which support [cryptography](https://caniuse.com/cryptography).

## Usage

### For applications that use a bundler (like Webpack, Rollup, …)

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

### For situations where you just want to add a script tag and generate signals

[UNPKG](https://unpkg.com) is a free CDN which allows you to load files from any npm package.

```html
<script src="https://unpkg.com/@telemtrydeck/sdk/dist/telemetrydeck.min.js">
```
