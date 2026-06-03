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
const categoryThemes: Record<string, { start: string; end: string; rgb: string }> = {
  AI: { start: '#2563eb', end: '#06b6d4', rgb: '37, 99, 235' },
  LLM: { start: '#7c3aed', end: '#2563eb', rgb: '124, 58, 237' },
  Java: { start: '#ea580c', end: '#dc2626', rgb: '234, 88, 12' },
  Database: { start: '#16a34a', end: '#0d9488', rgb: '22, 163, 74' },
  Middleware: { start: '#0891b2', end: '#4f46e5', rgb: '8, 145, 178' },
  Spring: { start: '#65a30d', end: '#16a34a', rgb: '101, 163, 13' },
  Solution: { start: '#0f766e', end: '#2563eb', rgb: '15, 118, 110' },
  Test: { start: '#db2777', end: '#f59e0b', rgb: '219, 39, 119' },
  Command: { start: '#475569', end: '#2563eb', rgb: '71, 85, 105' },
  'Front-end': { start: '#f97316', end: '#ec4899', rgb: '249, 115, 22' },
  Python: { start: '#2563eb', end: '#f59e0b', rgb: '37, 99, 235' },
  Reading: { start: '#9333ea', end: '#db2777', rgb: '147, 51, 234' },
  Paper: { start: '#0d9488', end: '#84cc16', rgb: '13, 148, 136' },
  Mobile: { start: '#0284c7', end: '#22c55e', rgb: '2, 132, 199' },
  Net: { start: '#4f46e5', end: '#06b6d4', rgb: '79, 70, 229' },
  Sandbox: { start: '#b45309', end: '#dc2626', rgb: '180, 83, 9' },
  Web3: { start: '#7c3aed', end: '#14b8a6', rgb: '124, 58, 237' }
}
const fallbackTheme = { start: '#2563eb', end: '#0d9488', rgb: '37, 99, 235' }

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

function categoryStyle(post: RecentPost) {
  const theme = categoryThemes[post.category] ?? fallbackTheme
  return {
    '--post-start': theme.start,
    '--post-end': theme.end,
    '--post-rgb': theme.rgb
  }
}
</script>

<template>
  <section class="home-posts">
    <h2 class="home-posts__title">最新文章</h2>
    <div class="home-posts__list">
      <article v-for="post in visiblePosts" :key="post.link" class="post-card" :style="categoryStyle(post)">
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
  border-color: var(--post-start);
  box-shadow: 0 14px 32px rgba(var(--post-rgb), 0.14);
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
    linear-gradient(135deg, var(--post-start), var(--post-end)),
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
  background: rgba(var(--post-rgb), 0.18);
}

.post-card__category {
  font-size: 12px;
  font-weight: 600;
  color: var(--post-start);
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
