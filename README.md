# News Hub - 个人新闻聚合平台

一个部署在 Cloudflare Pages 上的安全新闻聚合网站，支持密码保护、防暴力破解、自动更新等功能。

## 功能特性

- 🔐 **密码保护**：全局密码 `465375`，输错3次锁定3分钟
- 📱 **响应式设计**：完美适配移动端和桌面端
- 🌙 **暗色模式**：支持手动切换主题
- 📰 **四大模块**：AI前沿、科技动态、财经要闻、突发新闻
- ⚡ **自动更新**：每小时通过 Cron 自动抓取新闻
- 💾 **本地缓存**：使用 Cloudflare KV 缓存新闻内容

## 项目结构

```
news-aggregator/
├── index.html              # 主页面（含密码验证）
├── styles.css              # 样式（含暗色模式）
├── app.js                  # 前端交互逻辑
├── functions/
│   ├── api/
│   │   └── news.js         # 新闻 API 端点
│   └── scheduled.js        # 定时更新任务
├── wrangler.toml           # Cloudflare 配置
└── README.md               # 部署文档
```

## 部署步骤

### 1. 准备工作

确保已安装：
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare 账号

```bash
npm install -g wrangler
wrangler login
```

### 2. 创建 KV 命名空间

```bash
# 创建 KV
wrangler kv:namespace create "NEWS_KV"

# 复制输出中的 ID，更新 wrangler.toml
```

### 3. 更新配置

编辑 `wrangler.toml`，填入你的 KV ID：

```toml
[[kv_namespaces]]
binding = "NEWS_KV"
id = "your_kv_namespace_id_here"  # 替换为实际的 ID
```

### 4. 部署到 Cloudflare Pages

```bash
# 进入项目目录
cd news-aggregator

# 部署
wrangler pages deploy . --project-name=news-hub

# 或使用 Git 集成（推荐）
git init
git add .
git commit -m "Initial commit"
git push origin main
```

### 5. 配置 Git 集成（自动部署）

1. 将代码推送到 GitHub
2. 在 Cloudflare Dashboard → Pages → 创建项目
3. 选择 GitHub 仓库
4. 构建设置：
   - 构建命令：（留空，静态站点）
   - 输出目录：`/`
5. 添加环境变量和 KV 绑定

### 6. 配置定时任务

在 Cloudflare Dashboard → Workers & Pages → 你的项目 → Settings → Triggers

添加 Cron Trigger：
```
0 * * * *  （每小时执行）
```

## 自定义配置

### 修改密码

编辑 `app.js`：
```javascript
const CONFIG = {
    PASSWORD: '你的新密码',  // 修改这里
    // ...
};
```

### 添加新闻源

编辑 `functions/api/news.js`，在 `sources` 对象中添加：

```javascript
const sources = {
    ai: [
        { name: '新源名称', url: 'https://example.com/rss' },
        // ...
    ],
    // ...
};
```

### 自定义样式

编辑 `styles.css`，修改 CSS 变量：

```css
:root {
    --primary: #4f46e5;        /* 主题色 */
    --urgent: #dc2626;         /* 紧急色 */
    --bg: #fafafa;             /* 背景色 */
    --surface: #ffffff;        /* 卡片色 */
    --text: #1f2937;           /* 文字色 */
}
```

## API 说明

### 获取新闻

```
GET /api/news?category=all&force=0
```

参数：
- `category`: 分类（all/ai/tech/finance/breaking）
- `force`: 是否强制刷新（0/1）

返回：
```json
{
    "news": [
        {
            "id": "unique-id",
            "title": "新闻标题",
            "summary": "摘要",
            "content": "完整内容",
            "url": "原文链接",
            "source": "来源",
            "category": "ai",
            "publishedAt": "2024-01-01T00:00:00Z"
        }
    ],
    "lastUpdate": "2024-01-01T00:00:00Z",
    "count": 10
}
```

## 安全说明

1. **密码验证**：前端 JavaScript 验证，同时建议配合 Cloudflare Access
2. **防暴力破解**：localStorage 记录失败次数，3次错误锁定3分钟
3. **会话保持**：验证通过后24小时内无需重复输入
4. **CSP 策略**：已配置内容安全策略防止 XSS

## 注意事项

1. RSS 抓取使用代理服务（allorigins.win, r.jina.ai），可能有时效限制
2. 建议添加自己的 RSSHub 实例以获得更稳定的抓取
3. 突发新闻需要手动标记或从特定源识别
4. 图片懒加载和虚拟滚动在大数据量时优化性能

## License

MIT
