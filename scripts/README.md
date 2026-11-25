# DiGA example data generator

`generate-diga-data.js` sends simulated DiGA usage data to the TelemetryDeck ingest API. Use it to get development data for a test app.

This script is for single use. Do not merge this branch into `main`.

## Usage

```bash
node scripts/generate-diga-data.js <appID> <namespace> [heartbeatName] [userCount]
```

| Parameter       | Default     | Description                                        |
| --------------- | ----------- | -------------------------------------------------- |
| `appID`         | —           | The app that receives the events                   |
| `namespace`     | —           | The namespace of your organization                 |
| `heartbeatName` | `heartbeat` | Value of `TelemetryDeck.Session.Heartbeat.name`    |
| `userCount`     | `200`       | Number of simulated users (about 1000 events each) |

Do a first run with a `userCount` of 3 and make sure that the events show in the dashboard.

Each run creates new users. A second run adds data to the data of the first run.

## Simulated data

Each user:

1. Starts a treatment at a random time in the last 200 days and sends `TelemetryDeck.DIGA.Treatment.started`.
2. Opens the app one time each day for a session of 10 to 45 minutes. During a session, the user sends one `TelemetryDeck.Session.heartbeat` event each minute.
3. After each session, has a 10% chance to skip the next 1 to 10 days.
4. Stops after 40 to 90 days. 66% of the users send `TelemetryDeck.DIGA.Treatment.finished`. The other 34% stop without this event.

Events with a date in the future are not sent. Thus, users who started recently are still in treatment.

Each event also contains these values, which a user selects one time:

- `TelemetryDeck.Device.platform`: `iOS`, `Web` or `Android`
- `TelemetryDeck.AppInfo.version`: `2.1`, `2.2` or `2.3`

## Limits

- The SDK always uses the current time for an event. The script changes `receivedAt` of each queued event before it sends the batch.
- `TelemetryDeck.SDK.version` contains the text `__PACKAGE_VERSION__`, because the script imports the SDK source and not the build.
- Events are sent with `isTestMode` set to `false`.
