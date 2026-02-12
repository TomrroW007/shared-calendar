
export async function fetchAndParseICS(url) {
    if (!url) return [];

    // Filter invalid URLs
    try {
        new URL(url);
    } catch (e) {
        return [];
    }

    try {
        const ical = (await import('node-ical')).default || (await import('node-ical'));
        // Check if async interface exists on default export or direct export
        const fromURL = ical.async?.fromURL || ical.fromURL;

        if (!fromURL) {
            console.error('node-ical fromURL not found');
            return [];
        }

        const events = await fromURL(url);
        const parsedEvents = [];

        for (const k in events) {
            const ev = events[k];
            if (ev.type === 'VEVENT') {
                // Formatting
                parsedEvents.push({
                    title: 'Busy', // Privacy first: Always "Busy"
                    description: '', // Hidden
                    start_date: new Date(ev.start),
                    end_date: new Date(ev.end),
                    visibility: 'status_only',
                    status: 'busy',
                    source: 'external',
                    original_data: ev // Optional debug
                });
            }
        }
        return parsedEvents;

    } catch (error) {
        console.error(`Failed to fetch ICS ${url}:`, error);
        return [];
    }
}
