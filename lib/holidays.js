/**
 * Chinese National Holidays (法定节假日)
 * 
 * 混合数据源方案：
 * 1. 优先使用免费API（timor.tech）获取最新数据
 * 2. API失败时降级使用本地备份数据
 * 3. 内存缓存机制，避免频繁请求
 * 4. 自动覆盖所有年份
 * 
 * Format: { "YYYY-MM-DD": { name, type } }
 *   type: "holiday" = public holiday, "workday" = makeup workday (调休上班)
 */

// ============ 缓存配置 ============
const cache = {
    data: {}, // { year: { "YYYY-MM-DD": { name, type } } }
    timestamp: {}, // { year: timestamp }
    ttl: 24 * 60 * 60 * 1000, // 缓存24小时
};

// ============ 本地备份数据（降级使用）============
const FALLBACK_DATA = {
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
    "2025-10-04": { name: "国庆节", type: "holiday" },
    "2025-10-05": { name: "国庆节", type: "holiday" },
    "2025-10-06": { name: "中秋节", type: "holiday" },
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

// ============ API 数据获取 ============

/**
 * 从 API 获取指定年份的节假日数据
 * @param {number} year 
 * @returns {Promise<Object>} { "YYYY-MM-DD": { name, type } }
 */
async function fetchHolidaysFromAPI(year) {
    try {
        const response = await fetch(`https://timor.tech/api/holiday/year/${year}`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000), // 5秒超时
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        
        // API数据格式检查
        if (data.code !== 0 || !data.holiday) {
            throw new Error('Invalid API response format');
        }

        // 转换 API 数据格式为本地格式
        // API返回: { "01-01": { holiday: true, name: "元旦", wage: 3 } }
        // 需要转换为: { "2026-01-01": { name: "元旦", type: "holiday" } }
        const holidays = {};
        Object.entries(data.holiday).forEach(([mmdd, info]) => {
            const fullDate = `${year}-${mmdd}`; // 拼接成 YYYY-MM-DD
            
            if (info.holiday) {
                // holiday: true 表示放假
                holidays[fullDate] = {
                    name: info.name || "节假日",
                    type: "holiday"
                };
            } else if (info.wage === 1) {
                // wage: 1 表示调休上班
                holidays[fullDate] = {
                    name: info.name || "调休",
                    type: "workday"
                };
            }
        });

        return holidays;
    } catch (error) {
        console.warn(`[Holiday API] 获取${year}年数据失败:`, error.message);
        return null;
    }
}

/**
 * 获取指定年份的节假日数据（带缓存和降级）
 * @param {number} year 
 * @returns {Promise<Object>}
 */
async function getYearHolidays(year) {
    // 1. 检查缓存
    const now = Date.now();
    if (cache.data[year] && cache.timestamp[year]) {
        const age = now - cache.timestamp[year];
        if (age < cache.ttl) {
            return cache.data[year];
        }
    }

    // 2. 尝试从 API 获取
    const apiData = await fetchHolidaysFromAPI(year);
    if (apiData && Object.keys(apiData).length > 0) {
        cache.data[year] = apiData;
        cache.timestamp[year] = now;
        return apiData;
    }

    // 3. 降级使用本地备份数据
    const fallbackData = {};
    const prefix = `${year}-`;
    for (const [date, info] of Object.entries(FALLBACK_DATA)) {
        if (date.startsWith(prefix)) {
            fallbackData[date] = info;
        }
    }

    // 如果找到备份数据，缓存它
    if (Object.keys(fallbackData).length > 0) {
        cache.data[year] = fallbackData;
        cache.timestamp[year] = now;
        return fallbackData;
    }

    // 4. 完全没有数据
    return {};
}

// ============ 公开 API ============

/**
 * 获取指定日期的节假日信息
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {Promise<{ name: string, type: 'holiday' | 'workday' } | null>}
 */
export async function getHoliday(dateStr) {
    const year = parseInt(dateStr.split('-')[0]);
    if (isNaN(year)) return null;

    const yearData = await getYearHolidays(year);
    return yearData[dateStr] || null;
}

/**
 * 获取指定年月的所有节假日
 * @param {number} year 
 * @param {number} month - 0-indexed (0=Jan)
 * @returns {Promise<Object>} { "YYYY-MM-DD": { name, type } }
 */
export async function getHolidaysForMonth(year, month) {
    const yearData = await getYearHolidays(year);
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    const result = {};
    for (const [date, info] of Object.entries(yearData)) {
        if (date.startsWith(prefix)) {
            result[date] = info;
        }
    }
    return result;
}

/**
 * 同步方式获取节假日信息（仅使用本地备份数据）
 * @param {string} dateStr 
 * @returns {{ name: string, type: 'holiday' | 'workday' } | null}
 */
export function getHolidaySync(dateStr) {
    return FALLBACK_DATA[dateStr] || null;
}

/**
 * 预加载指定年份的节假日数据
 * @param {number} year 
 */
export async function preloadYear(year) {
    await getYearHolidays(year);
}

/**
 * 清除缓存
 * @param {number} [year] - 指定年份，不传则清除所有
 */
export function clearCache(year) {
    if (year) {
        delete cache.data[year];
        delete cache.timestamp[year];
    } else {
        cache.data = {};
        cache.timestamp = {};
    }
}

export default {
    getHoliday,
    getHolidaysForMonth,
    getHolidaySync,
    preloadYear,
    clearCache,
};

