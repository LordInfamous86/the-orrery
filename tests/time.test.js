import test from 'node:test';
import assert from 'node:assert/strict';
import { localTimeToUtc } from '../src/time.js';

test('Central Time conversion applies daylight and standard offsets', () => {
  assert.equal(localTimeToUtc('2026-07-10','12:00','America/Chicago').toISOString(), '2026-07-10T17:00:00.000Z');
  assert.equal(localTimeToUtc('2026-01-10','12:00','America/Chicago').toISOString(), '2026-01-10T18:00:00.000Z');
});

test('IANA time zones with quarter-hour offsets convert correctly', () => {
  assert.equal(localTimeToUtc('2026-01-10','12:00','Asia/Kathmandu').toISOString(), '2026-01-10T06:15:00.000Z');
});

test('rejects nonexistent wall times during the spring clock change', () => {
  assert.throws(() => localTimeToUtc('2026-03-08','02:30','America/Chicago'), error => error.code === 'NONEXISTENT_LOCAL_TIME');
});

test('requires a choice for duplicated wall times and resolves both occurrences', () => {
  assert.throws(() => localTimeToUtc('2026-11-01','01:30','America/Chicago'), error => error.code === 'AMBIGUOUS_LOCAL_TIME');
  assert.equal(localTimeToUtc('2026-11-01','01:30','America/Chicago','earlier').toISOString(), '2026-11-01T06:30:00.000Z');
  assert.equal(localTimeToUtc('2026-11-01','01:30','America/Chicago','later').toISOString(), '2026-11-01T07:30:00.000Z');
});

test('rejects invalid civil dates', () => {
  assert.throws(() => localTimeToUtc('2026-02-30','12:00','UTC'), /not valid/);
});
