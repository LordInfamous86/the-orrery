import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { calculateAspects, zodiacPlacement } from '../src/astro-logic.js';
import { calculateSkyWithEngine } from '../src/sky-calculation.js';
const require = createRequire(import.meta.url);
const Astronomy = require('astronomy-engine');

test('zodiac placement normalizes longitudes and handles sign boundaries', () => {
  assert.deepEqual(zodiacPlacement(0), { longitude:0, sign:'Aries', degree:0, minute:0, label:'00° 00′' });
  assert.equal(zodiacPlacement(30).sign, 'Taurus');
  assert.equal(zodiacPlacement(360).sign, 'Aries');
  assert.equal(zodiacPlacement(-1).sign, 'Pisces');
  assert.equal(zodiacPlacement(-1).degree, 29);
});

test('zodiac placement rejects non-finite longitudes', () => {
  assert.throws(() => zodiacPlacement(Number.NaN), /finite number/);
  assert.throws(() => zodiacPlacement(Infinity), /finite number/);
});

test('aspect calculation handles wraparound and sorts relationships by exactness', () => {
  const placements = [
    { name:'Sun', longitude:359 }, { name:'Moon', longitude:1 },
    { name:'Mercury', longitude:91 },
  ];
  const aspects = calculateAspects(placements);
  const conjunction = aspects.find(item => item.name === 'Conjunction');
  assert.equal(conjunction.separation, 2);
  assert.equal(conjunction.orbActual, 2);
  assert.equal(aspects[0].name, 'Square');
});

test('aspect calculation returns no relationship outside the declared orbs', () => {
  assert.deepEqual(calculateAspects([{longitude:0},{longitude:35}]), []);
});

test('astronomy calculation returns repeatable, finite placements for all seven bodies', () => {
  const when = new Date('2026-10-16T19:42:00.000Z');
  const first = calculateSkyWithEngine(when, Astronomy);
  const second = calculateSkyWithEngine(when, Astronomy);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map(body => body.name), ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']);
  for (const body of first) {
    assert.ok(Number.isFinite(body.longitude));
    assert.ok(body.longitude >= 0 && body.longitude < 360);
    assert.ok(body.degree >= 0 && body.degree < 30);
    assert.ok(body.minute >= 0 && body.minute < 60);
  }
});

test('astronomy calculation rejects invalid dates', () => {
  assert.throws(() => calculateSkyWithEngine('not a date', Astronomy), /valid date and time/);
});

test('J2000 Sun longitude stays close to its known reference value', () => {
  const sun = calculateSkyWithEngine(new Date('2000-01-01T12:00:00.000Z'), Astronomy)[0];
  assert.ok(Math.abs(sun.longitude - 280.37) < 0.1);
  assert.equal(sun.sign, 'Capricorn');
});
