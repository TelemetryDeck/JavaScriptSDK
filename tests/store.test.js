import test from 'ava';
import { Store } from '../src/utils/store.js';

test.serial('Can push entries and read values', async (t) => {
  const store = new Store();

  await store.push(Promise.resolve({ type: 'foo' }));
  await store.push(Promise.resolve({ type: 'bar' }));
  await store.push(Promise.resolve({ type: 'baz' }));

  t.deepEqual(store.values(), [{ type: 'foo' }, { type: 'bar' }, { type: 'baz' }]);
});

test.serial('Can clear entries', async (t) => {
  const store = new Store();

  await store.push(Promise.resolve({ type: 'foo' }));

  t.deepEqual(store.values(), [{ type: 'foo' }]);

  store.clear();

  t.deepEqual(store.values(), []);
});
