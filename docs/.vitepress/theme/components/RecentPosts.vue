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

function visualLabel(post: RecentPost): string {
  const trimmed = post.category.trim()
  if (trimmed.length <= 8) return trimmed
  return trimmed.slice(0, 8)
}
</script>

<template>
  <section class="home-posts">
    <h2 class="home-posts__title">最新文章</h2>
    <div class="home-posts__list">
      <article v-for="post in visiblePosts" :key="post.link" class="post-card">
        <a class="post-card__link" :href="withBase(post.link)">
          <div class="post-card__visual" aria-hidden="true">
            <span class="post-card__visual-label">{{ visualLabel(post) }}</span>
            <span class="post-card__visual-sub">NOTE</span>
            <span class="post-card__visual-dot"></span>
          </div>
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
  max-width: 1080px;
  margin: 52px auto 0;
  padding: 0 24px;
}

.home-posts__title {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
}

.home-posts__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.post-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  overflow: hidden;
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.post-card__link {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 18px;
  padding: 14px;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.post-card__visual {
  position: relative;
  flex: 0 0 150px;
  min-height: 128px;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  border-radius: 8px;
  padding: 16px;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.98), rgba(13, 148, 136, 0.96)),
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0 1px, transparent 1px 12px);
}

.post-card__visual::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
  transform: translateX(-130%);
  transition: transform 0.35s;
}

.post-card:hover .post-card__visual::before {
  animation: visual-sweep 1.6s ease-in-out infinite;
}

.post-card__visual::after {
  content: '';
  position: absolute;
  right: -26px;
  top: -24px;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}

.post-card__visual-label {
  position: relative;
  z-index: 1;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0;
}

.post-card__visual-sub {
  position: relative;
  z-index: 1;
  margin-top: 7px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  opacity: 0.8;
}

.post-card__visual-dot {
  position: absolute;
  left: 14px;
  top: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 16px 0 0 rgba(255, 255, 255, 0.62), 32px 0 0 rgba(255, 255, 255, 0.34);
}

.post-card__main {
  flex: 1 1 auto;
  min-width: 0;
  border-radius: 8px;
  padding: 9px 10px;
  transition: background-color 0.2s;
}

.post-card:hover .post-card__main {
  background: #eff6ff;
}

:global(.dark) .post-card:hover .post-card__main {
  background: rgba(37, 99, 235, 0.18);
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
  padding: 11px 4px 0 0;
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

  .post-card__visual {
    flex: 0 0 auto;
    min-height: 96px;
  }

  .post-card__date {
    padding: 0 10px 8px;
  }
}

@keyframes visual-sweep {
  from {
    transform: translateX(-130%);
  }
  to {
    transform: translateX(130%);
  }
}
</style>
