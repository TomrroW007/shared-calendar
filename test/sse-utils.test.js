import assert from 'assert';
import { getTokenFromUrlAndHeaders } from '../lib/sse-utils.js';

const t1 = getTokenFromUrlAndHeaders('https://example.com/api/sse?token=abc123', {});
assert.strictEqual(t1, 'abc123');

const t2 = getTokenFromUrlAndHeaders('https://example.com/api/sse', { authorization: 'Bearer xyz' });
assert.strictEqual(t2, 'xyz');

const t3 = getTokenFromUrlAndHeaders('not-a-url', { authorization: 'Bearer xyz' });
assert.strictEqual(t3, null);

console.log('sse-utils tests passed');
