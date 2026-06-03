<script setup lang="ts">
import { withBase } from 'vitepress'

const milestones = [
  { label: 'AI', detail: '模型工具', start: '#2563eb', end: '#06b6d4', rgb: '37, 99, 235' },
  { label: 'LLM', detail: '训练评测', start: '#7c3aed', end: '#2563eb', rgb: '124, 58, 237' },
  { label: 'Java', detail: '后端基础', start: '#ea580c', end: '#dc2626', rgb: '234, 88, 12' },
  { label: '数据库', detail: '存储检索', start: '#16a34a', end: '#0d9488', rgb: '22, 163, 74' },
  { label: '分布式', detail: '系统设计', start: '#0891b2', end: '#4f46e5', rgb: '8, 145, 178' },
  { label: '测试', detail: '质量效率', start: '#db2777', end: '#f59e0b', rgb: '219, 39, 119' }
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
      <div class="hero-trail__vehicle" aria-hidden="true">
        <span class="hero-trail__smoke hero-trail__smoke--one"></span>
        <span class="hero-trail__smoke hero-trail__smoke--two"></span>
        <span class="hero-trail__smoke hero-trail__smoke--three"></span>
        <span class="hero-trail__beacon"></span>
        <span class="hero-trail__flash"></span>
        <span class="hero-trail__car-top"></span>
        <span class="hero-trail__car-body"></span>
        <span class="hero-trail__car-window"></span>
        <span class="hero-trail__wheel hero-trail__wheel--front"></span>
        <span class="hero-trail__wheel hero-trail__wheel--back"></span>
      </div>
      <div class="hero-trail__milestones">
        <div
          v-for="item in milestones"
          :key="item.label"
          class="hero-trail__milestone"
          :style="{ '--trail-start': item.start, '--trail-end': item.end, '--trail-rgb': item.rgb }"
        >
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
  background: linear-gradient(90deg, #2563eb, #7c3aed, #ea580c, #16a34a, #0891b2, #db2777);
}

.hero-trail__track::after {
  content: '';
  position: absolute;
  inset: -8px 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.86), transparent);
  transform: translateX(-100%);
  animation: track-light 3.8s ease-in-out infinite;
}

.hero-trail__vehicle {
  position: absolute;
  top: 90px;
  left: 26px;
  width: 74px;
  height: 44px;
  animation: vehicle-path 8s linear infinite;
}

.hero-trail__car-body,
.hero-trail__car-top,
.hero-trail__car-window,
.hero-trail__beacon,
.hero-trail__flash,
.hero-trail__smoke,
.hero-trail__wheel {
  position: absolute;
  display: block;
}

.hero-trail__car-body {
  left: 12px;
  bottom: 7px;
  width: 54px;
  height: 22px;
  border-radius: 8px 12px 7px 7px;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  box-shadow: inset 0 -4px 0 rgba(15, 23, 42, 0.18), 0 8px 16px rgba(37, 99, 235, 0.25);
}

.hero-trail__car-top {
  left: 28px;
  bottom: 25px;
  width: 26px;
  height: 14px;
  border-radius: 9px 9px 3px 3px;
  background: linear-gradient(135deg, #60a5fa, #2563eb);
}

.hero-trail__car-window {
  left: 34px;
  bottom: 28px;
  width: 14px;
  height: 8px;
  border-radius: 6px 6px 2px 2px;
  background: rgba(255, 255, 255, 0.82);
}

.hero-trail__wheel {
  bottom: 2px;
  width: 13px;
  height: 13px;
  border: 3px solid #0f172a;
  border-radius: 50%;
  background: #f8fafc;
  animation: wheel-spin 0.52s linear infinite;
}

.hero-trail__wheel--front {
  left: 50px;
}

.hero-trail__wheel--back {
  left: 18px;
}

.hero-trail__beacon {
  left: 40px;
  top: 1px;
  width: 10px;
  height: 8px;
  border-radius: 8px 8px 2px 2px;
  background: #f59e0b;
  box-shadow: 0 0 0 rgba(245, 158, 11, 0.5);
  animation: beacon-flash 0.8s ease-in-out infinite;
}

.hero-trail__flash {
  left: 44px;
  top: -5px;
  width: 22px;
  height: 18px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(250, 204, 21, 0.58), transparent 68%);
  animation: flash-pulse 0.8s ease-in-out infinite;
}

.hero-trail__smoke {
  left: 0;
  bottom: 15px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.28);
  filter: blur(0.2px);
  opacity: 0;
  animation: smoke-tail 1.15s ease-out infinite;
}

.hero-trail__smoke--two {
  bottom: 20px;
  animation-delay: 0.22s;
}

.hero-trail__smoke--three {
  bottom: 12px;
  animation-delay: 0.44s;
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
  background: linear-gradient(135deg, var(--trail-start), var(--trail-end));
  box-shadow: 0 0 0 4px rgba(var(--trail-rgb), 0.18);
}

.hero-trail__milestone strong,
.hero-trail__milestone small {
  display: block;
}

.hero-trail__milestone strong {
  font-size: 13px;
  line-height: 1.4;
  color: var(--trail-start);
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

@keyframes vehicle-path {
  from {
    left: 26px;
  }
  to {
    left: calc(100% - 72px);
  }
}

@keyframes wheel-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes beacon-flash {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(245, 158, 11, 0);
    opacity: 0.65;
  }

  50% {
    box-shadow: 0 0 18px rgba(245, 158, 11, 0.95);
    opacity: 1;
  }
}

@keyframes flash-pulse {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.72);
  }

  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}

@keyframes smoke-tail {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.4);
  }

  22% {
    opacity: 0.8;
  }

  100% {
    opacity: 0;
    transform: translate(-30px, -10px) scale(1.6);
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
    background: linear-gradient(180deg, #2563eb, #7c3aed, #ea580c, #16a34a, #0891b2, #db2777);
  }

  .hero-trail__vehicle {
    display: block;
    top: 42px;
    left: 8px;
    transform: scale(0.72);
    transform-origin: top left;
    animation: vehicle-path-mobile 8s linear infinite;
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

@keyframes vehicle-path-mobile {
  from {
    top: 42px;
  }
  to {
    top: calc(100% - 76px);
  }
}
</style>
