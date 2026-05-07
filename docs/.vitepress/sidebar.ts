import path from 'node:path'
import fs from 'node:fs'
import {
  getMarkdownFiles,
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
  Command: '⌘',
  Database: '▣',
  'Front-end': '◇',
  Java: '☕',
  Middleware: '▦',
  Mobile: '▯',
  Net: '◎',
  Paper: '✎',
  Python: '🐍',
  Reading: '📖',
  Sandbox: '⬢',
  Solution: '💡',
  Spring: '🌱',
  Test: '✓',
  Web3: '◆'
}

function buildCategoryGroup(dirPath: string): SidebarGroup {
  const folderName = path.basename(dirPath)
  const files = getMarkdownFiles(dirPath).sort((a, b) => {
    const aIsIndex = path.basename(a) === 'index.md' ? 0 : 1
    const bIsIndex = path.basename(b) === 'index.md' ? 0 : 1

    if (aIsIndex !== bIsIndex) {
      return aIsIndex - bIsIndex
    }

    return a.localeCompare(b, 'zh-CN')
  })

  const groupTitleFile = path.join(dirPath, 'index.md')
  const groupTitle = fs.existsSync(groupTitleFile)
    ? resolveTitle(groupTitleFile)
    : toTitle(folderName)
  const icon = categoryIcons[folderName]

  return {
    text: icon ? `${icon} ${groupTitle}` : groupTitle,
    collapsed: false,
    items: files.map((filePath) => ({
      text: resolveTitle(filePath),
      link: toRoute(filePath)
    }))
  }
}

export function buildSidebar(): Record<string, SidebarGroup[]> {
  const sidebarGroups = fs
    .readdirSync(postsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
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
