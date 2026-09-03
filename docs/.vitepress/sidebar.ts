import path from 'node:path'
import fs from 'node:fs'
import {
  getMarkdownFiles,
  readFrontmatterDate,
  readFrontmatterUpdated,
  resolveTitle,
  toRoute,
  toTitle
} from './content'

type SidebarItem = {
  text: string
  link: string
}

type SidebarGroup = {
  text: string
  collapsed: boolean
  items: SidebarItem[]
}

const docsRoot = path.resolve(process.cwd(), 'docs')
const postsRoot = path.join(docsRoot, 'posts')
const categoryIcons: Record<string, string> = {
  AI: '🤖',
  'AI基础': '🧠',
  Command: '⌘',
  Database: '▣',
  'Front-end': '◇',
  Java: '☕',
  LLM: '◉',
  '电工基础': '⚡',
  Middleware: '▦',
  Mobile: '▯',
  Net: '◎',
  Paper: '✎',
  Python: '🐍',
  Reading: '📖',
  robot: '⚙',
  Sandbox: '⬢',
  Solution: '💡',
  Spring: '🌱',
  Test: '✓',
  Web3: '◆'
}

const categoryLabels: Record<string, string> = {
  AI: 'AI 工具与应用',
  'AI基础': 'AI 模型基础',
  Command: '命令与开发环境',
  Database: '数据库与存储',
  'Front-end': '前端开发',
  Java: 'Java 基础与并发',
  LLM: '大语言模型',
  '电工基础': '电工基础',
  Middleware: '中间件与可观测性',
  Mobile: '移动端开发',
  Net: '计算机网络',
  Paper: '论文与系统分析',
  Python: 'Python 开发',
  Reading: '阅读与思考',
  robot: '机器人与具身智能',
  Sandbox: 'JVM Sandbox',
  Solution: '工程方案与排障',
  Spring: 'Spring 生态',
  Test: '测试与质量保障',
  Web3: 'Web3 与区块链'
}

const categoryOrder = [
  'robot',
  'AI基础',
  'AI',
  'LLM',
  '电工基础',
  'Java',
  'Spring',
  'Middleware',
  'Database',
  'Front-end',
  'Python',
  'Mobile',
  'Test',
  'Net',
  'Command',
  'Solution',
  'Sandbox',
  'Paper',
  'Reading',
  'Web3'
]

function resolveSortDate(filePath: string): string {
  return readFrontmatterUpdated(filePath) ?? readFrontmatterDate(filePath) ?? ''
}

function buildCategoryGroup(dirPath: string): SidebarGroup {
  const folderName = path.basename(dirPath)
  const files = getMarkdownFiles(dirPath).sort((a, b) => {
    const aIsIndex = path.basename(a) === 'index.md' ? 0 : 1
    const bIsIndex = path.basename(b) === 'index.md' ? 0 : 1

    if (aIsIndex !== bIsIndex) {
      return aIsIndex - bIsIndex
    }

    const dateCompare = resolveSortDate(b).localeCompare(resolveSortDate(a))
    if (dateCompare !== 0) {
      return dateCompare
    }

    return resolveTitle(a).localeCompare(resolveTitle(b), 'zh-CN')
  })

  const groupTitleFile = path.join(dirPath, 'index.md')
  const groupTitle = categoryLabels[folderName] ?? (
    fs.existsSync(groupTitleFile)
      ? resolveTitle(groupTitleFile)
      : toTitle(folderName)
  )
  const icon = categoryIcons[folderName]

  return {
    text: icon ? `${icon} ${groupTitle}` : groupTitle,
    collapsed: true,
    items: files.map((filePath) => ({
      text: path.basename(filePath) === 'index.md' ? '分类概览' : resolveTitle(filePath),
      link: toRoute(filePath)
    }))
  }
}

export function buildSidebar(): Record<string, SidebarGroup[]> {
  const sidebarGroups = fs
    .readdirSync(postsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.name)
      const bIndex = categoryOrder.indexOf(b.name)
      const aOrder = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex
      const bOrder = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex

      return aOrder - bOrder || a.name.localeCompare(b.name, 'zh-CN')
    })
    .map((entry) => buildCategoryGroup(path.join(postsRoot, entry.name)))

  const rootMarkdownFiles = fs
    .readdirSync(postsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(postsRoot, entry.name))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  if (rootMarkdownFiles.length > 0) {
    sidebarGroups.push({
      text: '专题示例',
      collapsed: false,
      items: rootMarkdownFiles.map((filePath) => ({
        text: resolveTitle(filePath),
        link: toRoute(filePath)
      }))
    })
  }

  return {
    '/posts/': sidebarGroups
  }
}
