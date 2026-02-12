/**
 * Cloudflare Scheduled Function - 定时更新新闻
 * 每小时执行一次，预抓取新闻到 KV
 */

export default {
  async scheduled(controller, env, ctx) {
    console.log('开始定时更新新闻...', new Date().toISOString());
    
    const categories = ['all', 'ai', 'tech', 'finance', 'breaking'];
    
    for (const category of categories) {
      try {
        // 调用新闻 API
        const request = new Request(`https://${env.DOMAIN}/api/news?category=${category}&force=1`);
        
        const response = await fetch(request);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✓ ${category}: 更新 ${data.news?.length || 0} 条新闻`);
        } else {
          console.error(`✗ ${category}: 更新失败`, response.status);
        }
        
        // 添加小延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`✗ ${category}: 错误`, error.message);
      }
    }
    
    console.log('定时更新完成');
  }
};
