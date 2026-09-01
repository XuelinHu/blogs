<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import SidebarToggler from './components/SidebarToggler.vue'
import PageMeta from './components/PageMeta.vue'
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
      <AsidePageOutline />
    </template>
    <template #sidebar-nav-before>
      <SidebarToggler />
    </template>
    <template #doc-bottom>
      <button
        v-if="showOutlineToggle"
        class="page-outline-toggle"
        type="button"
        :aria-label="outlineVisible ? '隐藏本页目录' : '显示本页目录'"
        :aria-pressed="outlineVisible"
        :title="outlineVisible ? '隐藏本页目录' : '显示本页目录'"
        :class="{ 'is-outline-hidden': !outlineVisible }"
        @click="toggleOutline"
      >
        <span class="page-outline-toggle__emoji" aria-hidden="true">😉</span>
        <span class="page-outline-toggle__tooltip" role="tooltip">本页目录</span>
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
  width: 40px;
  height: 40px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 78%, transparent);
  border-radius: 999px;
  padding: 0;
  color: var(--vp-c-text-2);
  background: color-mix(in srgb, var(--vp-c-bg) 90%, var(--vp-c-bg-soft));
  box-shadow: 0 8px 22px rgb(15 23 42 / 0.09);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.page-outline-toggle:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 58%, var(--vp-c-divider));
  background: var(--vp-c-bg);
  box-shadow: 0 10px 28px rgb(15 23 42 / 0.14);
  transform: translateY(-50%) scale(1.04);
}

.page-outline-toggle:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

.page-outline-toggle__emoji {
  display: block;
  font-size: 21px;
  line-height: 1;
  filter: saturate(0.9);
  transition: filter 0.2s ease, transform 0.2s ease;
}

.page-outline-toggle:hover .page-outline-toggle__emoji {
  filter: saturate(1.08);
  transform: rotate(-7deg) scale(1.08);
}

.page-outline-toggle.is-outline-hidden .page-outline-toggle__emoji {
  opacity: 0.82;
  filter: grayscale(0.25) saturate(0.75);
}

.page-outline-toggle__tooltip {
  position: absolute;
  top: 50%;
  right: calc(100% + 10px);
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 76%, transparent);
  border-radius: 8px;
  padding: 6px 9px;
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--vp-c-bg) 94%, transparent);
  box-shadow: 0 6px 18px rgb(15 23 42 / 0.1);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(4px, -50%);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.page-outline-toggle:hover .page-outline-toggle__tooltip,
.page-outline-toggle:focus-visible .page-outline-toggle__tooltip {
  opacity: 1;
  transform: translate(0, -50%);
}

@media (min-width: 1280px) {
  .page-outline-toggle {
    display: inline-flex;
    right: 270px;
  }

  :global(body.page-outline-hidden .page-outline-toggle) {
    right: 14px;
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
.vp-doc .custom-block.danger {
  position: relative;
  margin: 22px 0;
  border: 1px solid color-mix(in srgb, var(--vp-c-danger-1) 48%, var(--vp-c-divider));
  border-left: 4px solid var(--vp-c-danger-1);
  border-radius: 10px;
  padding: 15px 18px 15px 20px;
  color: color-mix(in srgb, var(--vp-c-danger-1) 46%, var(--vp-c-text-1));
  background: color-mix(in srgb, var(--vp-c-bg) 88%, var(--vp-c-danger-soft));
  box-shadow: 0 8px 22px color-mix(in srgb, var(--vp-c-danger-1) 10%, transparent);
}

.vp-doc .custom-block.danger .custom-block-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 8px;
  color: var(--vp-c-danger-1);
  font-size: 15px;
  font-weight: 800;
}

.vp-doc .custom-block.danger .custom-block-title::before {
  display: inline-grid;
  flex: 0 0 24px;
  width: 24px;
  height: 22px;
  place-items: center;
  padding-top: 3px;
  color: #fff;
  background: var(--vp-c-danger-1);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  font-size: 14px;
  font-weight: 900;
  line-height: 1;
  content: '!';
}

.vp-doc .custom-block.danger p:not(.custom-block-title),
.vp-doc .custom-block.danger li {
  color: inherit;
}

.vp-doc .custom-block.danger code {
  color: color-mix(in srgb, var(--vp-c-danger-1) 72%, var(--vp-c-text-1));
  background: color-mix(in srgb, var(--vp-c-bg) 76%, var(--vp-c-danger-soft));
}

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
