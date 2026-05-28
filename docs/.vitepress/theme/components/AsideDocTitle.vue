<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page, title } = useData()

const visible = computed(() => {
  return page.value.frontmatter.layout !== 'home' && !!title.value
})
</script>

<template>
  <div v-if="visible" class="aside-doc-title">
    <a class="aside-doc-title__link" href="#top">{{ title }}</a>
  </div>
</template>

<style scoped>
.aside-doc-title {
  padding: 0 0 12px;
  margin: 0 0 14px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.aside-doc-title__link {
  display: block;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s ease;
}

.aside-doc-title__link:hover {
  color: var(--vp-c-brand-1);
}
</style>
