/**
 * Chinese National Holidays (法定节假日)
 * 
 * Coverage: 2025-2027
 * Based on State Council (国务院) announcements.
 * 
 * Format: { "YYYY-MM-DD": { name, type } }
 *   type: "holiday" = public holiday, "workday" = makeup workday (调休上班)
 */

const CHINESE_HOLIDAYS = {
    // ========== 2025 ==========
    // 元旦
    "2025-01-01": { name: "元旦", type: "holiday" },

    // 春节
    "2025-01-28": { name: "春节", type: "holiday" },
    "2025-01-29": { name: "春节", type: "holiday" },
    "2025-01-30": { name: "春节", type: "holiday" },
    "2025-01-31": { name: "春节", type: "holiday" },
    "2025-02-01": { name: "春节", type: "holiday" },
    "2025-02-02": { name: "春节", type: "holiday" },
    "2025-02-03": { name: "春节", type: "holiday" },
    "2025-02-04": { name: "春节", type: "holiday" },
    "2025-01-26": { name: "春节调休", type: "workday" },
    "2025-02-08": { name: "春节调休", type: "workday" },

    // 清明节
    "2025-04-04": { name: "清明节", type: "holiday" },
    "2025-04-05": { name: "清明节", type: "holiday" },
    "2025-04-06": { name: "清明节", type: "holiday" },

    // 劳动节
    "2025-05-01": { name: "劳动节", type: "holiday" },
    "2025-05-02": { name: "劳动节", type: "holiday" },
    "2025-05-03": { name: "劳动节", type: "holiday" },
    "2025-05-04": { name: "劳动节", type: "holiday" },
    "2025-05-05": { name: "劳动节", type: "holiday" },
    "2025-04-27": { name: "劳动节调休", type: "workday" },

    // 端午节
    "2025-05-31": { name: "端午节", type: "holiday" },
    "2025-06-01": { name: "端午节", type: "holiday" },
    "2025-06-02": { name: "端午节", type: "holiday" },

    // 中秋节 + 国庆节
    "2025-10-01": { name: "国庆节", type: "holiday" },
    "2025-10-02": { name: "国庆节", type: "holiday" },
    "2025-10-03": { name: "国庆节", type: "holiday" },
    "2025-10-04": { name: "中秋节", type: "holiday" },
    "2025-10-05": { name: "国庆节", type: "holiday" },
    "2025-10-06": { name: "国庆节", type: "holiday" },
    "2025-10-07": { name: "国庆节", type: "holiday" },
    "2025-10-08": { name: "国庆节", type: "holiday" },
    "2025-09-28": { name: "国庆调休", type: "workday" },
    "2025-10-11": { name: "国庆调休", type: "workday" },

    // ========== 2026 ==========
    // 元旦
    "2026-01-01": { name: "元旦", type: "holiday" },
    "2026-01-02": { name: "元旦", type: "holiday" },
    "2026-01-03": { name: "元旦", type: "holiday" },

    // 春节
    "2026-02-16": { name: "除夕", type: "holiday" },
    "2026-02-17": { name: "春节", type: "holiday" },
    "2026-02-18": { name: "春节", type: "holiday" },
    "2026-02-19": { name: "春节", type: "holiday" },
    "2026-02-20": { name: "春节", type: "holiday" },
    "2026-02-21": { name: "春节", type: "holiday" },
    "2026-02-22": { name: "春节", type: "holiday" },
    "2026-02-23": { name: "春节", type: "holiday" },

    // 清明节
    "2026-04-04": { name: "清明节", type: "holiday" },
    "2026-04-05": { name: "清明节", type: "holiday" },
    "2026-04-06": { name: "清明节", type: "holiday" },

    // 劳动节
    "2026-05-01": { name: "劳动节", type: "holiday" },
    "2026-05-02": { name: "劳动节", type: "holiday" },
    "2026-05-03": { name: "劳动节", type: "holiday" },
    "2026-05-04": { name: "劳动节", type: "holiday" },
    "2026-05-05": { name: "劳动节", type: "holiday" },

    // 端午节
    "2026-06-19": { name: "端午节", type: "holiday" },
    "2026-06-20": { name: "端午节", type: "holiday" },
    "2026-06-21": { name: "端午节", type: "holiday" },

    // 中秋节
    "2026-09-25": { name: "中秋节", type: "holiday" },
    "2026-09-26": { name: "中秋节", type: "holiday" },
    "2026-09-27": { name: "中秋节", type: "holiday" },

    // 国庆节
    "2026-10-01": { name: "国庆节", type: "holiday" },
    "2026-10-02": { name: "国庆节", type: "holiday" },
    "2026-10-03": { name: "国庆节", type: "holiday" },
    "2026-10-04": { name: "国庆节", type: "holiday" },
    "2026-10-05": { name: "国庆节", type: "holiday" },
    "2026-10-06": { name: "国庆节", type: "holiday" },
    "2026-10-07": { name: "国庆节", type: "holiday" },

    // ========== 2027 ==========
    // 元旦
    "2027-01-01": { name: "元旦", type: "holiday" },
    "2027-01-02": { name: "元旦", type: "holiday" },
    "2027-01-03": { name: "元旦", type: "holiday" },

    // 春节
    "2027-02-05": { name: "除夕", type: "holiday" },
    "2027-02-06": { name: "春节", type: "holiday" },
    "2027-02-07": { name: "春节", type: "holiday" },
    "2027-02-08": { name: "春节", type: "holiday" },
    "2027-02-09": { name: "春节", type: "holiday" },
    "2027-02-10": { name: "春节", type: "holiday" },
    "2027-02-11": { name: "春节", type: "holiday" },

    // 清明节
    "2027-04-04": { name: "清明节", type: "holiday" },
    "2027-04-05": { name: "清明节", type: "holiday" },
    "2027-04-06": { name: "清明节", type: "holiday" },

    // 劳动节
    "2027-05-01": { name: "劳动节", type: "holiday" },
    "2027-05-02": { name: "劳动节", type: "holiday" },
    "2027-05-03": { name: "劳动节", type: "holiday" },

    // 端午节
    "2027-06-09": { name: "端午节", type: "holiday" },

    // 中秋节
    "2027-09-15": { name: "中秋节", type: "holiday" },

    // 国庆节
    "2027-10-01": { name: "国庆节", type: "holiday" },
    "2027-10-02": { name: "国庆节", type: "holiday" },
    "2027-10-03": { name: "国庆节", type: "holiday" },
    "2027-10-04": { name: "国庆节", type: "holiday" },
    "2027-10-05": { name: "国庆节", type: "holiday" },
    "2027-10-06": { name: "国庆节", type: "holiday" },
    "2027-10-07": { name: "国庆节", type: "holiday" },
};

/**
 * Get holiday info for a date string (YYYY-MM-DD)
 * @returns {{ name: string, type: 'holiday' | 'workday' } | null}
 */
export function getHoliday(dateStr) {
    return CHINESE_HOLIDAYS[dateStr] || null;
}

/**
 * Get all holidays for a given year-month
 * @param {number} year 
 * @param {number} month - 0-indexed (0=Jan)
 * @returns {Object} { "YYYY-MM-DD": { name, type } }
 */
export function getHolidaysForMonth(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const result = {};
    for (const [date, info] of Object.entries(CHINESE_HOLIDAYS)) {
        if (date.startsWith(prefix)) {
            result[date] = info;
        }
    }
    return result;
}

export default CHINESE_HOLIDAYS;
