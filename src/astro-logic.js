export const ZODIAC = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

export function zodiacPlacement(longitude) {
  if (!Number.isFinite(longitude)) throw new TypeError('Longitude must be a finite number.');
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  const withinSign = normalized - index * 30;
  const degree = Math.floor(withinSign);
  const minute = Math.floor((withinSign - degree) * 60);
  return { longitude: normalized, sign: ZODIAC[index], degree, minute, label: `${String(degree).padStart(2, '0')}° ${String(minute).padStart(2, '0')}′` };
}

const ASPECTS = [
  { name: 'Conjunction', angle: 0, glyph: '☌', orb: 8 },
  { name: 'Sextile', angle: 60, glyph: '⚹', orb: 5 },
  { name: 'Square', angle: 90, glyph: '□', orb: 6 },
  { name: 'Trine', angle: 120, glyph: '△', orb: 7 },
  { name: 'Opposition', angle: 180, glyph: '☍', orb: 8 },
];

export function calculateAspects(placements) {
  const result = [];
  for (let i = 0; i < placements.length; i++) for (let j = i + 1; j < placements.length; j++) {
    const a = placements[i], b = placements[j];
    let separation = Math.abs(a.longitude - b.longitude);
    if (separation > 180) separation = 360 - separation;
    const aspect = ASPECTS.find(candidate => Math.abs(separation - candidate.angle) <= candidate.orb);
    if (aspect) result.push({ bodyA: a, bodyB: b, ...aspect, separation, orbActual: Math.abs(separation - aspect.angle) });
  }
  return result.sort((a, b) => a.orbActual - b.orbActual);
}
