# News Hub - Cloudflare 全栈架构

基于 Cloudflare 生态的现代化新闻 CMS 系统架构方案。

## 架构图

```
用户 → Cloudflare CDN → Pages (前端) → Functions (API) → D1/R2 (数据)
                    ↓
              Zero Trust (管理员认证)
```

## 核心服务

| 服务 | 用途 | 免费额度 |
|------|------|----------|
| **Pages** | 前端托管 | 无限请求 |
| **Functions** | 后端 API | 10万次/天 |
| **D1** | SQLite 数据库 | 500万读取/天 |
| **R2** | 对象存储 | 10GB |
| **Zero Trust** | 身份验证 | 50用户 |

## 项目结构

```
news-aggregator/
├── ARCHITECTURE.md          # 详细架构文档
├── frontend/                # 前端 (Pages)
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/           # 页面
│   │   └── api/             # API 客户端
│   └── wrangler.toml
├── functions/               # 后端 API
│   ├── api/                 # API 路由
│   │   ├── posts.ts         # 文章 API
│   │   ├── media.ts         # 媒体上传
│   │   └── admin/           # 管理后台 API
│   ├── utils/               # 工具函数
│   │   ├── db.ts            # D1 数据库
│   │   └── response.ts      # 响应封装
│   └── wrangler.toml
├── admin-panel/             # 管理后台
│   └── src/
├── database/
│   └── schema.sql           # 数据库结构
└── .github/workflows/
    └── deploy.yml           # CI/CD 配置
```

## 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/jwang287/news-hub.git
cd news-hub
```

### 2. 配置环境
```bash
# 创建 D1 数据库
cd functions
wrangler d1 create news-db
# 复制 database_id 到 wrangler.toml

# 创建 R2 存储桶
wrangler r2 bucket create news-media

# 执行数据库迁移
wrangler d1 execute news-db --file=../database/schema.sql
```

### 3. 部署
```bash
# 部署前端
cd frontend
npm install
npm run build
wrangler pages deploy dist

# 部署后端
cd ../functions
wrangler deploy
```

### 4. 配置 Zero Trust
- 登录 Cloudflare Dashboard
- 进入 Zero Trust → Access
- 创建 Application
- 绑定域名: `admin.your-domain.com`
- 配置身份提供商 (Google/GitHub)

## 数据流

### 内容发布流程
1. 管理员登录 (Zero Trust 认证)
2. 上传媒体 → R2 (预签名 URL)
3. 填写内容 → Functions API
4. 写入 D1 数据库
5. 前端通过 CDN 读取

### 媒体处理
```
上传 → Cloudflare Images (优化) → R2 存储 → D1 记录元数据
```

## 成本估算

小流量网站（<10万访问/月）：**完全免费**

| 项目 | 免费额度 | 预估用量 |
|------|----------|----------|
| Pages | 无限 | 10万请求 |
| Functions | 10万/天 | 5万/天 |
| R2 | 10GB | 5GB |
| D1 | 500万读取/天 | 100万/天 |
| Zero Trust | 50用户 | 10用户 |

## API 端点

### 公共 API
- `GET /api/posts` - 文章列表
- `GET /api/posts/:slug` - 文章详情
- `GET /api/categories` - 分类列表

### 管理 API (需认证)
- `POST /api/admin/posts` - 创建文章
- `PUT /api/admin/posts/:id` - 更新文章
- `POST /api/media/presign` - 获取上传 URL
- `PUT /api/media/confirm` - 确认上传

## 特性

- 🌍 全球边缘部署，延迟 < 50ms
- 🔒 内置 DDoS 防护和 WAF
- 💾 自动扩缩容，无需运维
- 📱 响应式设计，支持 PWA
- 🚀 自动 CI/CD 部署
- 💰 小项目零成本

## 后续优化

- [ ] 添加全文搜索 (Algolia/Typesense)
- [ ] 实现实时通知 (WebSocket)
- [ ] 添加分析统计 (Plausible)
- [ ] 支持多语言 (i18n)
- [ ] 实现 SSR 优化 SEO

## 文档

- [详细架构设计](./ARCHITECTURE.md)
- [前端开发指南](./frontend/README.md)
- [API 文档](./functions/README.md)

## License

MIT
