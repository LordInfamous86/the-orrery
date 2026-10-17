import assert from 'node:assert/strict';
import { makeSupabaseHeaders } from '../src/supabase-headers.js';

const publishable = 'sb_publishable_example';
const anonymousHeaders = makeSupabaseHeaders(publishable);
assert.equal(anonymousHeaders.apikey, publishable);
assert.equal(anonymousHeaders.Authorization, undefined);

const userHeaders = makeSupabaseHeaders(publishable, 'user-access-jwt');
assert.equal(userHeaders.apikey, publishable);
assert.equal(userHeaders.Authorization, 'Bearer user-access-jwt');
console.log('Supabase request header tests passed.');
