// functions/api/index.ts
// API 入口 - 路由分发

import { corsPreflight, json } from '../utils/response';

export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return corsPreflight();
    }
    
    // 健康检查
    if (path === '/api/health') {
      return json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
    
    // 路由分发
    try {
      // 文章 API
      if (path.startsWith('/api/posts')) {
        const postsModule = await import('./posts');
        return await postsModule.onRequestGet({ request, env });
      }
      
      // 媒体 API
      if (path.startsWith('/api/media')) {
        const mediaModule = await import('./media');
        if (request.method === 'POST') {
          return await mediaModule.onRequestPost({ request, env });
        }
        if (request.method === 'GET') {
          return await mediaModule.onRequestGet({ request, env });
        }
      }
      
      // 分类 API
      if (path === '/api/categories') {
        const db = env.DB;
        const { results } = await db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
        return json({ categories: results });
      }
      
      return json({ error: 'Not found' }, 404);
      
    } catch (err) {
      console.error('API Error:', err);
      return json({ error: 'Internal server error' }, 500);
    }
  }
};
