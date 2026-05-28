<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import SidebarToggler from './components/SidebarToggler.vue'
import SidebarIcons from './components/SidebarIcons.vue'
import PageMeta from './components/PageMeta.vue'
import AsideDocTitle from './components/AsideDocTitle.vue'
import AsidePageOutline from './components/AsidePageOutline.vue'

const { Layout } = DefaultTheme
const route = useRoute()
const categoryIndexBodyClass = 'category-index-page'

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

onMounted(() => scrollSidebarToActive())
onMounted(() => syncCategoryIndexClass(route.path))
watch(() => route.path, () => scrollSidebarToActive())
watch(() => route.path, (path) => syncCategoryIndexClass(path))
onUnmounted(() => document.body.classList.remove(categoryIndexBodyClass))
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
  </Layout>
</template>

<style scoped>
:global(body.category-index-page #VPContent > div > div > div.content > div > main > div > div > nav) {
  display: none;
}

:global(.VPDocAside .VPDocAsideOutline) {
  display: none !important;
}

@media (min-width: 1440px) {
  :global(.VPSidebar) {
    padding-left: 18px;
    width: calc((100% - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width) + 12px);
  }

  :global(.VPSidebar .curtain) {
    margin-left: -18px;
  }

  :global(.VPDoc .container) {
    max-width: 1320px;
  }

  :global(.VPDoc .aside) {
    max-width: 292px;
    padding-left: 56px;
  }

  :global(.VPDoc .aside-container),
  :global(.VPDoc .aside-curtain) {
    width: 236px;
  }

  :global(.VPDoc.has-aside .content-container) {
    max-width: 664px;
  }
}

@media (min-width: 1680px) {
  :global(.VPSidebar) {
    padding-left: 12px;
    width: calc((100% - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width) + 24px);
  }

  :global(.VPSidebar .curtain) {
    margin-left: -12px;
  }

  :global(.VPDoc .container) {
    max-width: 1380px;
  }

  :global(.VPDoc .aside) {
    max-width: 312px;
    padding-left: 72px;
  }

  :global(.VPDoc .aside-container),
  :global(.VPDoc .aside-curtain) {
    width: 240px;
  }

  :global(.VPDoc.has-aside .content-container) {
    max-width: 648px;
  }
}
</style>
