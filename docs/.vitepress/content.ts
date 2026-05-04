import fs from 'node:fs'
import path from 'node:path'

export type RecentPost = {
  category: string
  date: string
  link: string
  title: string
}

const docsRoot = path.resolve(process.cwd(), 'docs')
const postsRoot = path.join(docsRoot, 'posts')

function readFrontmatter(raw: string): string | null {
  const match = raw.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/)
  return match ? match[1] : null
}

function readFrontmatterValue(raw: string, key: string): string | null {
  const frontmatter = readFrontmatter(raw)
  if (!frontmatter) {
    return null
  }

  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  if (!match) {
    return null
  }

  return match[1].trim().replace(/^['"]|['"]$/g, '')
}

export function readFrontmatterTitle(filePath: string): string | null {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return readFrontmatterValue(raw, 'title')
}

export function readFrontmatterDate(filePath: string): string | null {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return readFrontmatterValue(raw, 'date')
}

export function readHeadingTitle(filePath: string): string | null {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const lines = raw.split(/\r?\n/)

  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/)
    if (match) {
      return match[1].trim()
    }
  }

  return null
}

export function toRoute(filePath: string): string {
  const relativePath = path.relative(docsRoot, filePath).replace(/\\/g, '/')
  return `/${relativePath.replace(/\.md$/, '')}`
}

export function toTitle(slug: string): string {
  return slug
    .replace(/\.md$/, '')
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function resolveTitle(filePath: string): string {
  const frontmatterTitle = readFrontmatterTitle(filePath)
  if (frontmatterTitle) {
    return frontmatterTitle
  }

  const headingTitle = readHeadingTitle(filePath)
  if (headingTitle) {
    return headingTitle
  }

  return toTitle(path.basename(filePath, '.md'))
}

export function getMarkdownFiles(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        return false
      }

      return !entry.name.startsWith('aa_temp')
    })
    .map((entry) => path.join(dirPath, entry.name))
}

function normalizeDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toISOString().slice(0, 10)
}

export function buildRecentPosts(): RecentPost[] {
  const posts: Array<RecentPost & { sortValue: number }> = []
  const stack = [postsRoot]

  while (stack.length > 0) {
    const currentDir = stack.pop()!

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }

      if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name.startsWith('aa_temp')) {
        continue
      }

      if (entry.name === 'index.md') {
        continue
      }

      const explicitDate = readFrontmatterDate(fullPath)
      const stat = fs.statSync(fullPath)
      const normalized = explicitDate
        ? normalizeDate(explicitDate)
        : stat.mtime.toISOString().slice(0, 10)
      const parsed = new Date(normalized)
      const relativePath = path.relative(postsRoot, fullPath).replace(/\\/g, '/')
      const category = relativePath.split('/')[0] || '未分类'

      posts.push({
        category,
        title: resolveTitle(fullPath),
        link: toRoute(fullPath),
        date: normalized,
        sortValue: Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
      })
    }
  }

  return posts
    .sort((a, b) => {
      if (a.sortValue !== b.sortValue) {
        return b.sortValue - a.sortValue
      }

      return a.title.localeCompare(b.title, 'zh-CN')
    })
    .map(({ sortValue, ...post }) => post)
}
