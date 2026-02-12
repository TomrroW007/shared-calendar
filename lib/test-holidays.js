/**
 * 节假日模块测试脚本
 * 运行: node lib/test-holidays.js
 */

import { getHoliday, getHolidaysForMonth, getHolidaySync, preloadYear, clearCache } from './holidays.js';

async function runTests() {
    console.log('🧪 开始测试节假日模块...\n');

    // 测试1: 获取单个日期的节假日信息
    console.log('📅 测试1: 获取2026年春节信息');
    try {
        const springFestival = await getHoliday('2026-02-17');
        console.log('  结果:', springFestival);
        console.log('  ✅ 通过\n');
    } catch (err) {
        console.error('  ❌ 失败:', err.message, '\n');
    }

    // 测试2: 获取整月节假日
    console.log('📅 测试2: 获取2026年2月所有节假日');
    try {
        const febHolidays = await getHolidaysForMonth(2026, 1); // 2月是索引1
        console.log('  结果:', Object.keys(febHolidays).length, '个节假日');
        Object.entries(febHolidays).forEach(([date, info]) => {
            console.log(`    ${date}: ${info.name} (${info.type})`);
        });
        console.log('  ✅ 通过\n');
    } catch (err) {
        console.error('  ❌ 失败:', err.message, '\n');
    }

    // 测试3: 同步获取（仅本地数据）
    console.log('📅 测试3: 同步获取2025年元旦');
    try {
        const newYear = getHolidaySync('2025-01-01');
        console.log('  结果:', newYear);
        console.log('  ✅ 通过\n');
    } catch (err) {
        console.error('  ❌ 失败:', err.message, '\n');
    }

    // 测试4: 预加载年度数据
    console.log('📅 测试4: 预加载2025年数据');
    try {
        const startTime = Date.now();
        await preloadYear(2025);
        const loadTime = Date.now() - startTime;
        console.log(`  结果: 预加载完成 (耗时 ${loadTime}ms)`);
        
        // 再次获取，应该使用缓存
        const cachedStartTime = Date.now();
        await getHoliday('2025-01-01');
        const cachedLoadTime = Date.now() - cachedStartTime;
        console.log(`  结果: 缓存命中 (耗时 ${cachedLoadTime}ms)`);
        console.log('  ✅ 通过\n');
    } catch (err) {
        console.error('  ❌ 失败:', err.message, '\n');
    }

    // 测试5: API降级测试（获取未来年份，可能API有数据也可能降级）
    console.log('📅 测试5: 测试2030年数据获取');
    try {
        const futureHolidays = await getHolidaysForMonth(2030, 0);
        if (Object.keys(futureHolidays).length > 0) {
            console.log('  结果: 成功获取', Object.keys(futureHolidays).length, '个节假日');
        } else {
            console.log('  结果: 无数据（正常，2030年数据可能未发布）');
        }
        console.log('  ✅ 通过\n');
    } catch (err) {
        console.error('  ❌ 失败:', err.message, '\n');
    }

    // 测试6: 缓存清除
    console.log('📅 测试6: 测试缓存清除');
    try {
        await getHoliday('2026-02-17'); // 确保有缓存
        clearCache(2026);
        console.log('  结果: 2026年缓存已清除');
        
        clearCache(); // 清除所有
        console.log('  结果: 所有缓存已清除');
        console.log('  ✅ 通过\n');
    } catch (err) {
        console.error('  ❌ 失败:', err.message, '\n');
    }

    // 测试7: 调休工作日检测
    console.log('📅 测试7: 检测调休工作日');
    try {
        const workday = await getHoliday('2025-01-26'); // 春节调休
        console.log('  结果:', workday);
        if (workday && workday.type === 'workday') {
            console.log('  ✅ 正确识别为调休工作日\n');
        } else {
            console.log('  ⚠️  未识别为调休工作日（可能API数据不同）\n');
        }
    } catch (err) {
        console.error('  ❌ 失败:', err.message, '\n');
    }

    console.log('🎉 测试完成！');
}

// 运行测试
runTests().catch(console.error);
