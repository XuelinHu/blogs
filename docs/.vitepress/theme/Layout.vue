<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import SidebarToggler from './components/SidebarToggler.vue'
import SidebarIcons from './components/SidebarIcons.vue'

const { Layout } = DefaultTheme
const route = useRoute()

function scrollSidebarToActive() {
  requestAnimationFrame(() => {
    const active = document.querySelector('.VPSidebarItem.is-active')
    if (active) {
      active.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  })
}

onMounted(() => scrollSidebarToActive())
watch(() => route.path, () => scrollSidebarToActive())
</script>

<template>
  <Layout>
    <template #sidebar-nav-before>
      <SidebarToggler />
      <SidebarIcons />
    </template>
  </Layout>
</template>
