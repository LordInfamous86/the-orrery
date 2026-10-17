function formatInZone(epochMs, zone, formatter) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(epochMs)).map(part => [part.type, part.value]));
  return { year:+parts.year, month:+parts.month, day:+parts.day, hour:+parts.hour, minute:+parts.minute };
}
function sameWallTime(a, b) { return a.year===b.year && a.month===b.month && a.day===b.day && a.hour===b.hour && a.minute===b.minute; }
function wallToEpoch(parts) {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, 0, 0);
  return date.getTime();
}

export function localTimeToUtc(dateText, timeText, zone, disambiguation) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText || '');
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeText || '');
  if (!dateMatch || !timeMatch) throw new Error('Enter both a birth date and a birth time.');
  const [, year, month, day] = dateMatch, [, hour, minute] = timeMatch;
  const wanted = { year:+year, month:+month, day:+day, hour:+hour, minute:+minute };
  if (wanted.hour > 23 || wanted.minute > 59) throw new Error('That date or time is not valid.');
  const target = wallToEpoch(wanted);
  const asUtc = new Date(target);
  if (asUtc.getUTCFullYear() !== wanted.year || asUtc.getUTCMonth() + 1 !== wanted.month || asUtc.getUTCDate() !== wanted.day) throw new Error('That date or time is not valid.');
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' });
  const offsets = new Set();
  for (let hours=-36; hours<=36; hours+=3) {
    const sample = target + hours * 3_600_000;
    const local = formatInZone(sample, zone, formatter);
    offsets.add(wallToEpoch(local) - sample);
  }
  const candidates = [...offsets].map(offset => target - offset).filter(epoch => sameWallTime(formatInZone(epoch, zone, formatter), wanted)).sort((a,b)=>a-b);
  if (!candidates.length) {
    const error = new Error('That local time does not exist in this time zone because of a daylight-saving clock change. Choose a different time.');
    error.code = 'NONEXISTENT_LOCAL_TIME'; throw error;
  }
  if (candidates.length > 1 && !disambiguation) {
    const error = new Error('This local time occurs twice because clocks move back. Choose the first or second occurrence.');
    error.code = 'AMBIGUOUS_LOCAL_TIME'; error.candidates = candidates.map(epoch => new Date(epoch)); throw error;
  }
  return new Date(candidates.length > 1 && disambiguation === 'later' ? candidates.at(-1) : candidates[0]);
}
