import { zodiacPlacement } from './astro-logic.js';

export function calculateSkyWithEngine(when, Astronomy) {
  const date = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(date.getTime())) throw new TypeError('Provide a valid date and time.');
  const bodies = [
    { name:'Sun', body:Astronomy.Body.Sun, glyph:'☉' },
    { name:'Moon', body:Astronomy.Body.Moon, glyph:'☽' },
    { name:'Mercury', body:Astronomy.Body.Mercury, glyph:'☿' },
    { name:'Venus', body:Astronomy.Body.Venus, glyph:'♀' },
    { name:'Mars', body:Astronomy.Body.Mars, glyph:'♂' },
    { name:'Jupiter', body:Astronomy.Body.Jupiter, glyph:'♃' },
    { name:'Saturn', body:Astronomy.Body.Saturn, glyph:'♄' },
  ];
  const longitude = body => {
    if (body === Astronomy.Body.Sun) return Astronomy.SunPosition(date).elon;
    if (body === Astronomy.Body.Moon) return Astronomy.EclipticGeoMoon(date).lon;
    return Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon;
  };
  return bodies.map(({ name, body, glyph }) => ({ name, glyph, ...zodiacPlacement(longitude(body)) }));
}
