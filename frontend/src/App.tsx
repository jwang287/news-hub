import { useState, useEffect } from 'react'
import { Newspaper, Cloud, Database, Shield, Github } from 'lucide-react'

interface Post {
  id: number
  title: string
  summary: string
  category: string
  source: string
  publishedAt: string
}

function App() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟从 API 获取数据
    setTimeout(() => {
      setPosts([
        { id: 1, title: 'OpenAI 发布 GPT-5', summary: '新一代大语言模型带来突破性进展...', category: 'AI', source: 'TechCrunch', publishedAt: '2026-02-12' },
        { id: 2, title: 'Cloudflare 推出新功能', summary: '边缘计算能力再升级...', category: 'Tech', source: 'Cloudflare Blog', publishedAt: '2026-02-11' },
        { id: 3, title: '全球股市创新高', summary: '科技股领涨，纳斯达克突破...', category: 'Finance', source: 'Bloomberg', publishedAt: '2026-02-10' }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Newspaper className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">News Hub</h1>
          </div>
          <a 
            href="https://github.com/jwang287/news-hub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <section className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Cloudflare 全栈 CMS
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            基于 Pages + Functions + D1 + R2 + Zero Trust 构建的现代化新闻系统
          </p>
        </section>

        {/* Tech Stack */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Cloud, name: 'Pages', desc: '前端托管' },
            { icon: Database, name: 'D1 + R2', desc: '数据存储' },
            { icon: Shield, name: 'Zero Trust', desc: '身份验证' },
            { icon: Github, name: 'Actions', desc: '自动部署' }
          ].map((tech) => (
            <div key={tech.name} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center hover:bg-slate-800 transition-colors">
              <tech.icon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <h3 className="font-semibold">{tech.name}</h3>
              <p className="text-sm text-slate-400">{tech.desc}</p>
            </div>
          ))}
        </section>

        {/* News List */}
        <section>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="w-6 h-6" />
            最新资讯
          </h3>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <article key={post.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                    <span className="text-slate-500 text-sm">{post.publishedAt}</span>
                  </div>
                  <h4 className="text-xl font-bold mb-2 hover:text-blue-400 transition-colors">{post.title}</h4>
                  <p className="text-slate-400 mb-3">{post.summary}</p>
                  <span className="text-sm text-slate-500">来源: {post.source}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Status */}
        <section className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            系统运行正常 | Powered by Cloudflare
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-700/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500">
          <p>© 2026 News Hub - Cloudflare Full Stack Demo</p>
        </div>
      </footer>
    </div>
  )
}

export default App
