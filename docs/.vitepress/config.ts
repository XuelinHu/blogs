import path from 'node:path'
import { defineConfig } from 'vitepress'
import { buildRecentPosts } from './content'
import { configureDiagramsPlugin } from 'vitepress-plugin-diagrams'
import { buildSidebar } from './sidebar'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'blogs'
const base = process.env.VITEPRESS_BASE || `/${repositoryName}/`
const recentPosts = buildRecentPosts()

export default defineConfig({
  title: '技术博客与科研笔记',
  description: '使用 VitePress 构建的 Markdown 静态博客，适合技术博客、科研笔记与图形化文档。',
  base,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }]
  ],
  markdown: {
    lineNumbers: true,
    math: true,
    toc: {
      level: [1, 2, 3]
    },
    config: (md) => {
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
      { icon: 'github', link: 'https://github.com/your-name/blogs' }
    ],
    footer: {
      message: '基于 VitePress、TypeScript 与 GitHub Actions 构建',
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
