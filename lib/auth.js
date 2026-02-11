import { readDb } from './db';

export function getUserByToken(token) {
    if (!token) return null;
    const db = readDb();
    const user = db.users.find(u => u.token === token);
    if (!user) return null;
    const { token: _, ...userWithoutToken } = user;
    return userWithoutToken;
}

export function getAuthUser(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.slice(7);
    return getUserByToken(token);
}
