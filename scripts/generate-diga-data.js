/* eslint-disable unicorn/no-process-exit */
// Single-use generator for DiGA example data.
// Usage: node scripts/generate-diga-data.js <appID> <namespace> [heartbeatName] [userCount]

import TelemetryDeck from '../src/telemetrydeck.js';

const [appID, namespace, heartbeatName = 'heartbeat', userCount = '200'] = process.argv.slice(2);

if (!appID || !namespace) {
  console.error(
    'Usage: node scripts/generate-diga-data.js <appID> <namespace> [heartbeatName] [userCount]'
  );
  process.exit(1);
}

const MINUTE = 60_000;
const DAY = 86_400_000;
const DAYS_BACK = 200;
const SKIP_CHANCE = 0.1;
const FINISH_CHANCE = 0.66;
const BATCH_SIZE = 500;

const now = Date.now();
const runID = Math.random().toString(36).slice(2, 8);
const td = new TelemetryDeck({ appID, namespace, clientUser: 'unused' });

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const randomID = () => Math.random().toString(36).slice(2);
const pick = (values) => values[randomInt(0, values.length - 1)];

let total = 0;

async function flush() {
  const count = td.store.values().length;
  if (count === 0) return;

  const response = await td.flush();

  if (!response.ok) {
    console.error(`HTTP ${response.status} ${await response.text()}`);
    process.exit(1);
  }

  total += count;
}

// The SDK always uses the current time, so set the date after the event is queued.
async function queue(type, time, options, payload) {
  if (time > now) return;
  await td.queue(type, payload, options);
  td.store.values().at(-1).receivedAt = new Date(time).toISOString();
  if (td.store.values().length >= BATCH_SIZE) await flush();
}

for (let index = 0; index < Number(userCount); index++) {
  const clientUser = `diga-${runID}-${index}`;
  const start = now - Math.random() * DAYS_BACK * DAY;
  const treatmentDays = randomInt(40, 90);
  const before = total;
  const device = {
    'TelemetryDeck.Device.platform': pick(['iOS', 'Web', 'Android']),
    'TelemetryDeck.AppInfo.version': pick(['2.1', '2.2', '2.3']),
  };

  await queue(
    'TelemetryDeck.DIGA.Treatment.started',
    start,
    { clientUser, sessionID: randomID() },
    device
  );

  for (let day = 0; day <= treatmentDays; day++) {
    // One session per day: 10 to 45 minutes, one heartbeat per minute.
    const options = { clientUser, sessionID: randomID() };
    const sessionStart = start + day * DAY + Math.random() * 3_600_000;
    const minutes = randomInt(10, 45);

    for (let minute = 0; minute <= minutes; minute++) {
      await queue('TelemetryDeck.Session.heartbeat', sessionStart + minute * MINUTE, options, {
        ...device,
        'TelemetryDeck.Session.Heartbeat.name': heartbeatName,
        'TelemetryDeck.Session.Heartbeat.frequency': 'minute',
      });
    }

    if (Math.random() < SKIP_CHANCE) day += randomInt(1, 10);
  }

  if (Math.random() < FINISH_CHANCE) {
    await queue(
      'TelemetryDeck.DIGA.Treatment.finished',
      start + (treatmentDays + 0.1) * DAY,
      { clientUser, sessionID: randomID() },
      device
    );
  }

  await flush();
  console.log(`User ${index + 1}/${userCount}: ${total - before} events`);
}

console.log(`Sent ${total} events for ${userCount} users (run ${runID}).`);
