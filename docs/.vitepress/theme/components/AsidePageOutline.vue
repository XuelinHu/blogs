<script setup lang="ts">
import { onContentUpdated, useData } from 'vitepress'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AsidePageOutlineTree, { type OutlineTreeItem } from './AsidePageOutlineTree.vue'

type OutlineItem = OutlineTreeItem

const { page, title } = useData()

const query = ref('')
const collapsedLinks = ref<string[]>([])
const headers = ref<OutlineItem[]>([])
const activeLink = ref('')

function readTitle(element: Element): string {
  return Array.from(element.childNodes)
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? ''
      }

      if (
        node.nodeType === Node.ELEMENT_NODE &&
        !(node as Element).classList.contains('header-anchor')
      ) {
        return node.textContent ?? ''
      }

      return ''
    })
    .join('')
    .trim()
}

function getHeadingElements() {
  const headingElements = Array.from(
    document.querySelectorAll('.vp-doc :is(h1, h2, h3)')
  ).filter((element) => element.id)

  let skippedPageTitle = false

  return headingElements.filter((element) => {
    const level = Number(element.tagName.slice(1))
    const headingTitle = readTitle(element)

    if (!skippedPageTitle && level === 1 && headingTitle === title.value) {
      skippedPageTitle = true
      return false
    }

    return true
  })
}

function collectHeaders(): OutlineItem[] {
  const headingElements = getHeadingElements()

  const items = headingElements.map((element) => ({
    children: [],
    level: Number(element.tagName.slice(1)),
    link: `#${element.id}`,
    title: readTitle(element)
  }))

  const result: OutlineItem[] = []
  const stack: OutlineItem[] = []

  for (const item of items) {
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]

    if (parent) {
      parent.children.push(item)
    } else {
      result.push(item)
    }

    stack.push(item)
  }

  return result
}

function flattenBranchLinks(items: OutlineItem[]): string[] {
  return items.flatMap((item) => [
    ...(item.children.length > 0 ? [item.link] : []),
    ...flattenBranchLinks(item.children)
  ])
}

function updateHeaders() {
  headers.value = collectHeaders()
  const validLinks = new Set(flattenBranchLinks(headers.value))
  collapsedLinks.value = collapsedLinks.value.filter((link) => validLinks.has(link))
  updateActiveLink()
}

function updateActiveLink() {
  const headingElements = getHeadingElements()

  if (headingElements.length === 0) {
    activeLink.value = ''
    return
  }

  const offset = 120
  let current = ''

  for (const element of headingElements) {
    if ((element as HTMLElement).getBoundingClientRect().top <= offset) {
      current = `#${element.id}`
    } else {
      break
    }
  }

  activeLink.value = current || `#${headingElements[0].id}`
}

function filterItems(items: OutlineItem[], keyword: string): OutlineItem[] {
  if (!keyword) {
    return items
  }

  return items
    .map((item) => {
      const children = filterItems(item.children, keyword)
      const matched = item.title.toLowerCase().includes(keyword)

      if (!matched && children.length === 0) {
        return null
      }

      return {
        ...item,
        children
      }
    })
    .filter((item): item is OutlineItem => item !== null)
}

function onClick(event: Event) {
  const target = event.currentTarget as HTMLAnchorElement | null
  const id = target?.getAttribute('href')?.slice(1)

  if (!id) {
    return
  }

  document.getElementById(decodeURIComponent(id))?.focus({ preventScroll: true })
}

function expandAll() {
  collapsedLinks.value = []
}

function collapseAll() {
  collapsedLinks.value = flattenBranchLinks(filteredHeaders.value)
}

function toggleItem(link: string) {
  if (collapsedLinks.value.includes(link)) {
    collapsedLinks.value = collapsedLinks.value.filter((item) => item !== link)
    return
  }

  collapsedLinks.value = [...collapsedLinks.value, link]
}

const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const filteredHeaders = computed(() => filterItems(headers.value, normalizedQuery.value))
const visible = computed(() => {
  return page.value.frontmatter.layout !== 'home' && headers.value.length > 0
})

onMounted(() => {
  updateHeaders()
  window.addEventListener('scroll', updateActiveLink, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateActiveLink)
})

onContentUpdated(() => {
  collapsedLinks.value = []
  query.value = ''
  updateHeaders()
})

watch(
  () => page.value.relativePath,
  () => {
    collapsedLinks.value = []
    query.value = ''
  }
)
</script>

<template>
  <nav v-if="visible" class="aside-page-outline">
    <div class="aside-page-outline__toolbar">
      <input
        v-model="query"
        class="aside-page-outline__search"
        type="text"
        placeholder="搜索目录"
      />
      <div class="aside-page-outline__actions">
        <button class="aside-page-outline__toggle" type="button" @click="expandAll">
          展开全部
        </button>
        <button class="aside-page-outline__toggle" type="button" @click="collapseAll">
          折叠全部
        </button>
      </div>
    </div>

    <ul v-if="filteredHeaders.length > 0" class="aside-page-outline__list">
      <AsidePageOutlineTree
        :items="filteredHeaders"
        :active-link="activeLink"
        :collapsed-links="collapsedLinks"
        @item-click="onClick"
        @toggle-item="toggleItem"
      />
    </ul>

    <p v-else-if="normalizedQuery" class="aside-page-outline__empty">未找到匹配目录</p>
  </nav>
</template>

<style scoped>
.aside-page-outline {
  position: relative;
  margin-top: 12px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, transparent);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--vp-c-bg-soft) 0%, var(--vp-c-bg) 100%);
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.05);
  overflow: hidden;
}

.aside-page-outline__toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, transparent);
}

.aside-page-outline__search {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.aside-page-outline__search:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent);
}

.aside-page-outline__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.aside-page-outline__toggle {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.aside-page-outline__toggle:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  transform: translateY(-1px);
}

.aside-page-outline__list {
  margin: 0;
  padding: 10px 12px 14px;
  list-style: none;
}

.aside-page-outline__empty {
  margin: 0;
  padding: 10px 12px 14px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 24px;
}
</style>
