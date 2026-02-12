-- Cloudflare D1 Database Schema
-- 新闻 CMS 系统数据库结构

-- 文章表
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    summary TEXT,
    category TEXT DEFAULT 'tech',
    status TEXT DEFAULT 'draft', -- draft, published, archived
    author_id INTEGER,
    featured_image TEXT, -- R2 URL
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME
);

-- 媒体文件表
CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT,
    r2_key TEXT NOT NULL,
    r2_url TEXT NOT NULL,
    content_type TEXT,
    size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'viewer', -- viewer, editor, admin
    avatar_url TEXT,
    zero_trust_id TEXT,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0
);

-- 文章与媒体关联表
CREATE TABLE IF NOT EXISTS post_media (
    post_id INTEGER,
    media_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (post_id, media_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 插入默认分类
INSERT OR IGNORE INTO categories (name, slug, description, color, sort_order) VALUES
('人工智能', 'ai', 'AI 技术、大模型、机器学习相关新闻', '#8b5cf6', 1),
('科技创新', 'tech', '科技产品、互联网、硬件创新', '#3b82f6', 2),
('财经市场', 'finance', '股市、经济、投资、加密货币', '#10b981', 3),
('突发新闻', 'breaking', '紧急事件、突发报道', '#ef4444', 4);

-- 创建触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_posts_timestamp 
AFTER UPDATE ON posts
BEGIN
    UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
