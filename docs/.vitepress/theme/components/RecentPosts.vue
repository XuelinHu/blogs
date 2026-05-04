<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

type RecentPost = {
  category: string
  date: string
  link: string
  title: string
}

const { theme } = useData()
const recentPosts = computed(
  () => (theme.value.recentPosts as RecentPost[] | undefined) ?? []
)

function formatDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(parsed)
}
</script>

<template>
  <section class="recent-posts">
    <div class="recent-posts__header">
      <h2>最近文章</h2>
      <p>按撰写日期降序显示，优先使用 frontmatter 中的 <code>date</code>。</p>
    </div>

    <ul v-if="recentPosts.length > 0" class="recent-posts__list">
      <li v-for="post in recentPosts.slice(0, 10)" :key="post.link" class="recent-posts__item">
        <span class="recent-posts__date">{{ formatDate(post.date) }}</span>
        <div class="recent-posts__meta">
          <span class="recent-posts__category">{{ post.category }}</span>
          <a class="recent-posts__link" :href="withBase(post.link)">{{ post.title }}</a>
        </div>
      </li>
    </ul>

    <p v-else class="recent-posts__empty">暂时还没有可展示的文章日期数据。</p>
  </section>
</template>

<style scoped>
.recent-posts {
  margin: 32px 0 20px;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: linear-gradient(180deg, var(--vp-c-bg-soft), var(--vp-c-bg));
}

.recent-posts__header h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.recent-posts__header p {
  margin: 0 0 18px;
  color: var(--vp-c-text-2);
}

.recent-posts__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.recent-posts__item {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: start;
  padding: 10px 0;
  border-top: 1px dashed var(--vp-c-divider);
}

.recent-posts__item:first-child {
  border-top: none;
  padding-top: 0;
}

.recent-posts__date {
  color: var(--vp-c-text-3);
  font-size: 14px;
  white-space: nowrap;
}

.recent-posts__link {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.recent-posts__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-posts__category {
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 600;
}

.recent-posts__link:hover {
  color: var(--vp-c-brand-1);
}

.recent-posts__empty {
  margin: 0;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .recent-posts__item {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
