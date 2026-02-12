import type { NewsItem, NewsCategory } from '@/types/news';

// GNews API 配置
const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY || '97efbfef470aed16b8fd705cf76df442';
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

// 分类关键词映射
const CATEGORY_KEYWORDS: Record<NewsCategory, string> = {
  ai: 'artificial intelligence OR AI OR ChatGPT OR OpenAI OR machine learning',
  tech: 'technology OR tech OR software OR hardware OR smartphone OR computer',
  finance: 'finance OR economy OR stock market OR investment OR banking OR cryptocurrency',
  breaking: 'breaking news OR urgent OR latest',
  all: 'artificial intelligence OR technology OR finance'
};

// 备用模拟数据（API 失败时使用）
const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'OpenAI发布GPT-5：多模态能力实现质的飞跃',
    summary: 'OpenAI今日正式发布GPT-5模型，在推理能力、代码生成和多模态理解方面实现重大突破，支持更长的上下文窗口。',
    category: 'ai',
    author: '张明',
    source: 'AI前沿',
    publishedAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    url: '#',
    isBreaking: true
  },
  {
    id: '2',
    title: '全球股市大涨：科技股领涨纳斯达克创新高',
    summary: '受美联储降息预期影响，全球股市今日普遍上涨，纳斯达克指数创下历史新高，苹果、微软等科技巨头股价大涨。',
    category: 'finance',
    author: '李华',
    source: '财经日报',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    url: '#',
    isBreaking: true
  },
  {
    id: '3',
    title: '量子计算突破：谷歌实现1000量子比特处理器',
    summary: '谷歌量子AI团队宣布成功研发出1000量子比特处理器，量子纠错能力大幅提升，商业化应用指日可待。',
    category: 'tech',
    author: '王强',
    source: '科技周刊',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
    url: '#'
  },
  {
    id: '4',
    title: '突发：国际气候峰会达成历史性协议',
    summary: '经过两周激烈谈判，各国代表终于在减排目标和气候资金方面达成共识，承诺2030年前实现碳排放峰值。',
    category: 'breaking',
    author: '陈静',
    source: '国际新闻',
    publishedAt: new Date(Date.now() - 1800000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800&q=80',
    url: '#',
    isBreaking: true
  }
];

class NewsService {
  private static instance: NewsService;
  private cache: Map<NewsCategory, NewsItem[]> = new Map();
  private lastFetchTime: Date | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存

  private constructor() {}

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  // 从 GNews API 获取新闻
  private async fetchFromGNews(category: NewsCategory = 'all'): Promise<NewsItem[]> {
    try {
      const query = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.all;
      const url = `${GNEWS_BASE_URL}/search?q=${encodeURIComponent(query)}&lang=en&max=20&apikey=${GNEWS_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`GNews API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.articles || !Array.isArray(data.articles)) {
        throw new Error('Invalid response format');
      }
      
      return data.articles.map((article: any, index: number) => this.transformGNewsArticle(article, index, category));
    } catch (error) {
      console.error('GNews API fetch failed:', error);
      throw error;
    }
  }

  // 转换 GNews 文章格式
  private transformGNewsArticle(article: any, index: number, category: NewsCategory): NewsItem {
    // 根据内容智能分类
    const content = (article.title + ' ' + article.description).toLowerCase();
    let smartCategory = category;
    
    if (category === 'all') {
      if (content.includes('ai') || content.includes('artificial intelligence') || content.includes('chatgpt') || content.includes('openai') || content.includes('machine learning')) {
        smartCategory = 'ai';
      } else if (content.includes('stock') || content.includes('finance') || content.includes('economy') || content.includes('market') || content.includes('bank') || content.includes('crypto')) {
        smartCategory = 'finance';
      } else if (content.includes('breaking') || content.includes('urgent') || content.includes('alert')) {
        smartCategory = 'breaking';
      } else {
        smartCategory = 'tech';
      }
    }

    return {
      id: `gnews-${Date.now()}-${index}`,
      title: article.title || '无标题',
      summary: article.description || article.content?.slice(0, 200) || '暂无摘要',
      content: article.content || article.description || '',
      category: smartCategory,
      author: article.source?.name || '未知来源',
      source: article.source?.name || 'GNews',
      publishedAt: article.publishedAt || new Date().toISOString(),
      imageUrl: article.image || `https://picsum.photos/800/400?random=${index}`,
      url: article.url || '#',
      isBreaking: smartCategory === 'breaking' || this.isBreakingNews(article.title)
    };
  }

  // 判断是否为突发新闻
  private isBreakingNews(title: string): boolean {
    const breakingKeywords = ['breaking', 'urgent', 'alert', '突发', '紧急', '速报'];
    return breakingKeywords.some(keyword => title.toLowerCase().includes(keyword.toLowerCase()));
  }

  // 获取新闻列表
  async fetchNews(category?: NewsCategory, forceRefresh = false): Promise<NewsItem[]> {
    const targetCategory = category || 'all';
    
    // 检查缓存
    if (!forceRefresh) {
      const cached = this.cache.get(targetCategory);
      if (cached && cached.length > 0 && this.lastFetchTime) {
        const now = new Date();
        const cacheAge = now.getTime() - this.lastFetchTime.getTime();
        if (cacheAge < this.CACHE_DURATION) {
          console.log('Using cached news');
          return this.filterByCategory(cached, category);
        }
      }
    }

    try {
      // 尝试从 GNews API 获取
      const news = await this.fetchFromGNews(targetCategory);
      
      if (news.length > 0) {
        this.cache.set(targetCategory, news);
        this.lastFetchTime = new Date();
        return this.filterByCategory(news, category);
      }
    } catch (error) {
      console.error('Failed to fetch from GNews, using fallback:', error);
    }

    // 如果 API 失败，使用备用数据
    console.log('Using mock news data');
    this.cache.set('all', MOCK_NEWS);
    this.lastFetchTime = new Date();
    return this.filterByCategory(MOCK_NEWS, category);
  }

  // 根据分类过滤
  private filterByCategory(news: NewsItem[], category?: NewsCategory): NewsItem[] {
    if (!category || category === 'all') {
      return news;
    }
    return news.filter(item => item.category === category);
  }

  // 获取突发新闻
  async fetchBreakingNews(): Promise<NewsItem[]> {
    const allNews = await this.fetchNews('all');
    return allNews.filter(item => item.isBreaking);
  }

  // 获取单条新闻
  async getNewsById(id: string): Promise<NewsItem | null> {
    // 尝试从缓存中查找
    for (const [_, newsList] of this.cache) {
      const found = newsList.find(item => item.id === id);
      if (found) return found;
    }
    
    // 如果没有找到，重新获取
    const allNews = await this.fetchNews('all');
    return allNews.find(item => item.id === id) || null;
  }

  // 搜索新闻
  async searchNews(query: string): Promise<NewsItem[]> {
    try {
      // 使用 GNews 搜索 API
      const url = `${GNEWS_BASE_URL}/search?q=${encodeURIComponent(query)}&lang=en&max=20&apikey=${GNEWS_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.articles || !Array.isArray(data.articles)) {
        return [];
      }
      
      return data.articles.map((article: any, index: number) => this.transformGNewsArticle(article, index, 'all'));
    } catch (error) {
      console.error('Search failed:', error);
      // 回退到本地搜索
      const allNews = await this.fetchNews('all');
      const lowerQuery = query.toLowerCase();
      return allNews.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.summary.toLowerCase().includes(lowerQuery)
      );
    }
  }

  // 获取最后更新时间
  getLastUpdated(): Date | null {
    return this.lastFetchTime;
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear();
    this.lastFetchTime = null;
  }
}

export const newsService = NewsService.getInstance();
