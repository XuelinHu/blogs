<script setup lang="ts">
import { withBase } from 'vitepress'

const milestones = [
  { label: 'AI', detail: '模型工具' },
  { label: 'LLM', detail: '训练评测' },
  { label: 'Java', detail: '后端基础' },
  { label: '数据库', detail: '存储检索' },
  { label: '分布式', detail: '系统设计' },
  { label: '测试', detail: '质量效率' }
]
</script>

<template>
  <section class="hero-trail" aria-labelledby="hero-trail-title">
    <div class="hero-trail__copy">
      <p class="hero-trail__eyebrow">TECH NOTES</p>
      <h1 id="hero-trail-title" class="hero-trail__title">
        <span>技术博客与学习笔记</span>
      </h1>
      <p class="hero-trail__subtitle">
        记录 AI、Java、数据库、分布式系统等领域的技术积累
      </p>
      <div class="hero-trail__actions">
        <a class="hero-trail__action hero-trail__action--primary" :href="withBase('/posts/AI/')">浏览文章</a>
        <a class="hero-trail__action" href="https://github.com/XuelinHu">GitHub</a>
      </div>
    </div>

    <div class="hero-trail__map" aria-label="文章分类学习路线">
      <div class="hero-trail__track"></div>
      <div class="hero-trail__runner" aria-hidden="true">
        <span class="hero-trail__head"></span>
        <span class="hero-trail__body"></span>
        <span class="hero-trail__arm hero-trail__arm--front"></span>
        <span class="hero-trail__arm hero-trail__arm--back"></span>
        <span class="hero-trail__leg hero-trail__leg--front"></span>
        <span class="hero-trail__leg hero-trail__leg--back"></span>
      </div>
      <div class="hero-trail__milestones">
        <div v-for="item in milestones" :key="item.label" class="hero-trail__milestone">
          <span class="hero-trail__pin"></span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.detail }}</small>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-trail {
  max-width: 1080px;
  margin: 48px auto 0;
  padding: 64px 24px 20px;
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
  gap: 44px;
  align-items: center;
}

.hero-trail__copy {
  min-width: 0;
}

.hero-trail__eyebrow {
  margin: 0 0 12px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.hero-trail__title {
  margin: 0;
  font-size: 48px;
  line-height: 1.12;
  letter-spacing: 0;
  color: var(--vp-c-text-1);
}

.hero-trail__title span {
  display: inline;
  background: linear-gradient(90deg, var(--vp-c-text-1), var(--vp-c-brand-1), #2563eb, var(--vp-c-text-1));
  background-size: 260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: title-flow 6s ease-in-out infinite;
}

.hero-trail__subtitle {
  margin: 18px 0 0;
  max-width: 560px;
  color: var(--vp-c-text-2);
  font-size: 18px;
  line-height: 1.8;
}

.hero-trail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.hero-trail__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s, transform 0.2s;
}

.hero-trail__action:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-1px);
}

.hero-trail__action--primary {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.hero-trail__map {
  position: relative;
  min-height: 260px;
  border: 1px solid rgba(59, 130, 246, 0.18);
  border-radius: 10px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(219, 234, 254, 0.92), rgba(240, 253, 250, 0.96)),
    repeating-linear-gradient(90deg, rgba(37, 99, 235, 0.08) 0 1px, transparent 1px 48px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.hero-trail__map::before {
  content: '知识路线';
  position: absolute;
  top: 22px;
  left: 24px;
  color: rgba(15, 23, 42, 0.46);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.hero-trail__track {
  position: absolute;
  left: 34px;
  right: 34px;
  top: 128px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #60a5fa, #22c55e, #3b82f6);
}

.hero-trail__track::after {
  content: '';
  position: absolute;
  inset: -8px 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.86), transparent);
  transform: translateX(-100%);
  animation: track-light 3.8s ease-in-out infinite;
}

.hero-trail__runner {
  position: absolute;
  top: 78px;
  left: 26px;
  width: 46px;
  height: 68px;
  animation: runner-path 8s linear infinite;
}

.hero-trail__head,
.hero-trail__body,
.hero-trail__arm,
.hero-trail__leg {
  position: absolute;
  display: block;
  background: #1d4ed8;
}

.hero-trail__head {
  left: 16px;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.hero-trail__body {
  left: 20px;
  top: 20px;
  width: 8px;
  height: 26px;
  border-radius: 999px;
  transform: rotate(8deg);
}

.hero-trail__arm,
.hero-trail__leg {
  left: 22px;
  width: 6px;
  height: 24px;
  border-radius: 999px;
  transform-origin: top center;
}

.hero-trail__arm {
  top: 22px;
  height: 22px;
  background: #2563eb;
}

.hero-trail__arm--front {
  animation: limb-front 0.7s ease-in-out infinite;
}

.hero-trail__arm--back {
  animation: limb-back 0.7s ease-in-out infinite;
}

.hero-trail__leg {
  top: 43px;
  background: #0f766e;
}

.hero-trail__leg--front {
  animation: limb-back 0.7s ease-in-out infinite;
}

.hero-trail__leg--back {
  animation: limb-front 0.7s ease-in-out infinite;
}

.hero-trail__milestones {
  position: absolute;
  left: 28px;
  right: 28px;
  top: 126px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.hero-trail__milestone {
  position: relative;
  padding-top: 24px;
  text-align: center;
  color: #0f172a;
}

.hero-trail__pin {
  position: absolute;
  top: -9px;
  left: calc(50% - 9px);
  width: 18px;
  height: 18px;
  border: 3px solid #ffffff;
  border-radius: 50%;
  background: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.18);
}

.hero-trail__milestone strong,
.hero-trail__milestone small {
  display: block;
}

.hero-trail__milestone strong {
  font-size: 13px;
  line-height: 1.4;
}

.hero-trail__milestone small {
  margin-top: 4px;
  color: rgba(15, 23, 42, 0.62);
  font-size: 11px;
  line-height: 1.35;
}

@keyframes title-flow {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes track-light {
  0% {
    transform: translateX(-100%);
  }
  55%,
  100% {
    transform: translateX(100%);
  }
}

@keyframes runner-path {
  from {
    left: 26px;
  }
  to {
    left: calc(100% - 72px);
  }
}

@keyframes limb-front {
  0%,
  100% {
    transform: rotate(38deg);
  }
  50% {
    transform: rotate(-42deg);
  }
}

@keyframes limb-back {
  0%,
  100% {
    transform: rotate(-42deg);
  }
  50% {
    transform: rotate(38deg);
  }
}

@media (max-width: 960px) {
  .hero-trail {
    grid-template-columns: 1fr;
    gap: 28px;
    margin-top: 24px;
    padding-top: 40px;
  }

  .hero-trail__title {
    font-size: 36px;
  }

  .hero-trail__subtitle {
    font-size: 16px;
  }

  .hero-trail__map {
    min-height: 240px;
  }
}

@media (max-width: 640px) {
  .hero-trail {
    padding: 32px 18px 12px;
  }

  .hero-trail__title {
    font-size: 30px;
  }

  .hero-trail__map {
    min-height: 382px;
  }

  .hero-trail__track {
    left: 44px;
    right: auto;
    top: 58px;
    bottom: 32px;
    width: 4px;
    height: auto;
    background: linear-gradient(180deg, #60a5fa, #22c55e, #3b82f6);
  }

  .hero-trail__runner {
    display: none;
  }

  .hero-trail__milestones {
    left: 30px;
    right: 20px;
    top: 48px;
    display: flex;
    flex-direction: column;
    gap: 13px;
  }

  .hero-trail__milestone {
    min-height: 28px;
    padding: 0 0 0 42px;
    text-align: left;
  }

  .hero-trail__pin {
    left: 5px;
    top: 2px;
  }
}
</style>
