import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLatestPainter } from '../src/lib/latest-painter.ts';
const settle = () => new Promise(resolve => setImmediate(resolve));
function frames() {
  let id = 0;
  const queue = new Map();
  globalThis.requestAnimationFrame = callback => { queue.set(++id, callback); return id; };
  globalThis.cancelAnimationFrame = id => queue.delete(id);
  return { queue, step() { const pending = [...queue.values()]; queue.clear(); pending.forEach(callback => callback()); } };
}
test('rapid color edits coalesce and retain the final color during an async frame', async () => {
  const clock = frames(), seen = [];
  let color = 'original', release, concurrent = 0, maximum = 0;
  const painter = createLatestPainter(async () => {
    maximum = Math.max(maximum, ++concurrent);
    seen.push(color);
    await new Promise(resolve => { release = resolve; });
    concurrent--;
  });
  for (let i = 0; i < 100; i++) { color = String(i); painter.request(); }
  assert.equal(clock.queue.size, 1);
  clock.step(); await settle();
  assert.deepEqual(seen, ['99']);
  for (let i = 100; i < 200; i++) { color = String(i); painter.request(); }
  assert.equal(clock.queue.size, 0);
  release(); await settle();
  assert.equal(clock.queue.size, 1);
  clock.step(); await settle();
  assert.deepEqual(seen, ['99', '199']);
  release(); await settle();
  assert.equal(maximum, 1);
  assert.equal(clock.queue.size, 0);
  painter.dispose();
});
test('cleanup cancels queued work and prevents in-flight work from scheduling again', async () => {
  const clock = frames();
  let release, calls = 0;
  const painter = createLatestPainter(async () => { calls++; await new Promise(resolve => { release = resolve; }); });
  painter.request(); clock.step(); await settle();
  painter.request(); painter.dispose(); release(); await settle();
  painter.request();
  assert.equal(clock.queue.size, 0);
  assert.equal(calls, 1);
});
test('a failed frame does not block subsequent edits', async () => {
  const clock = frames(), errors = [];
  let calls = 0;
  const painter = createLatestPainter(async () => { if (++calls === 1) throw new Error('failed'); }, error => errors.push(error.message));
  painter.request(); clock.step(); await settle();
  painter.request(); clock.step(); await settle();
  assert.deepEqual(errors, ['failed']); assert.equal(calls, 2); painter.dispose();
});
