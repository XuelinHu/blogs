<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import SidebarToggler from './components/SidebarToggler.vue'
import SidebarIcons from './components/SidebarIcons.vue'
import PageMeta from './components/PageMeta.vue'
import AsideDocTitle from './components/AsideDocTitle.vue'

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
</style>
