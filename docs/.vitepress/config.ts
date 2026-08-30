import path from 'node:path'
import { defineConfig } from 'vitepress'
import { buildRecentPosts } from './content'
import { configureDiagramsPlugin } from 'vitepress-plugin-diagrams'
import { buildSidebar } from './sidebar'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'blogs'
const base = process.env.VITEPRESS_BASE || `/${repositoryName}/`
const recentPosts = buildRecentPosts()

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function configureMermaidFence(md: any) {
  const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens: any[], idx: number, options: any, env: any, self: any) => {
    const token = tokens[idx]
    const language = token.info.trim().split(/\s+/)[0].toLowerCase()

    if (language === 'mermaid') {
      return `<div class="mermaid-diagram"><pre class="mermaid">${escapeHtml(token.content)}</pre></div>`
    }

    return defaultFence(tokens, idx, options, env, self)
  }
}

export default defineConfig({
  title: '技术博客与科研笔记',
  description: '技术博客与学习笔记，覆盖 AI、Java、数据库、分布式系统等领域。',
  base,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}icon-hxl.svg` }]
  ],
  markdown: {
    lineNumbers: true,
    math: true,
    toc: {
      level: [1, 2, 3]
    },
    config: (md) => {
      configureMermaidFence(md)
      configureDiagramsPlugin(md, {
        diagramsDir: path.resolve(process.cwd(), 'docs/public/diagrams'),
        publicPath: `${base.replace(/\/$/, '')}/diagrams`,
        krokiServerUrl: 'https://kroki.io',
        excludedDiagramTypes: ['mermaid'],
        allowedImportDirs: [path.resolve(process.cwd(), 'docs')]
      })
    }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'AI', link: '/posts/AI/' },
      { text: 'AI基础', link: '/posts/AI基础/' },
      { text: 'LLM', link: '/posts/LLM/' },
      { text: 'robot', link: '/posts/robot/' },
      { text: 'Java', link: '/posts/Java/' },
      { text: '数据库', link: '/posts/Database/' },
      { text: 'Solution', link: '/posts/Solution/' }
    ],
    sidebar: buildSidebar(),
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    search: {
      provider: 'local'
    },
    recentPosts,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/XuelinHu/blogs' }
    ],
    footer: {
      message: '基于 VitePress + GitHub Actions 自动部署',
      copyright: 'Copyright © 2026'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    lastUpdated: {
      text: '最后更新于'
    }
  }
})
