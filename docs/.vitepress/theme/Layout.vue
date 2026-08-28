<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import SidebarToggler from './components/SidebarToggler.vue'
import SidebarIcons from './components/SidebarIcons.vue'
import PageMeta from './components/PageMeta.vue'
import AsideDocTitle from './components/AsideDocTitle.vue'
import AsidePageOutline from './components/AsidePageOutline.vue'

const { Layout } = DefaultTheme
const route = useRoute()
const { page } = useData()
const categoryIndexBodyClass = 'category-index-page'
const outlineHiddenBodyClass = 'page-outline-hidden'
const outlineStorageKey = 'blog-page-outline-visible'
const outlineVisible = ref(true)
const showOutlineToggle = computed(() => page.value.frontmatter.layout !== 'home')

function syncOutlineVisibility() {
  document.body.classList.toggle(outlineHiddenBodyClass, !outlineVisible.value)
}

function toggleOutline() {
  outlineVisible.value = !outlineVisible.value
  localStorage.setItem(outlineStorageKey, String(outlineVisible.value))
  syncOutlineVisibility()
}

function scrollSidebarToActive() {
  requestAnimationFrame(() => {
    const active = document.querySelector('.VPSidebarItem.is-active')
    if (active) {
      active.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  })
}

function syncCategoryIndexClass(path: string) {
  const isCategoryIndexPage = /^\/posts\/[^/]+\/$/.test(path)
  document.body.classList.toggle(categoryIndexBodyClass, isCategoryIndexPage)
}

async function renderMermaidDiagrams() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.vp-doc pre.mermaid:not([data-processed="true"])'))

  if (nodes.length === 0) {
    return
  }

  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default'
    })
    await mermaid.run({ nodes })
  } catch (error) {
    console.error('Failed to render Mermaid diagrams:', error)
  }
}

function scheduleMermaidRender() {
  void nextTick(() => renderMermaidDiagrams())
}

onMounted(() => {
  outlineVisible.value = localStorage.getItem(outlineStorageKey) !== 'false'
  syncOutlineVisibility()
  scrollSidebarToActive()
})
onMounted(() => syncCategoryIndexClass(route.path))
onMounted(() => scheduleMermaidRender())
watch(() => route.path, () => scrollSidebarToActive())
watch(() => route.path, (path) => syncCategoryIndexClass(path))
watch(() => route.path, () => scheduleMermaidRender())
onUnmounted(() => {
  document.body.classList.remove(categoryIndexBodyClass)
  document.body.classList.remove(outlineHiddenBodyClass)
})
</script>

<template>
  <Layout>
    <template #doc-before>
      <PageMeta />
    </template>
    <template #aside-outline-before>
      <AsideDocTitle />
      <AsidePageOutline />
    </template>
    <template #sidebar-nav-before>
      <SidebarToggler />
      <SidebarIcons />
    </template>
    <template #doc-bottom>
      <button
        v-if="showOutlineToggle"
        class="page-outline-toggle"
        type="button"
        :aria-label="outlineVisible ? '隐藏本页目录' : '显示本页目录'"
        :aria-pressed="outlineVisible"
        :title="outlineVisible ? '隐藏本页目录' : '显示本页目录'"
        @click="toggleOutline"
      >
        <span
          class="page-outline-toggle__icon"
          :class="{ 'is-hidden': !outlineVisible }"
          aria-hidden="true"
        />
      </button>
    </template>
  </Layout>
</template>

<style scoped>
:global(body.category-index-page #VPContent > div > div > div.content > div > main > div > div > nav) {
  display: none;
}

:global(.VPDocAside .VPDocAsideOutline) {
  display: none !important;
}

:global(.vp-doc .mermaid-diagram) {
  margin: 16px 0;
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
}

:global(.vp-doc .mermaid-diagram .mermaid) {
  display: flex;
  justify-content: center;
  margin: 0;
  min-width: max-content;
  background: transparent;
}

:global(.vp-doc .mermaid-diagram svg) {
  max-width: 100%;
  height: auto;
}

:global(.vp-doc mjx-container[jax='SVG'][display='true']) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 0;
}

:global(.vp-doc mjx-container[jax='SVG'][display='true'] > svg) {
  display: block;
  margin: 0 auto;
  max-width: none;
}

.page-outline-toggle {
  position: fixed;
  top: 50%;
  right: 14px;
  z-index: 30;
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0;
  color: var(--vp-c-text-2);
  background: color-mix(in srgb, var(--vp-c-bg) 92%, transparent);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.1);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transform: translateY(-50%);
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.page-outline-toggle:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.page-outline-toggle__icon {
  position: relative;
  display: block;
  width: 20px;
  height: 16px;
  border: 1.5px solid currentColor;
  border-radius: 3px;
}

.page-outline-toggle__icon::after {
  position: absolute;
  top: 0;
  right: 4px;
  bottom: 0;
  border-left: 1.5px solid currentColor;
  content: '';
  transition: right 0.2s ease;
}

.page-outline-toggle__icon.is-hidden::after {
  right: 0;
}

@media (min-width: 1280px) {
  .page-outline-toggle {
    display: inline-flex;
  }

  :global(.VPDoc.has-aside .content-container) {
    max-width: 760px !important;
  }

  :global(body.page-outline-hidden .VPDoc .aside) {
    display: none;
  }

  :global(body.page-outline-hidden .VPDoc .content),
  :global(body.page-outline-hidden .VPDoc .content-container) {
    max-width: none !important;
  }
}

@media (min-width: 1440px) {
  .page-outline-toggle {
    right: 310px;
  }

  :global(body.page-outline-hidden .page-outline-toggle) {
    right: 14px;
  }
}
</style>

<style>
@media (min-width: 1440px) {
  :root {
    --vp-sidebar-width: 300px;
  }

  .VPContent.has-sidebar {
    padding-right: 0 !important;
    padding-left: 300px !important;
  }

  .VPSidebar {
    width: 300px !important;
    max-width: 300px !important;
    padding-right: 24px !important;
    padding-left: 24px !important;
  }

  .VPSidebar .curtain {
    margin-right: -24px !important;
    margin-left: -24px !important;
  }

  .VPNavBar.has-sidebar .title {
    width: 300px !important;
    padding-left: 24px !important;
  }

  .VPNavBar.has-sidebar .content {
    padding-right: 24px !important;
    padding-left: 300px !important;
  }

  .VPNavBar.has-sidebar .divider {
    padding-left: 300px !important;
  }

  .VPDoc .container {
    width: 100%;
    max-width: none !important;
  }

  .VPDoc .content {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
    margin: 0;
  }

  .VPDoc .aside {
    flex: 0 0 300px;
    width: 300px;
    max-width: 300px;
    padding-left: 32px;
  }

  .VPDoc .aside-container,
  .VPDoc .aside-curtain {
    width: 268px;
  }

  .VPDoc.has-aside .content-container,
  .VPDoc .content-container {
    width: 100%;
    max-width: none !important;
  }
}
</style>
