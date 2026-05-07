<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

type RecentPost = {
  category: string
  date: string
  excerpt: string
  link: string
  title: string
}

const { theme } = useData()
const recentPosts = computed(
  () => (theme.value.recentPosts as RecentPost[] | undefined) ?? []
)
const visiblePosts = computed(() => recentPosts.value.slice(0, 6))

function formatDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed)
}
</script>

<template>
  <section class="home-posts">
    <h2 class="home-posts__title">最新文章</h2>
    <div class="home-posts__list">
      <article v-for="post in visiblePosts" :key="post.link" class="post-card">
        <a class="post-card__link" :href="withBase(post.link)">
          <div class="post-card__main">
            <span class="post-card__category">{{ post.category }}</span>
            <h3 class="post-card__title">{{ post.title }}</h3>
            <p class="post-card__excerpt">{{ post.excerpt }}</p>
          </div>
          <time class="post-card__date">{{ formatDate(post.date) }}</time>
        </a>
      </article>
    </div>
    <p v-if="recentPosts.length === 0" class="home-posts__empty">还没有文章。</p>
  </section>
</template>

<style scoped>
.home-posts {
  max-width: 960px;
  margin: 48px auto 0;
  padding: 0 24px;
}

.home-posts__title {
  margin: 0 0 24px;
  font-size: 22px;
  font-weight: 700;
}

.home-posts__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.post-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.post-card__link {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 20px;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.post-card__main {
  min-width: 0;
}

.post-card__category {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.post-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

.post-card__excerpt {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.post-card__date {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
  padding-top: 2px;
  white-space: nowrap;
}

.home-posts__empty {
  color: var(--vp-c-text-2);
  text-align: center;
}

@media (max-width: 768px) {
  .post-card__link {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
