import * as Astronomy from 'astronomy-engine';
import { calculateSkyWithEngine } from './sky-calculation.js';
export { calculateAspects, zodiacPlacement, ZODIAC } from './astro-logic.js';

export const BODY_DEFS = [
  { name:'Sun', glyph:'☉' }, { name:'Moon', glyph:'☽' }, { name:'Mercury', glyph:'☿' },
  { name:'Venus', glyph:'♀' }, { name:'Mars', glyph:'♂' }, { name:'Jupiter', glyph:'♃' }, { name:'Saturn', glyph:'♄' },
];

export function calculateSky(when = new Date()) {
  return calculateSkyWithEngine(when, Astronomy);
}
