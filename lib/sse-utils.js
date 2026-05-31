export function getTokenFromUrlAndHeaders(urlString, headers = {}) {
    try {
        const url = new URL(urlString);
        let token = url.searchParams.get('token');
        if (!token) {
            const auth = headers['authorization'] || headers['Authorization'];
            if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
        }
        return token || null;
    } catch (e) {
        return null;
    }
}

export default getTokenFromUrlAndHeaders;
