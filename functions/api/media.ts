// functions/api/media.ts
// 媒体文件上传和管理 API

import { json, error, success } from '../utils/response';
import { getDb } from '../utils/db';

export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
}

// 生成预签名上传 URL
// POST /api/media/presign
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { filename, contentType } = body;
    
    if (!filename || !contentType) {
      return error('缺少必要参数', 400);
    }
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop();
    const key = `uploads/${timestamp}-${random}.${extension}`;
    
    // 生成预签名 URL（15分钟有效）
    const signedUrl = await env.MEDIA_BUCKET.createSignedUrl(key, {
      method: 'PUT',
      expiresIn: 900, // 15分钟
      customMetadata: {
        'content-type': contentType,
        'original-filename': filename
      }
    });
    
    // 计算公共访问 URL
    const publicUrl = `${env.R2_PUBLIC_URL || ''}/${key}`;
    
    return success({
      uploadUrl: signedUrl,
      key,
      publicUrl,
      expiresAt: new Date(Date.now() + 900 * 1000).toISOString()
    });
    
  } catch (err) {
    console.error('Presign error:', err);
    return error('生成上传链接失败', 500);
  }
}

// 确认上传完成并记录到数据库
// PUT /api/media/confirm
export async function onRequestPut(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { key, filename, contentType, size, width, height, altText } = body;
    
    // 验证文件是否存在于 R2
    const object = await env.MEDIA_BUCKET.head(key);
    if (!object) {
      return error('文件未找到', 404);
    }
    
    const db = getDb(env.DB);
    const publicUrl = `${env.R2_PUBLIC_URL || ''}/${key}`;
    
    // 插入数据库记录
    const mediaId = await db.prepare(`
      INSERT INTO media (filename, original_name, r2_key, r2_url, content_type, 
                        size_bytes, width, height, alt_text, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      filename,
      filename,
      key,
      publicUrl,
      contentType,
      size,
      width || null,
      height || null,
      altText || '',
      1 // 默认用户ID，实际应从认证信息获取
    ).run();
    
    return success({
      id: mediaId.meta.last_row_id,
      url: publicUrl,
      key
    }, '上传成功');
    
  } catch (err) {
    console.error('Confirm upload error:', err);
    return error('确认上传失败', 500);
  }
}

// 获取媒体列表
// GET /api/media
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    const db = getDb(env.DB);
    
    const [media, countResult] = await Promise.all([
      db.prepare(`
        SELECT m.*, u.name as uploaded_by_name
        FROM media m
        LEFT JOIN users u ON m.created_by = u.id
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all(),
      
      db.prepare('SELECT COUNT(*) as total FROM media').first()
    ]);
    
    const total = (countResult as any)?.total || 0;
    
    return success({
      media: media.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (err) {
    console.error('Get media error:', err);
    return error('获取媒体列表失败', 500);
  }
}
