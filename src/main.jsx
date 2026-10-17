import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { calculateAspects, calculateSky } from './astronomy.js';
import { backendReady, createEntry, deleteEntry, getSession, importLocalEntries, listCharts, listEntries, saveChart, signIn, signOut, signUp, updateEntry } from './backend.js';
import { localTimeToUtc } from './time.js';
import './styles.css';
import './natal.css';
import './cloud.css';

const planetTopics = {
  Sun: 'identity, vitality, and the qualities a person grows toward expressing',
  Moon: 'emotional rhythms, instinct, and the ways we seek comfort and belonging',
  Mercury: 'thought, communication, and the ways we gather and exchange information',
  Venus: 'affection, pleasure, beauty, and the values that draw us together',
  Mars: 'action, assertion, desire, and the energy we bring to pursuing what matters',
  Jupiter: 'growth, learning, meaning, and the search for a wider horizon',
  Saturn: 'responsibility, boundaries, patience, and the work of building over time',
};
const signThemes = {
  Aries: 'initiative, courage, and beginnings', Taurus: 'steadiness, sensory awareness, and continuity',
  Gemini: 'curiosity, exchange, and variety', Cancer: 'care, memory, and belonging',
  Leo: 'creativity, warmth, and self-expression', Virgo: 'discernment, craft, and attention to detail',
  Libra: 'balance, reciprocity, and harmony', Scorpio: 'depth, focus, and transformation',
  Sagittarius: 'exploration, candor, and the search for meaning', Capricorn: 'responsibility, patience, and long-range aims',
  Aquarius: 'originality, community, and future-facing ideas', Pisces: 'imagination, compassion, and sensitivity',
};
function interpretationFor(planet, sign) {
  const themes = signThemes[sign] || 'its traditional qualities';
  if (planet === 'Sun') return `In traditional astrology, the Sun is associated with ${planetTopics.Sun}. With the Sun in ${sign}, ${themes} are often emphasized.`;
  if (planet === 'Moon') return `In traditional astrology, the Moon describes ${planetTopics.Moon}. In ${sign}, ${themes} may color emotional responses and what feels nourishing.`;
  return `In traditional astrology, ${planet} is associated with ${planetTopics[planet]}. In ${sign}, ${themes} are often used to describe how these themes may be expressed.`;
}
const colors = { Sun: '#d6b978', Moon: '#b5a6d5', Mercury: '#89a9c2', Venus: '#c99baf', Mars: '#d78e76', Jupiter: '#9ab59c', Saturn: '#9aabb8' };
const fmt = date => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' UTC';

function App() {
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState('Sun');
  const [section, setSection] = useState('Observatory');
  const [returnSection, setReturnSection] = useState('Observatory');
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);
  useEffect(() => { getSession().then(setSession).catch(() => setSession(null)).finally(() => setAuthLoading(false)); }, []);
  useEffect(() => {
    const syncSession = event => { if (event.key === 'orrery-auth-session-v1') getSession().then(setSession).catch(() => setSession(null)); };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);
  const placements = useMemo(() => calculateSky(now), [now]);
  const aspects = useMemo(() => calculateAspects(placements), [placements]);
  const active = placements.find(p => p.name === selected) ?? placements[0];
  const go = (item) => { setSection(item); setSelected('Sun'); };
  const openAccount = () => { setReturnSection(section === 'Account' ? 'Observatory' : section); go('Account'); };
  return <div className="shell">
    <header className="top"><button className="brand" onClick={() => go('Observatory')}><span className="sigil">✳</span><span><strong>THE ORRERY</strong><small>PERSONAL CELESTIAL OBSERVATORY</small></span></button>
      <nav className="nav">{['Observatory', 'Natal chart', 'Journal'].map(item => <button key={item} className={section === item ? 'active' : ''} onClick={() => go(item)}>{item}</button>)}</nav><button className="user user-button" onClick={openAccount} aria-label="Open account"><div className="avatar">{session ? (session.user.email?.[0]?.toUpperCase() || 'A') : 'A'}</div>{session?.user.email || (authLoading ? 'Loading…' : 'Guest')}</button></header>
    {section === 'Natal chart' ? <NatalChart session={session} onSignIn={openAccount} /> : section === 'Journal' ? <Journal placements={placements} session={session} authConfigured={backendReady} onSignIn={openAccount} /> : section === 'Account' ? <Account session={session} configured={backendReady} onSession={value=>{setSession(value); if(value) go(returnSection);}} /> :
    <main><div className="heading"><div><div className="eyebrow">{new Intl.DateTimeFormat(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(now)}</div><h1>The sky, observed.</h1><p>A moment in the heavens, held in view.</p></div><div className="timestamp">SKY SNAPSHOT<br/>{fmt(now)}</div></div>
      <div className="grid"><section className="card sky"><div className="cardhead"><div><h2>Celestial positions</h2><div className="sub">The seven classical planets · geocentric ecliptic</div></div><div className="live">CALCULATED NOW</div></div>
        <div className="orbits" aria-hidden="true"><svg className="constellation" viewBox="0 0 700 250" preserveAspectRatio="none"><path d="M90 62l50 40 42-27 57 48 48-22M450 58l38 49 65-14 44 40 42-24" fill="none" stroke="#9dabc0" strokeWidth=".7"/><g fill="#d8c99f"><circle cx="90" cy="62" r="1.5"/><circle cx="140" cy="102" r="1.4"/><circle cx="182" cy="75" r="1.8"/><circle cx="239" cy="123" r="1.5"/><circle cx="287" cy="101" r="1.2"/><circle cx="450" cy="58" r="1.5"/><circle cx="488" cy="107" r="1.3"/><circle cx="553" cy="93" r="1.7"/><circle cx="597" cy="133" r="1.4"/><circle cx="639" cy="109" r="1.6"/></g></svg><div className="orbit"/><div className="orbit o2"/><div className="orbit o3"/><div className="sun"/>{placements.slice(1).map((p, i) => <button aria-label={`Select ${p.name}`} key={p.name} className={`planetdot d${i}`} style={{ color: colors[p.name] }} onClick={() => setSelected(p.name)} />)}</div>
        <div className="planetgrid">{placements.map(p => <button key={p.name} onClick={() => setSelected(p.name)} className={`planet ${selected === p.name ? 'selected' : ''}`}><div className="planettop"><span className="pname">{p.name}</span><span className="glyph" style={{ color: colors[p.name] }}>{p.glyph}</span></div><div className="pplace">{p.sign}</div><div className="degree">{p.label}</div></button>)}</div>
      </section><div className="side"><section className="card detail"><div className="eyebrow">PLANETARY NOTE</div><div className="detailtop"><div className="bigglyph" style={{ color: colors[active.name] }}>{active.glyph}</div><div><h2>{active.name} in {active.sign}</h2><div className="sub">{active.label} · ecliptic longitude</div></div></div><p>{interpretationFor(active.name, active.sign)}</p><small className="interpretation">Traditional interpretation · distinct from astronomical measurement</small></section>
        <section className="card aspects"><div className="cardhead"><div><h2>Notable aspects</h2><div className="sub">Major angular relationships · 7° maximum orb</div></div><span className="eyebrow">{String(aspects.length).padStart(2, '0')}</span></div>{aspects.length ? aspects.slice(0, 5).map((a, i) => <div className="aspect" key={`${a.bodyA.name}-${a.bodyB.name}`}><div className="aspair">{a.bodyA.glyph} {a.bodyA.name} <span>—</span> {a.bodyB.glyph} {a.bodyB.name}</div><span className={`aspbadge ${i % 2 ? 'gold' : ''}`}>{a.name.toUpperCase()} · {a.orbActual.toFixed(1)}°</span></div>) : <div className="empty">No major aspects within the selected orbs at this moment.</div>}<div className="caveat">Aspect names and orbs follow the app’s stated traditional convention.</div></section></div></div>
      <div className="bottom"><section className="card natal"><div><div className="eyebrow">YOUR CHART</div><h2>Natal chart explorer</h2><div className="sub">Map planetary placements for a date and time that matters to you.</div></div><button className="outline" onClick={() => setSection('Natal chart')}>Explore your chart ↗</button></section><section className="card journal"><div className="cardhead"><div><h2>Celestial journal</h2><div className="sub">A place for what the sky brings to mind.</div></div><button onClick={() => setSection('Journal')}>Open journal ↗</button></div><div className="note">Write down a sky observation or a thought you want to remember.<small>JOURNAL · SAVED TO THIS BROWSER OR YOUR ACCOUNT</small></div></section></div>
      <div className="foot"><span>POSITIONS CALCULATED FOR {fmt(now).toUpperCase()}</span><span>ASTRONOMICAL POSITION ≠ ASTROLOGICAL INTERPRETATION</span></div>
    </main>}
  </div>;
}

function Account({ session, configured, onSession }) {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'sign-up') {
        const result = await signUp(email.trim(), password);
        if (result.session) onSession(result.session);
        else setMessage('Check your email for a confirmation link, then return here to sign in.');
      } else onSession(await signIn(email.trim(), password));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function leave() { setBusy(true); setError(''); try { await signOut(); setMessage('You are signed out.'); } catch (err) { setError(`Signed out on this device. The remote session could not be revoked: ${err.message}`); } finally { onSession(null); setBusy(false); } }
  return <main className="account-page"><div className="heading"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>Keep your sky close.</h1><p>Sign in to keep charts and journal observations with your account.</p></div></div>
    {!configured ? <section className="card setup-card"><div className="eyebrow">ACCOUNT STORAGE NOT CONFIGURED</div><h2>Connect a Supabase project</h2><p>Set the Supabase URL and publishable key in your local <code>.env</code> file, then apply the migration in <code>supabase/migrations/0001_private_user_data.sql</code>. The app uses Supabase Auth and row-level security for user-owned records.</p><p>No secret or service-role key belongs in the browser.</p></section> : session ? <section className="card signed-in-card"><div className="bigglyph">✓</div><div><div className="eyebrow">SIGNED IN</div><h2>{session.user.email}</h2><p>Your saved records are protected by database row-level security.</p><button className="outline" onClick={leave} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-note">{message}</div>}</div></section> : <form className="card auth-form" onSubmit={submit}><div className="form-intro"><div className="sigil">✳</div><div><h2>{mode === 'sign-in' ? 'Welcome back.' : 'Create your account.'}</h2><p>Private charts and journal notes are tied to your account.</p></div></div><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength="8" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-note" role="status">{message}</div>}<button className="outline auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button><button type="button" className="mode-toggle" onClick={()=>{setMode(mode==='sign-in'?'sign-up':'sign-in');setError('');setMessage('');}}>{mode==='sign-in' ? 'New to The Orrery? Create an account' : 'Already have an account? Sign in'}</button></form>}
    <div className="foot"><span>AUTHENTICATION BY SUPABASE</span><span>USER DATA IS ISOLATED BY ROW LEVEL SECURITY</span></div>
  </main>;
}

const commonZones = [
  ['America/Chicago', 'Central Time · Chicago'], ['America/New_York', 'Eastern Time · New York'],
  ['America/Denver', 'Mountain Time · Denver'], ['America/Los_Angeles', 'Pacific Time · Los Angeles'],
  ['America/Anchorage', 'Alaska Time · Anchorage'], ['Pacific/Honolulu', 'Hawaii Time · Honolulu'],
  ['Europe/London', 'United Kingdom · London'], ['Europe/Paris', 'Central Europe · Paris'],
  ['Europe/Moscow', 'Moscow'], ['Asia/Kolkata', 'India · Kolkata'], ['Asia/Tokyo', 'Japan · Tokyo'],
  ['Australia/Sydney', 'Australia · Sydney'], ['UTC', 'UTC'],
];
const supportedZones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : commonZones.map(([value]) => value);
const commonZoneNames = new Map(commonZones);
const zones = [...new Set([...commonZones.map(([value]) => value), ...supportedZones])].map(value => [value, commonZoneNames.get(value) || value.replaceAll('_', ' ')]);
function browserZone() { const name = Intl.DateTimeFormat().resolvedOptions().timeZone; return zones.some(z => z[0] === name) ? name : 'UTC'; }

function Wheel({ placements, selected, onSelect }) {
  const size = 390, center = size / 2, outer = 174, inner = 111;
  const point = (angle, radius) => { const rad = angle * Math.PI / 180 - Math.PI / 2; return [center + Math.cos(rad) * radius, center + Math.sin(rad) * radius]; };
  return <svg className="wheel" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Natal chart wheel with zodiac signs and planetary placements">
    <circle cx={center} cy={center} r={outer} fill="#0f151f" stroke="#35404d"/><circle cx={center} cy={center} r={inner} fill="#111722" stroke="#35404d"/>
    {Array.from({ length: 12 }, (_, i) => { const a = i * 30, [x1,y1] = point(a,inner), [x2,y2] = point(a,outer), [tx,ty] = point(a+15,(inner+outer)/2), [sx,sy] = point(a+15,outer+15); return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#35404d"/><text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" className="wheel-sign">{['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'][i]}</text></g>; })}
    {placements.map((p, i) => { const angle = p.longitude, r = 97 + (i % 2) * 24, [x,y] = point(angle,r); return <g key={p.name} onClick={() => onSelect(p.name)} className="wheel-mark" role="button" tabIndex="0" aria-label={`${p.name} in ${p.sign}, ${p.label}`} onKeyDown={e => e.key === 'Enter' && onSelect(p.name)}><circle cx={x} cy={y} r={selected === p.name ? 15 : 13} fill={selected === p.name ? '#272636' : '#171e2a'} stroke={selected === p.name ? '#d6b978' : '#485361'}/><text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fill={colors[p.name]} className="wheel-glyph">{p.glyph}</text></g>; })}
    <text x={center} y={center-7} textAnchor="middle" className="wheel-center">THE SKY</text><text x={center} y={center+12} textAnchor="middle" className="wheel-center-small">AT YOUR BIRTH</text>
  </svg>;
}

function NatalChart({ session, onSignIn }) {
  const [date, setDate] = useState('1990-01-01');
  const [time, setTime] = useState('12:00');
  const [zone, setZone] = useState(browserZone);
  const [chart, setChart] = useState(null);
  const [selected, setSelected] = useState('Sun');
  const [error, setError] = useState('');
  const [savedCharts, setSavedCharts] = useState([]);
  const [chartName, setChartName] = useState('My natal chart');
  const [saveMessage, setSaveMessage] = useState('');
  const [ambiguousTime, setAmbiguousTime] = useState(false);
  const [timeOccurrence, setTimeOccurrence] = useState('');
  useEffect(() => {
    if (!session) { setSavedCharts([]); return; }
    let alive = true;
    listCharts(session).then(rows => { if (alive) setSavedCharts(rows); }).catch(err => { if (alive) setSaveMessage(err.message); });
    return () => { alive = false; };
  }, [session]);
  const selectedBody = chart?.placements.find(p => p.name === selected) ?? chart?.placements[0];
  const chartAspects = useMemo(() => chart ? calculateAspects(chart.placements) : [], [chart]);
  function submit(e) { e.preventDefault(); try { const utc = localTimeToUtc(date, time, zone, timeOccurrence || undefined); setChart({ utc, birthDate: date, birthTime: time, zone, occurrence: timeOccurrence || null, placements: calculateSky(utc) }); setSelected('Sun'); setError(''); setAmbiguousTime(false); } catch (err) { setError(err.message); setChart(null); setAmbiguousTime(err.code === 'AMBIGUOUS_LOCAL_TIME'); } }
  async function storeChart() {
    if (!session || !chart) return;
    try { setSaveMessage(''); const rows = await saveChart(session, { user_id: session.user.id, name: chartName.trim() || 'Natal chart', birth_date: chart.birthDate, birth_time: chart.birthTime, time_zone: chart.zone, time_occurrence: chart.occurrence }); setSavedCharts(old => [rows[0], ...old]); setSaveMessage('Chart saved to your account.'); }
    catch (err) { setSaveMessage(err.message); }
  }
  function loadChart(item) {
    try { const birthTime = item.birth_time.slice(0,5); const utc = localTimeToUtc(item.birth_date, birthTime, item.time_zone, item.time_occurrence); setDate(item.birth_date); setTime(birthTime); setZone(item.time_zone); setTimeOccurrence(item.time_occurrence || ''); setChart({ utc, birthDate:item.birth_date, birthTime, zone:item.time_zone, occurrence:item.time_occurrence || null, placements:calculateSky(utc) }); setSelected('Sun'); setError(''); setAmbiguousTime(false); }
    catch (err) { setError(err.message); }
  }
  return <main className="natal-page"><div className="heading"><div><div className="eyebrow">YOUR CHART</div><h1>Natal chart explorer.</h1><p>Planetary positions for a date and time that matters to you.</p></div><div className="timestamp">GEOCENTRIC ECLIPTIC<br/>LOCATION NOT REQUIRED FOR PLANET SIGNS</div></div>
    <form className="card birth-form" onSubmit={submit}><div className="form-intro"><div className="sigil">✳</div><div><h2>Enter birth details</h2><p>Use the local time and time zone where the birth took place.</p></div></div><div className="form-fields"><label>Birth date<input type="date" required value={date} onChange={e => { setDate(e.target.value); setTimeOccurrence(''); setAmbiguousTime(false); }}/></label><label>Birth time<input type="time" required value={time} onChange={e => { setTime(e.target.value); setTimeOccurrence(''); setAmbiguousTime(false); }}/></label><label>Time zone<select value={zone} onChange={e => { setZone(e.target.value); setTimeOccurrence(''); setAmbiguousTime(false); }}>{zones.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="outline calculate-button" type="submit">Calculate chart ↗</button></div>{ambiguousTime && <label className="occurrence-field">This local time occurred twice<select required value={timeOccurrence} onChange={e=>setTimeOccurrence(e.target.value)}><option value="">Choose the occurrence</option><option value="earlier">First occurrence · daylight time</option><option value="later">Second occurrence · standard time</option></select></label>}{error && <div className="form-error" role="alert">{error}</div>}<div className="form-note">Birth time is converted to UTC using the selected time zone, including daylight-saving rules. If the time is unknown, use noon as an estimate; the Moon placement may differ.</div></form>
    <section className="card saved-charts"><div className="saved-chart-heading"><div><div className="eyebrow">SAVED CHARTS</div><div className="sub">Your birth details stay in your account.</div></div>{session ? <label className="save-chart-name">Chart name<input maxLength="80" value={chartName} onChange={e=>setChartName(e.target.value)} /></label> : <button className="mode-toggle" onClick={onSignIn}>Sign in to save charts</button>}</div>{session && chart && <div className="saved-chart-action"><button className="outline" onClick={storeChart}>Save current chart</button></div>}{saveMessage && <div className="form-note">{saveMessage}</div>}{savedCharts.length > 0 && <div className="saved-chart-list">{savedCharts.map(item=><button className="saved-chart-pill" key={item.id} onClick={()=>loadChart(item)}><span>{item.name}</span><small>{item.birth_date} · {item.time_zone}</small></button>)}</div>}</section>    {chart ? <><div className="chart-meta"><span>CALCULATED FOR {fmt(chart.utc)}</span><span>ASTROLOGICAL HOUSES AND ASCENDANT OMITTED</span></div><div className="chart-layout"><section className="card wheel-card"><div className="cardhead"><div><h2>Planetary wheel</h2><div className="sub">Zodiac signs are shown clockwise from Aries.</div></div><span className="eyebrow">TROPICAL</span></div><Wheel placements={chart.placements} selected={selected} onSelect={setSelected}/><div className="wheel-foot">Tap a planetary marker to inspect its placement.</div></section><div className="chart-side"><section className="card detail"><div className="eyebrow">PLANETARY NOTE</div><div className="detailtop"><div className="bigglyph" style={{color:colors[selectedBody.name]}}>{selectedBody.glyph}</div><div><h2>{selectedBody.name} in {selectedBody.sign}</h2><div className="sub">{selectedBody.label} · ecliptic longitude</div></div></div><p>{interpretationFor(selectedBody.name, selectedBody.sign)}</p><small className="interpretation">Traditional interpretation · distinct from astronomical measurement</small></section><section className="card aspects"><div className="cardhead"><div><h2>Chart aspects</h2><div className="sub">Major angular relationships</div></div><span className="eyebrow">{String(chartAspects.length).padStart(2,'0')}</span></div>{chartAspects.length ? chartAspects.slice(0,7).map(a => <div className="aspect" key={`${a.bodyA.name}-${a.bodyB.name}`}><div className="aspair">{a.bodyA.glyph} {a.bodyA.name} <span>—</span> {a.bodyB.glyph} {a.bodyB.name}</div><span className="aspbadge">{a.name.toUpperCase()} · {a.orbActual.toFixed(1)}°</span></div>) : <div className="empty">No major aspects within the selected orbs.</div>}<div className="caveat">Aspect names and orbs follow the app’s stated traditional convention.</div></section></div></div><section className="card placement-list"><div className="cardhead"><div><h2>Placements</h2><div className="sub">Calculated positions · select a body to read its note.</div></div><span className="eyebrow">7 BODIES</span></div><div className="planetgrid">{chart.placements.map(p => <button key={p.name} onClick={() => setSelected(p.name)} className={`planet ${selected === p.name ? 'selected' : ''}`}><div className="planettop"><span className="pname">{p.name}</span><span className="glyph" style={{color:colors[p.name]}}>{p.glyph}</span></div><div className="pplace">{p.sign}</div><div className="degree">{p.label}</div></button>)}</div></section></> : <section className="card chart-empty"><div className="chart-empty-orbit">☾</div><h2>Your chart will appear here.</h2><p>Enter a birth date, local time, and time zone, then calculate the planetary placements and major aspects for that moment.</p></section>}
    <div className="foot"><span>POSITIONS CALCULATED WITH ASTRONOMY ENGINE</span><span>ASTRONOMICAL POSITION ≠ ASTROLOGICAL INTERPRETATION</span></div>
  </main>;
}

const JOURNAL_KEY = 'orrery-journal-v1';
function localDateString(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function localTimeString(date = new Date()) { return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`; }
function timeInZone(instant, zone) {
  if (!instant) return localTimeString();
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).map(part=>[part.type,part.value]));
  return `${parts.hour}:${parts.minute}`;
}
function occurrenceFor(date, time, zone, instant) {
  if (!instant) return '';
  try { localTimeToUtc(date, time, zone); return ''; }
  catch (error) {
    if (error.code !== 'AMBIGUOUS_LOCAL_TIME') return '';
    return error.candidates?.[1]?.toISOString() === new Date(instant).toISOString() ? 'later' : 'earlier';
  }
}
function readJournal() {
  try { const value = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function Journal(props) {
  return props.authConfigured ? <CloudJournal {...props} /> : <LocalJournal {...props} />;
}

function CloudJournal({ placements, session, onSignIn }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(localDateString);
  const [observationTime, setObservationTime] = useState(localTimeString);
  const [observationZone, setObservationZone] = useState(browserZone);
  const [timeOccurrence, setTimeOccurrence] = useState('');
  const [bodyName, setBodyName] = useState('');
  const [notesText, setNotesText] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const observationTimeResult = useMemo(() => { try { return { instant: localTimeToUtc(date, observationTime, observationZone, timeOccurrence || undefined), error: null }; } catch (error) { return { instant: null, error }; } }, [date, observationTime, observationZone, timeOccurrence]);
  const entryPlacements = useMemo(() => observationTimeResult.instant ? calculateSky(observationTimeResult.instant) : [], [observationTimeResult.instant]);
  useEffect(() => {
    if (!session) { setEntries([]); setLoading(false); return; }
    let alive = true; setLoading(true); setError('');
    listEntries(session).then(rows => { if (alive) setEntries(rows.map(row => ({ id: row.id, title: row.title, date: row.entry_date, notes: row.notes, bodyName: row.body_name || '', placement: row.placement || '', observedAt: row.observed_at || '', observationZone: row.observed_time_zone || '', createdAt: row.created_at, updatedAt: row.updated_at }))); })
      .catch(err => { if (alive) setError(err.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [session]);
  function clearForm() { setEditing(null); setTitle(''); setDate(localDateString()); setObservationTime(localTimeString()); setObservationZone(browserZone()); setTimeOccurrence(''); setBodyName(''); setNotesText(''); setError(''); setShowForm(false); }
  function beginEdit(entry) { const zone = entry.observationZone || browserZone(), time = timeInZone(entry.observedAt, zone); setEditing(entry.id); setTitle(entry.title); setDate(entry.date); setObservationZone(zone); setObservationTime(time); setTimeOccurrence(occurrenceFor(entry.date, time, zone, entry.observedAt)); setBodyName(entry.bodyName || ''); setNotesText(entry.notes); setError(''); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function submit(e) {
    e.preventDefault(); if (!title.trim() || !date || !notesText.trim()) { setError('Add a title, date, and observation before saving.'); return; }
    const planet = entryPlacements.find(p => p.name === bodyName);
    if (bodyName && !planet) { setError(observationTimeResult.error?.message || 'Choose a valid observation time before saving its planetary placement.'); return; }
    let observedAt = null;
    if (planet) observedAt = observationTimeResult.instant.toISOString();
    const value = { user_id: session.user.id, title: title.trim(), entry_date: date, notes: notesText.trim(), body_name: planet?.name || null, placement: planet ? `${planet.sign} ${planet.label}` : null, observed_at: observedAt, observed_time_zone: planet ? observationZone : null };
    try {
      setError('');
      const rows = editing ? await updateEntry(session, editing, value) : await createEntry(session, value);
      const saved = rows[0];
      if (saved) {
        const item = { id: saved.id, title: saved.title, date: saved.entry_date, notes: saved.notes, bodyName: saved.body_name || '', placement: saved.placement || '', observedAt: saved.observed_at || '', observationZone: saved.observed_time_zone || '', createdAt: saved.created_at, updatedAt: saved.updated_at };
        setEntries(old => editing ? old.map(row => row.id === editing ? item : row) : [item, ...old]);
      } else setEntries(await listEntries(session).then(rows => rows.map(row => ({ id: row.id, title: row.title, date: row.entry_date, notes: row.notes, bodyName: row.body_name || '', placement: row.placement || '', observedAt: row.observed_at || '', observationZone: row.observed_time_zone || '', createdAt: row.created_at, updatedAt: row.updated_at }))));
      clearForm();
    } catch (err) { setError(err.message); }
  }
  async function remove(id) {
    if (!window.confirm('Delete this journal entry from your account? This cannot be undone.')) return;
    try { setError(''); await deleteEntry(session, id); setEntries(old => old.filter(entry => entry.id !== id)); }
    catch (err) { setError(err.message); }
  }
  async function importBrowserJournal() {
    const local = readJournal();
    if (!local.length || !window.confirm(`Import ${local.length} browser journal entr${local.length === 1 ? 'y' : 'ies'} into the signed-in account ${session.user.email}? Your browser copy will remain.`)) return;
    try {
      setImporting(true); setError('');
      const payload = local.map(entry => ({ user_id:session.user.id, title:entry.title, entry_date:entry.date, notes:entry.notes, body_name:entry.bodyName || null, placement:entry.placement || null, observed_at:entry.observedAt || null, observed_time_zone:entry.observationZone || null, local_entry_id:entry.id }));
      await importLocalEntries(session, payload);
      const rows = await listEntries(session);
      setEntries(rows.map(row => ({ id:row.id, title:row.title, date:row.entry_date, notes:row.notes, bodyName:row.body_name || '', placement:row.placement || '', observedAt:row.observed_at || '', observationZone:row.observed_time_zone || '', createdAt:row.created_at, updatedAt:row.updated_at })));
    } catch (err) { setError(err.message); }
    finally { setImporting(false); }
  }
  const ordered = [...entries].sort((a,b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  return <main className="journal-page"><div className="heading"><div><div className="eyebrow">PERSONAL OBSERVATIONS</div><h1>Celestial journal.</h1><p>Keep a record of the sky and what it brings to mind.</p></div>{session && <button className="outline new-entry" onClick={() => { clearForm(); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'}); }}>＋ New observation</button>}</div>
    {!session ? <section className="card journal-empty"><div className="chart-empty-orbit">✎</div><h2>Sign in to your journal.</h2><p>Your observations are stored in your account and protected by row-level security.</p><button className="outline" onClick={onSignIn}>Go to account</button></section> : <>
      <div className="storage-note"><span className="storage-dot"/> SAVED TO YOUR ACCOUNT <span>Your notes are private to your signed-in account.</span></div>
      {readJournal().length > 0 && <div className="import-local-note"><span>{readJournal().length} observation{readJournal().length === 1 ? '' : 's'} stored in this browser.</span><button className="mode-toggle" onClick={importBrowserJournal} disabled={importing}>{importing ? 'Importing…' : 'Import browser notes'}</button></div>}
      {showForm && <form className="card entry-form" onSubmit={submit}><div className="cardhead"><div><div className="eyebrow">{editing ? 'EDIT OBSERVATION' : 'NEW OBSERVATION'}</div><h2>{editing ? 'Revisit your note.' : 'What did you notice?'}</h2></div><button className="quiet-button" type="button" onClick={clearForm} aria-label="Close form">×</button></div><div className="entry-fields"><label>Title<input autoFocus maxLength="100" value={title} onChange={e=>setTitle(e.target.value)} placeholder="A phrase to remember this moment" required/></label><label>Date<input type="date" value={date} onChange={e=>{setDate(e.target.value);setTimeOccurrence('');}} required/></label><label>Observation time<input type="time" value={observationTime} onChange={e=>{setObservationTime(e.target.value);setTimeOccurrence('');}} required/></label><label>Time zone<select value={observationZone} onChange={e=>{setObservationZone(e.target.value);setTimeOccurrence('');}}>{zones.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Planetary placement <span className="optional">OPTIONAL</span><select value={bodyName} onChange={e=>setBodyName(e.target.value)}><option value="">No placement</option>{entryPlacements.map(p=><option value={p.name} key={p.name}>{p.glyph} {p.name} in {p.sign} · {p.label}</option>)}</select></label><label className="notes-label">Observation<textarea maxLength="5000" rows="5" value={notesText} onChange={e=>setNotesText(e.target.value)} placeholder="What was happening in the sky? What meaning or memory came to mind?" required/></label></div>{observationTimeResult.error?.code === 'AMBIGUOUS_LOCAL_TIME' && <label className="occurrence-field">This local time occurred twice<select required value={timeOccurrence} onChange={e=>setTimeOccurrence(e.target.value)}><option value="">Choose the occurrence</option><option value="earlier">First occurrence · daylight time</option><option value="later">Second occurrence · standard time</option></select></label>}{observationTimeResult.error?.code === 'NONEXISTENT_LOCAL_TIME' && <div className="form-note" role="status">{observationTimeResult.error.message}</div>}{error && <div className="form-error" role="alert">{error}</div>}<div className="entry-actions"><span className="form-note">Optional placement is calculated for this date, time, and time zone.</span><button className="outline" type="submit">{editing ? 'Save changes' : 'Save observation'}</button></div></form>}
      {error && !showForm && <div className="form-error" role="alert">{error}</div>}
      <section className="journal-list">{loading ? <div className="card journal-empty">Loading your observations…</div> : ordered.length ? ordered.map(entry=><article className="card journal-entry" key={entry.id}><div className="entry-date"><span className="eyebrow">{new Intl.DateTimeFormat(undefined,{month:'short',day:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(`${entry.date}T00:00:00Z`))}</span>{entry.bodyName && <span className="entry-placement">{placements.find(p=>p.name===entry.bodyName)?.glyph} {entry.bodyName} · {entry.placement} <small>{entry.observedAt ? `${timeInZone(entry.observedAt, entry.observationZone || browserZone())} · ${entry.observationZone || browserZone()}` : 'TIME NOT RECORDED'}</small></span>}</div><div className="entry-content"><h2>{entry.title}</h2><p>{entry.notes}</p><div className="entry-buttons"><button onClick={()=>beginEdit(entry)}>Edit</button><button className="delete-button" onClick={()=>remove(entry.id)}>Delete</button></div></div></article>) : <div className="card journal-empty"><div className="chart-empty-orbit">✎</div><h2>Your journal is waiting.</h2><p>Save a sky observation, a transit that caught your attention, or a traditional interpretation you want to remember.</p>{!showForm && <button className="outline" onClick={()=>setShowForm(true)}>Write your first observation</button>}</div>}</section>
      <div className="foot"><span>{entries.length} {entries.length===1?'OBSERVATION':'OBSERVATIONS'} · SYNCED</span><span>YOUR NOTES STAY PRIVATE TO YOUR ACCOUNT</span></div>
    </>}
  </main>;
}

function LocalJournal({ placements }) {
  const [entries, setEntries] = useState(readJournal);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(localDateString);
  const [observationTime, setObservationTime] = useState(localTimeString);
  const [observationZone, setObservationZone] = useState(browserZone);
  const [timeOccurrence, setTimeOccurrence] = useState('');
  const [bodyName, setBodyName] = useState('');
  const [notesText, setNotesText] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const observationTimeResult = useMemo(() => { try { return { instant: localTimeToUtc(date, observationTime, observationZone, timeOccurrence || undefined), error: null }; } catch (error) { return { instant: null, error }; } }, [date, observationTime, observationZone, timeOccurrence]);
  const entryPlacements = useMemo(() => observationTimeResult.instant ? calculateSky(observationTimeResult.instant) : [], [observationTimeResult.instant]);
  function persist(next) { try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(next)); setEntries(next); } catch { setError('Could not save in this browser. Check available storage and try again.'); } }
  function clearForm() { setEditing(null); setTitle(''); setDate(localDateString()); setObservationTime(localTimeString()); setObservationZone(browserZone()); setTimeOccurrence(''); setBodyName(''); setNotesText(''); setError(''); setShowForm(false); }
  function beginEdit(entry) { const zone = entry.observationZone || browserZone(), time = timeInZone(entry.observedAt, zone); setEditing(entry.id); setTitle(entry.title); setDate(entry.date); setObservationZone(zone); setObservationTime(time); setTimeOccurrence(occurrenceFor(entry.date, time, zone, entry.observedAt)); setBodyName(entry.bodyName || ''); setNotesText(entry.notes); setError(''); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function submit(e) { e.preventDefault(); if (!title.trim() || !date || !notesText.trim()) { setError('Add a title, date, and observation before saving.'); return; }
    const planet = entryPlacements.find(p => p.name === bodyName);
    if (bodyName && !planet) { setError(observationTimeResult.error?.message || 'Choose a valid observation time before saving its planetary placement.'); return; }
    const previous = entries.find(item => item.id === editing);
    let observedAt = '';
    if (planet) observedAt = observationTimeResult.instant.toISOString();
    const item = { id: editing || crypto.randomUUID(), title: title.trim(), date, notes: notesText.trim(), bodyName: planet?.name || '', placement: planet ? `${planet.sign} ${planet.label}` : '', observedAt, observationZone: planet ? observationZone : '', createdAt: previous?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    const next = editing ? entries.map(entry => entry.id === editing ? item : entry) : [item, ...entries];
    persist(next); clearForm();
  }
  function remove(id) { if (!window.confirm('Delete this journal entry from this browser? This cannot be undone.')) return; persist(entries.filter(entry => entry.id !== id)); }
  const ordered = [...entries].sort((a,b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  return <main className="journal-page"><div className="heading"><div><div className="eyebrow">PERSONAL OBSERVATIONS</div><h1>Celestial journal.</h1><p>Keep a record of the sky and what it brings to mind.</p></div><button className="outline new-entry" onClick={() => { clearForm(); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'}); }}>＋ New observation</button></div>
    <div className="storage-note"><span className="storage-dot"/> SAVED IN THIS BROWSER ONLY <span>Entries are not synced or protected by an account yet.</span></div>
    {showForm && <form className="card entry-form" onSubmit={submit}><div className="cardhead"><div><div className="eyebrow">{editing ? 'EDIT OBSERVATION' : 'NEW OBSERVATION'}</div><h2>{editing ? 'Revisit your note.' : 'What did you notice?'}</h2></div><button className="quiet-button" type="button" onClick={clearForm} aria-label="Close form">×</button></div><div className="entry-fields"><label>Title<input autoFocus maxLength="100" value={title} onChange={e=>setTitle(e.target.value)} placeholder="A phrase to remember this moment" required/></label><label>Date<input type="date" value={date} onChange={e=>{setDate(e.target.value);setTimeOccurrence('');}} required/></label><label>Observation time<input type="time" value={observationTime} onChange={e=>{setObservationTime(e.target.value);setTimeOccurrence('');}} required/></label><label>Time zone<select value={observationZone} onChange={e=>{setObservationZone(e.target.value);setTimeOccurrence('');}}>{zones.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Planetary placement <span className="optional">OPTIONAL</span><select value={bodyName} onChange={e=>setBodyName(e.target.value)}><option value="">No placement</option>{entryPlacements.map(p=><option value={p.name} key={p.name}>{p.glyph} {p.name} in {p.sign} · {p.label}</option>)}</select></label><label className="notes-label">Observation<textarea maxLength="5000" rows="5" value={notesText} onChange={e=>setNotesText(e.target.value)} placeholder="What was happening in the sky? What meaning or memory came to mind?" required/></label></div>{observationTimeResult.error?.code === 'AMBIGUOUS_LOCAL_TIME' && <label className="occurrence-field">This local time occurred twice<select required value={timeOccurrence} onChange={e=>setTimeOccurrence(e.target.value)}><option value="">Choose the occurrence</option><option value="earlier">First occurrence · daylight time</option><option value="later">Second occurrence · standard time</option></select></label>}{observationTimeResult.error?.code === 'NONEXISTENT_LOCAL_TIME' && <div className="form-note" role="status">{observationTimeResult.error.message}</div>}{error && <div className="form-error" role="alert">{error}</div>}<div className="entry-actions"><span className="form-note">Optional placement is calculated for this date, time, and time zone.</span><button className="outline" type="submit">{editing ? 'Save changes' : 'Save observation'}</button></div></form>}
    <section className="journal-list">{ordered.length ? ordered.map(entry=><article className="card journal-entry" key={entry.id}><div className="entry-date"><span className="eyebrow">{new Intl.DateTimeFormat(undefined,{month:'short',day:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(`${entry.date}T00:00:00Z`))}</span>{entry.bodyName && <span className="entry-placement">{placements.find(p=>p.name===entry.bodyName)?.glyph} {entry.bodyName} · {entry.placement} <small>{entry.observedAt ? `${timeInZone(entry.observedAt, entry.observationZone || browserZone())} · ${entry.observationZone || browserZone()}` : 'TIME NOT RECORDED'}</small></span>}</div><div className="entry-content"><h2>{entry.title}</h2><p>{entry.notes}</p><div className="entry-buttons"><button onClick={()=>beginEdit(entry)}>Edit</button><button className="delete-button" onClick={()=>remove(entry.id)}>Delete</button></div></div></article>) : <div className="card journal-empty"><div className="chart-empty-orbit">✎</div><h2>Your journal is waiting.</h2><p>Save a sky observation, a transit that caught your attention, or a traditional interpretation you want to remember.</p>{!showForm && <button className="outline" onClick={()=>setShowForm(true)}>Write your first observation</button>}</div>}</section>
    <div className="foot"><span>{entries.length} {entries.length===1?'OBSERVATION':'OBSERVATIONS'} · STORED LOCALLY</span><span>YOUR NOTES STAY IN THIS BROWSER</span></div>
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
