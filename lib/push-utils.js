export function extractExpiredEndpoints(results) {
    if (!Array.isArray(results)) return [];
    return results.filter(r => r && r.expired).map(r => r.endpoint).filter(Boolean);
}

export default extractExpiredEndpoints;
