<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()

const created = computed(() => frontmatter.value.created as string | undefined)
const updated = computed(() => frontmatter.value.updated as string | undefined)
const isVisible = computed(() => {
  return page.value.frontmatter.layout !== 'home' && (!!created.value || !!updated.value)
})

function formatDate(date?: string): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(parsed)
}
</script>

<template>
  <div v-if="isVisible" class="page-meta">
    <span v-if="created" class="page-meta__item">创建日期：{{ formatDate(created) }}</span>
    <span v-if="updated" class="page-meta__item">最新修改：{{ formatDate(updated) }}</span>
  </div>
</template>

<style scoped>
.page-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: -4px 0 20px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.page-meta__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
