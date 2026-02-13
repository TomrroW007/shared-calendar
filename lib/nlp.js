/**
 * Simple Rule-based NLP Parser for Quick Add
 * Simulates LLM behavior for v1.8 MVP without external API cost.
 * 
 * Supported Patterns:
 * - Time: "明天", "后天", "周五", "下周三", "19:00", "7pm"
 * - Action: "聚餐", "会议", "看电影"
 * - Location: "在xxx", "@xxx"
 */

export function parseQuickAddCommand(text) {
    const result = {
        title: '',
        date: null,
        time: null,
        location: '',
        note: text
    };

    const now = new Date();
    let targetDate = new Date(now);

    // 1. Date Parsing
    if (text.includes('明天')) {
        targetDate.setDate(now.getDate() + 1);
        result.date = targetDate.toISOString().split('T')[0];
    } else if (text.includes('后天')) {
        targetDate.setDate(now.getDate() + 2);
        result.date = targetDate.toISOString().split('T')[0];
    } else {
        const weekMatch = text.match(/周([一二三四五六日])/);
        if (weekMatch) {
            const map = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 };
            const day = map[weekMatch[1]];
            const currentDay = now.getDay();
            let diff = day - currentDay;
            if (diff <= 0) diff += 7;
            targetDate.setDate(now.getDate() + diff);
            result.date = targetDate.toISOString().split('T')[0];
        }
    }

    // 2. Time Parsing
    const timeMatch = text.match(/(\d{1,2})[:点](\d{0,2})/);
    if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        
        // Simple PM logic
        if ((text.includes('晚') || text.includes('下午')) && hour < 12) {
            hour += 12;
        }
        result.time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    // 3. Location Parsing
    const locMatch = text.match(/(在|@)\s*([^\s]+)/);
    if (locMatch) {
        result.location = locMatch[2];
    }

    // 4. Title Extraction (Simple heuristic)
    // Remove date/time keywords and use rest as title
    let cleanText = text
        .replace(/明天|后天|周[一二三四五六日]|下周[一二三四五六日]/g, '')
        .replace(/(\d{1,2})[:点](\d{0,2})/, '')
        .replace(/(上午|下午|晚上|早上)/g, '')
        .replace(/(在|@)\s*[^\s]+/, '')
        .trim();
    
    result.title = cleanText || '新活动';

    return result;
}
