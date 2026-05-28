<script setup lang="ts">
import { onContentUpdated, useData } from 'vitepress'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AsidePageOutlineTree, { type OutlineTreeItem } from './AsidePageOutlineTree.vue'

type OutlineItem = OutlineTreeItem

const { page } = useData()

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

function collectHeaders(): OutlineItem[] {
  const headingElements = Array.from(
    document.querySelectorAll('.vp-doc :is(h2, h3)')
  ).filter((element) => element.id)

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
  const headingElements = Array.from(
    document.querySelectorAll('.vp-doc :is(h2, h3)')
  ).filter((element) => element.id)

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
  margin-top: 12px;
  border-left: 1px solid var(--vp-c-divider);
  padding-left: 16px;
}

.aside-page-outline__toolbar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 4px 0 10px;
  background: var(--vp-c-bg);
}

.aside-page-outline__search {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

.aside-page-outline__actions {
  display: flex;
  gap: 8px;
}

.aside-page-outline__toggle {
  flex: 1;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}

.aside-page-outline__toggle:hover,
.aside-page-outline__search:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}

.aside-page-outline__list,
.aside-page-outline__children {
  margin: 0;
  padding: 0;
  list-style: none;
}

.aside-page-outline__item {
  margin: 0;
}

.aside-page-outline__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.aside-page-outline__branch-toggle,
.aside-page-outline__branch-placeholder {
  flex: 0 0 18px;
  width: 18px;
}

.aside-page-outline__branch-toggle {
  border: 0;
  padding: 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 18px;
  background: transparent;
  cursor: pointer;
}

.aside-page-outline__branch-toggle:hover {
  color: var(--vp-c-brand-1);
}

.aside-page-outline__branch-placeholder {
  display: inline-block;
}

.aside-page-outline__children {
  padding-left: 14px;
}

.aside-page-outline__empty {
  margin: 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 24px;
}

.aside-page-outline__link {
  display: block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 28px;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aside-page-outline__link:hover,
.aside-page-outline__link.is-active {
  color: var(--vp-c-brand-1);
}
</style>
