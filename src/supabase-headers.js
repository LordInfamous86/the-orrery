export function makeSupabaseHeaders(publicKey, accessToken) {
  const result = { apikey: publicKey, 'Content-Type': 'application/json' };
  // Publishable keys are API keys, not JWTs. Authorization is for a signed-in user's JWT.
  if (accessToken) result.Authorization = `Bearer ${accessToken}`;
  return result;
}
