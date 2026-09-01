<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()

type DateValue = Date | number | string

const created = computed<DateValue | undefined>(() => {
  return (frontmatter.value.created ?? frontmatter.value.date) as DateValue | undefined
})

const updated = computed<DateValue | undefined>(() => {
  const declared = frontmatter.value.updated as DateValue | undefined
  const gitUpdated = page.value.lastUpdated as number | undefined
  const declaredTime = toTimestamp(declared)

  if (gitUpdated && (!declaredTime || gitUpdated > declaredTime)) {
    return gitUpdated
  }

  return declared ?? gitUpdated
})

const isVisible = computed(() => {
  return page.value.frontmatter.layout !== 'home' && (!!created.value || !!updated.value)
})

function toTimestamp(date?: DateValue): number | null {
  if (!date) return null
  const parsed = date instanceof Date ? date : new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

function hasPreciseTime(date?: DateValue): boolean {
  if (typeof date === 'number') return true

  if (date instanceof Date) {
    return !(
      date.getUTCHours() === 0 &&
      date.getUTCMinutes() === 0 &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0
    )
  }

  if (typeof date !== 'string') return false

  // YAML 会把 `2026-09-01` 这样的纯日期序列化成
  // `2026-09-01T00:00:00.000Z`。它仍然只是日期，不能在东八区显示成 08:00。
  if (/^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z)?$/.test(date)) {
    return false
  }

  return /T|\d{2}:\d{2}/.test(date)
}

function formatDate(date?: DateValue, includeTime = false): string {
  if (!date) return ''
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return String(date)

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    // SSR 构建机和读者浏览器必须使用同一时区，否则精确更新时间会造成 hydration mismatch。
    timeZone: 'Asia/Shanghai',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(parsed)
}

function toDateTime(date?: DateValue): string | undefined {
  if (!date) return undefined
  const parsed = date instanceof Date ? date : new Date(date)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}
</script>

<template>
  <div v-if="isVisible" class="page-meta" aria-label="文章时间信息">
    <span v-if="created" class="page-meta__item">
      <span class="page-meta__dot" aria-hidden="true" />
      发布于
      <time :datetime="toDateTime(created)">{{ formatDate(created, false) }}</time>
    </span>
    <span v-if="updated" class="page-meta__item">
      <span class="page-meta__dot page-meta__dot--updated" aria-hidden="true" />
      更新于
      <time :datetime="toDateTime(updated)">{{ formatDate(updated, hasPreciseTime(updated)) }}</time>
    </span>
  </div>
</template>

<style scoped>
.page-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin: -2px 0 22px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.page-meta__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.page-meta__item time {
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.page-meta__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-text-3) 55%, transparent);
}

.page-meta__dot--updated {
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
}
</style>
