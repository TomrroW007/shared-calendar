import { randomUUID } from 'crypto';

const TTL_MS = 60 * 1000; // 60 seconds

function getStore() {
    if (!globalThis.__sseEphemeralTokens) globalThis.__sseEphemeralTokens = new Map();
    return globalThis.__sseEphemeralTokens;
}

export function createEphemeralToken(userId, ttl = TTL_MS) {
    const token = randomUUID();
    const expiresAt = Date.now() + ttl;
    const store = getStore();
    store.set(token, { userId, expiresAt });
    // schedule cleanup
    setTimeout(() => {
        const cur = store.get(token);
        if (!cur) return;
        if (cur.expiresAt <= Date.now()) store.delete(token);
    }, ttl + 1000);
    return { token, expiresAt };
}

export function getUserIdForToken(token) {
    const store = getStore();
    const entry = store.get(token);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
        store.delete(token);
        return null;
    }
    return entry.userId;
}

export function clearAllEphemeralTokens() {
    const store = getStore();
    store.clear();
}

export default { createEphemeralToken, getUserIdForToken, clearAllEphemeralTokens };
