// functions/api/posts.ts
// 文章列表和详情 API

import { json, error } from '../utils/response';
import { getDb } from '../utils/db';

export interface Env {
  DB: D1Database;
}

// GET /api/posts - 获取文章列表
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 获取查询参数
  const category = url.searchParams.get('category') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  
  try {
    const db = getDb(env.DB);
    
    let query = `
      SELECT p.*, u.name as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.status = 'published'
    `;
    let countQuery = `SELECT COUNT(*) as total FROM posts WHERE status = 'published'`;
    const params: any[] = [];
    
    // 分类筛选
    if (category !== 'all') {
      query += ` AND p.category = ?`;
      countQuery += ` AND category = ?`;
      params.push(category);
    }
    
    // 排序和分页
    query += ` ORDER BY p.published_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    // 并行执行查询
    const [posts, countResult] = await Promise.all([
      db.prepare(query).bind(...params).all(),
      db.prepare(countQuery).bind(...(category !== 'all' ? [category] : [])).first()
    ]);
    
    const total = (countResult as any)?.total || 0;
    
    return json({
      posts: posts.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (err) {
    console.error('Database error:', err);
    return error('获取文章失败', 500);
  }
}
