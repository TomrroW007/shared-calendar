import assert from 'assert';
import { createEphemeralToken, getUserIdForToken, clearAllEphemeralTokens } from '../lib/sse-token.js';

clearAllEphemeralTokens();
const { token, expiresAt } = createEphemeralToken('user-123', 200);
assert.ok(typeof token === 'string' && token.length > 0);
assert.ok(expiresAt > Date.now());
const uid = getUserIdForToken(token);
assert.strictEqual(uid, 'user-123');

// after TTL+small buffer it should be expired
await new Promise(r => setTimeout(r, 350));
const uid2 = getUserIdForToken(token);
assert.strictEqual(uid2, null);

console.log('sse-token tests passed');
