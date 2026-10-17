import { makeSupabaseHeaders } from './supabase-headers.js';
const SESSION_KEY = 'orrery-auth-session-v1';
const url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const backendReady = Boolean(url && publicKey);

function readStoredSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}
function headers(token) { return makeSupabaseHeaders(publicKey, token); }
async function request(path, options = {}) {
  if (!backendReady) throw new Error('Account storage is not configured yet. Add the Supabase URL and publishable key to the environment.');
  const response = await fetch(`${url}${path}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.msg || body?.message || body?.error_description || body?.error || `Request failed (${response.status}).`);
  return body;
}
function normalizeSession(data) {
  const expiresAt = data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600);
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: expiresAt, user: data.user };
}

export async function getSession() {
  let session = readStoredSession();
  if (!session && typeof window !== 'undefined' && window.location.hash) {
    const values = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = values.get('access_token'), refreshToken = values.get('refresh_token');
    if (accessToken && refreshToken) {
      try {
        const user = await request('/auth/v1/user', { headers: headers(accessToken) });
        session = { access_token: accessToken, refresh_token: refreshToken, expires_at: Math.floor(Date.now()/1000) + Number(values.get('expires_in') || 3600), user };
        saveSession(session);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      } catch { return null; }
    }
  }
  if (!session?.access_token || !session?.refresh_token) return null;
  if (session.expires_at < Math.floor(Date.now() / 1000) + 90) {
    const refresh = async () => {
      const latest = readStoredSession();
      if (latest?.access_token && latest.expires_at >= Math.floor(Date.now() / 1000) + 90) return latest;
      const data = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: (latest || session).refresh_token }) });
      const renewed = normalizeSession(data); saveSession(renewed); return renewed;
    };
    try {
      session = typeof navigator !== 'undefined' && navigator.locks
        ? await navigator.locks.request('orrery-auth-refresh', refresh)
        : await refresh();
    } catch { saveSession(null); return null; }
  }
  return session;
}

export async function signUp(email, password) {
  const redirect = typeof window !== 'undefined' ? `?redirect_to=${encodeURIComponent(window.location.origin)}` : '';
  const data = await request(`/auth/v1/signup${redirect}`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
  if (data.access_token) { const session = normalizeSession(data); saveSession(session); return { session, confirmationRequired: false }; }
  return { session: null, confirmationRequired: true };
}
export async function signIn(email, password) {
  const data = await request('/auth/v1/token?grant_type=password', { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
  const session = normalizeSession(data); saveSession(session); return session;
}
export async function signOut() {
  const session = readStoredSession();
  try { if (session?.access_token && backendReady) await request('/auth/v1/logout', { method: 'POST', headers: headers(session.access_token) }); }
  finally { saveSession(null); }
}

async function rest(path, session, options = {}) {
  const current = await getSession();
  if (!current?.access_token) throw new Error('Sign in to access your saved data.');
  return request(`/rest/v1/${path}`, { ...options, headers: { ...headers(current.access_token), Prefer: 'return=representation', ...options.headers } });
}
export async function listEntries(session) {
  return rest('journal_entries?select=id,title,entry_date,notes,body_name,placement,observed_at,observed_time_zone,created_at,updated_at&order=entry_date.desc,updated_at.desc', session);
}
export async function createEntry(session, entry) {
  return rest('journal_entries?select=id,title,entry_date,notes,body_name,placement,observed_at,observed_time_zone,created_at,updated_at', session, { method: 'POST', body: JSON.stringify(entry) });
}
export async function importLocalEntries(session, entries) {
  if (!entries.length) return [];
  return rest('journal_entries?on_conflict=user_id,local_entry_id&select=id,title,entry_date,notes,body_name,placement,observed_at,observed_time_zone,created_at,updated_at', session, {
    method: 'POST', body: JSON.stringify(entries),
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
}
export async function updateEntry(session, id, entry) {
  return rest(`journal_entries?id=eq.${encodeURIComponent(id)}&select=id,title,entry_date,notes,body_name,placement,observed_at,observed_time_zone,created_at,updated_at`, session, { method: 'PATCH', body: JSON.stringify(entry) });
}
export async function deleteEntry(session, id) {
  return rest(`journal_entries?id=eq.${encodeURIComponent(id)}`, session, { method: 'DELETE' });
}
export async function listCharts(session) {
  return rest('saved_charts?select=id,name,birth_date,birth_time,time_zone,time_occurrence,created_at,updated_at&order=updated_at.desc', session);
}
export async function saveChart(session, chart) {
  return rest('saved_charts?select=id,name,birth_date,birth_time,time_zone,time_occurrence,created_at,updated_at', session, { method: 'POST', body: JSON.stringify(chart) });
}
