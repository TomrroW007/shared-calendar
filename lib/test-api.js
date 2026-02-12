// 简单测试API响应
async function testAPI() {
    console.log('测试 timor.tech API...\n');
    
    try {
        const url = 'https://timor.tech/api/holiday/year/2026';
        console.log('请求URL:', url);
        
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
        });
        
        console.log('状态码:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        const text = await response.text();
        console.log('\n原始响应:');
        console.log(text.substring(0, 500)); // 只显示前500字符
        
        try {
            const data = JSON.parse(text);
            console.log('\n解析后的JSON (部分):');
            console.log(JSON.stringify(data, null, 2).substring(0, 1000));
        } catch (e) {
            console.log('JSON解析失败:', e.message);
        }
    } catch (error) {
        console.error('请求失败:', error.message);
    }
}

testAPI();
