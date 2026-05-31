import assert from 'assert';
import { extractExpiredEndpoints } from '../lib/push-utils.js';

const results = [
    { expired: true, endpoint: 'https://a' },
    { expired: false },
    { expired: true, endpoint: 'https://b' },
    null,
    { expired: true, endpoint: '' },
];

const eps = extractExpiredEndpoints(results);
assert.deepStrictEqual(eps, ['https://a', 'https://b']);

console.log('push-utils tests passed');
