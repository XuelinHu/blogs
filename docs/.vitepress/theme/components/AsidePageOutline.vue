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

function getHeadingElements() {
  return Array.from(
    document.querySelectorAll('.vp-doc :is(h2, h3)')
  ).filter((element) => element.id)
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
const filteredBranchLinks = computed(() => flattenBranchLinks(filteredHeaders.value))
const canExpand = computed(() => {
  return filteredBranchLinks.value.some((link) => collapsedLinks.value.includes(link))
})
const canCollapse = computed(() => {
  return filteredBranchLinks.value.some((link) => !collapsedLinks.value.includes(link))
})
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
      <label class="aside-page-outline__search-wrap" for="aside-page-outline-search">
        <span class="aside-page-outline__search-icon" aria-hidden="true" />
        <input
          id="aside-page-outline-search"
          v-model="query"
          class="aside-page-outline__search"
          type="search"
          name="page-outline-query"
          aria-label="搜索本页目录"
          placeholder="搜索本页目录"
        />
      </label>
      <div class="aside-page-outline__actions" role="group" aria-label="目录展开状态">
        <button
          class="aside-page-outline__toggle"
          type="button"
          title="展开本页全部目录"
          :disabled="!canExpand"
          @click="expandAll"
        >
          <span class="aside-page-outline__action-icon is-expand" aria-hidden="true" />
          展开
        </button>
        <button
          class="aside-page-outline__toggle"
          type="button"
          title="收起本页全部目录"
          :disabled="!canCollapse"
          @click="collapseAll"
        >
          <span class="aside-page-outline__action-icon is-collapse" aria-hidden="true" />
          收起
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
  margin-top: 4px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, transparent);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--vp-c-bg-soft) 0%, var(--vp-c-bg) 100%);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.045);
  overflow: hidden;
}

.aside-page-outline__toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: color-mix(in srgb, var(--vp-c-bg) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, transparent);
}

.aside-page-outline__search-wrap {
  position: relative;
  display: block;
}

.aside-page-outline__search-icon {
  position: absolute;
  top: 50%;
  left: 11px;
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--vp-c-text-3);
  border-radius: 999px;
  pointer-events: none;
  transform: translateY(-58%);
}

.aside-page-outline__search-icon::after {
  position: absolute;
  right: -4px;
  bottom: -3px;
  width: 5px;
  border-top: 1.5px solid var(--vp-c-text-3);
  content: '';
  transform: rotate(45deg);
  transform-origin: left center;
}

.aside-page-outline__search {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 9px;
  padding: 7px 28px 7px 32px;
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
  gap: 2px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 78%, transparent);
  border-radius: 9px;
  padding: 2px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 76%, transparent);
}

.aside-page-outline__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 28px;
  border: 0;
  border-radius: 7px;
  padding: 5px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    opacity 0.2s ease;
}

.aside-page-outline__toggle:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.aside-page-outline__toggle:disabled {
  opacity: 0.38;
  cursor: default;
  color: var(--vp-c-text-3);
  background: transparent;
}

.aside-page-outline__action-icon {
  position: relative;
  width: 10px;
  height: 10px;
}

.aside-page-outline__action-icon::before,
.aside-page-outline__action-icon::after {
  position: absolute;
  left: 2px;
  width: 6px;
  height: 6px;
  border-right: 1.3px solid currentColor;
  border-bottom: 1.3px solid currentColor;
  content: '';
}

.aside-page-outline__action-icon.is-expand::before {
  top: -2px;
  transform: rotate(45deg);
}

.aside-page-outline__action-icon.is-expand::after {
  top: 2px;
  transform: rotate(45deg);
}

.aside-page-outline__action-icon.is-collapse::before {
  top: 1px;
  transform: rotate(225deg);
}

.aside-page-outline__action-icon.is-collapse::after {
  top: 5px;
  transform: rotate(225deg);
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
