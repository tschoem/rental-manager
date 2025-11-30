import ical from 'node-ical';

export async function getBlockedDates(icalUrl: string): Promise<Date[]> {
    if (!icalUrl) return [];

    try {
        const data = await ical.async.fromURL(icalUrl);
        const blockedDates: Date[] = [];

        for (const k in data) {
            const event = data[k];
            if (event.type === 'VEVENT' && event.start && event.end) {
                // Add all dates between start and end
                let current = new Date(event.start);
                const end = new Date(event.end);

                while (current < end) {
                    blockedDates.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
            }
        }
        return blockedDates;
    } catch (e) {
        console.error("Failed to parse iCal", e);
        return [];
    }
}
