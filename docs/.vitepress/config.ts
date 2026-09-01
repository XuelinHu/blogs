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
      { text: '机器人', link: '/posts/robot/' },
      {
        text: 'AI',
        items: [
          { text: 'AI 模型基础', link: '/posts/AI基础/' },
          { text: 'AI 工具与应用', link: '/posts/AI/' }
        ]
      },
      { text: '大语言模型', link: '/posts/LLM/' },
      {
        text: '后端与数据',
        items: [
          { text: 'Java 基础与并发', link: '/posts/Java/' },
          { text: 'Spring 生态', link: '/posts/Spring/' },
          { text: '中间件与可观测性', link: '/posts/Middleware/' },
          { text: '数据库与存储', link: '/posts/Database/' }
        ]
      },
      {
        text: '开发与测试',
        items: [
          { text: '前端开发', link: '/posts/Front-end/' },
          { text: 'Python 开发', link: '/posts/Python/' },
          { text: '移动端开发', link: '/posts/Mobile/' },
          { text: '测试与质量保障', link: '/posts/Test/' },
          { text: '计算机网络', link: '/posts/Net/' }
        ]
      },
      {
        text: '工程知识库',
        items: [
          { text: '命令与开发环境', link: '/posts/Command/' },
          { text: '工程方案与排障', link: '/posts/Solution/' },
          { text: 'JVM Sandbox', link: '/posts/Sandbox/' },
          { text: '论文与系统分析', link: '/posts/Paper/' },
          { text: '阅读与思考', link: '/posts/Reading/' },
          { text: 'Web3 与区块链', link: '/posts/Web3/' }
        ]
      }
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
      text: '最后更新',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    }
  }
})
