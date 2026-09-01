<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

type RobotPhase = 'greeting' | 'walking'

const milestones = [
  { label: '机器人', detail: '具身智能', href: '/posts/robot/', emoji: '🤖', start: '#0f766e', end: '#14b8a6', rgb: '15, 118, 110' },
  { label: 'AI', detail: '模型基础', href: '/posts/AI基础/', emoji: '🧠', start: '#2563eb', end: '#06b6d4', rgb: '37, 99, 235' },
  { label: 'LLM', detail: '训练评测', href: '/posts/LLM/', emoji: '✨', start: '#7c3aed', end: '#2563eb', rgb: '124, 58, 237' },
  { label: 'Java', detail: '后端基础', href: '/posts/Java/', emoji: '☕', start: '#ea580c', end: '#dc2626', rgb: '234, 88, 12' },
  { label: '数据库', detail: '存储检索', href: '/posts/Database/', emoji: '🗄️', start: '#16a34a', end: '#0d9488', rgb: '22, 163, 74' },
  { label: '测试', detail: '质量效率', href: '/posts/Test/', emoji: '✅', start: '#db2777', end: '#f59e0b', rgb: '219, 39, 119' }
]

const robotIndex = ref(0)
const activeIndex = ref(0)
const phase = ref<RobotPhase>('greeting')
let direction = 1
let animationTimer: ReturnType<typeof setTimeout> | undefined

const currentMilestone = computed(() => milestones[robotIndex.value])
const robotStyle = computed(() => ({
  '--robot-position': `${((robotIndex.value + 0.5) / milestones.length) * 100}%`,
  '--robot-accent': currentMilestone.value.start,
  '--robot-accent-rgb': currentMilestone.value.rgb
}))

function schedule(callback: () => void, delay: number) {
  window.clearTimeout(animationTimer)
  animationTimer = window.setTimeout(callback, delay)
}

function arrive() {
  if (phase.value !== 'walking') return

  activeIndex.value = robotIndex.value
  phase.value = 'greeting'
  schedule(walkToNextMilestone, 1450)
}

function walkToNextMilestone() {
  if (robotIndex.value === milestones.length - 1) direction = -1
  if (robotIndex.value === 0) direction = 1

  activeIndex.value = -1
  phase.value = 'walking'
  robotIndex.value += direction
  // transitionend 是正常到站信号；定时器只在浏览器漏发事件时兜底。
  schedule(arrive, 2000)
}

function handleRobotTransitionEnd(event: TransitionEvent) {
  // 子元素的过渡事件也会冒泡，只有机器人定位层自身结束移动才算真正到站。
  if (
    event.target !== event.currentTarget ||
    phase.value !== 'walking' ||
    !['left', 'top'].includes(event.propertyName)
  ) return
  arrive()
}

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    robotIndex.value = 2
    activeIndex.value = 2
    phase.value = 'greeting'
    return
  }

  schedule(walkToNextMilestone, 1200)
})

onUnmounted(() => window.clearTimeout(animationTimer))
</script>

<template>
  <section class="hero-trail" aria-labelledby="hero-trail-title">
    <div class="hero-trail__copy">
      <p class="hero-trail__eyebrow">TECH NOTES · KEEP EXPLORING</p>
      <h1 id="hero-trail-title" class="hero-trail__title">
        <span>技术博客与学习笔记</span>
      </h1>
      <p class="hero-trail__subtitle">
        从机器人与 AI 出发，持续记录模型、后端、数据与工程实践
      </p>
      <div class="hero-trail__actions">
        <a class="hero-trail__action hero-trail__action--primary" :href="withBase('/posts/robot/')">开始探索</a>
        <a class="hero-trail__action" href="https://github.com/XuelinHu">GitHub</a>
      </div>
    </div>

    <div class="hero-trail__map" aria-label="机器人巡游文章分类学习路线">
      <div class="hero-trail__map-label">
        <span class="hero-trail__live-dot" aria-hidden="true"></span>
        ROBOT TOUR
      </div>
      <div class="hero-trail__track" aria-hidden="true"></div>

      <div class="hero-trail__robot-lane" aria-hidden="true">
        <div
          class="hero-trail__robot"
          :class="[`is-${phase}`, { 'is-reversing': direction < 0, 'is-speech-left': robotIndex > 3 }]"
          :style="robotStyle"
          @transitionend="handleRobotTransitionEnd"
        >
          <span class="hero-trail__speech">嗨，{{ currentMilestone.label }}！</span>
          <svg class="hero-trail__robot-svg" viewBox="0 0 90 112" role="presentation">
            <g class="robot__head">
              <path class="robot__antenna" d="M45 12V5" />
              <circle class="robot__antenna-tip" cx="45" cy="4" r="3.5" />
              <rect class="robot__head-shell" x="18" y="12" width="54" height="39" rx="14" />
              <rect class="robot__face" x="24" y="19" width="42" height="25" rx="10" />
              <g class="robot__eyes">
                <ellipse cx="36" cy="30" rx="3.2" ry="4" />
                <ellipse cx="54" cy="30" rx="3.2" ry="4" />
              </g>
              <path class="robot__mouth robot__mouth--neutral" d="M40 38h10" />
              <path class="robot__mouth robot__mouth--smile" d="M38 36c2 7 12 7 14 0" />
            </g>
            <rect class="robot__neck" x="40" y="49" width="10" height="7" rx="3" />
            <rect class="robot__body" x="25" y="54" width="40" height="34" rx="12" />
            <rect class="robot__panel" x="34" y="62" width="22" height="14" rx="5" />
            <circle class="robot__panel-light" cx="40" cy="69" r="2.4" />
            <path class="robot__panel-line" d="M46 66h6M46 71h6" />
            <g class="robot__arm robot__arm--left">
              <rect x="17" y="57" width="10" height="29" rx="5" />
              <circle cx="22" cy="87" r="5" />
            </g>
            <g class="robot__arm robot__arm--wave">
              <rect x="63" y="57" width="10" height="29" rx="5" />
              <circle cx="68" cy="87" r="5" />
            </g>
            <g class="robot__leg robot__leg--left">
              <rect x="30" y="84" width="12" height="23" rx="6" />
              <rect x="25" y="103" width="18" height="7" rx="3.5" />
            </g>
            <g class="robot__leg robot__leg--right">
              <rect x="48" y="84" width="12" height="23" rx="6" />
              <rect x="47" y="103" width="18" height="7" rx="3.5" />
            </g>
          </svg>
          <span class="hero-trail__robot-shadow"></span>
        </div>
      </div>

      <div class="hero-trail__milestones">
        <a
          v-for="(item, index) in milestones"
          :key="item.label"
          class="hero-trail__milestone"
          :class="{ 'is-active': activeIndex === index }"
          :href="withBase(item.href)"
          :style="{ '--trail-start': item.start, '--trail-end': item.end, '--trail-rgb': item.rgb }"
        >
          <span class="hero-trail__pin"><span>{{ item.emoji }}</span></span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.detail }}</small>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-trail {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(440px, 1.1fr);
  gap: 42px;
  align-items: center;
  max-width: 1120px;
  margin: 48px auto 0;
  padding: 64px 24px 20px;
}

.hero-trail__copy {
  min-width: 0;
}

.hero-trail__eyebrow {
  margin: 0 0 12px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.hero-trail__title {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 48px;
  line-height: 1.12;
  letter-spacing: 0;
}

.hero-trail__title span {
  display: inline;
  color: transparent;
  background: linear-gradient(90deg, var(--vp-c-text-1), var(--vp-c-brand-1), #2563eb, var(--vp-c-text-1));
  background-size: 260% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: title-flow 6s ease-in-out infinite;
}

.hero-trail__subtitle {
  max-width: 560px;
  margin: 18px 0 0;
  color: var(--vp-c-text-2);
  font-size: 17px;
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
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 0 18px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s, transform 0.2s;
}

.hero-trail__action:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.hero-trail__action--primary {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  background: var(--vp-c-brand-1);
}

.hero-trail__map {
  position: relative;
  min-height: 292px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 20%, var(--vp-c-divider));
  border-radius: 18px;
  background:
    radial-gradient(circle at 82% 18%, rgb(124 58 237 / 0.13), transparent 28%),
    radial-gradient(circle at 12% 85%, rgb(20 184 166 / 0.15), transparent 34%),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--vp-c-bg) 86%, #dbeafe),
      color-mix(in srgb, var(--vp-c-bg) 86%, #ccfbf1)
    );
  box-shadow: 0 22px 54px rgb(15 23 42 / 0.1);
}

.hero-trail__map::after {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(37 99 235 / 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgb(37 99 235 / 0.055) 1px, transparent 1px);
  background-size: 30px 30px;
  pointer-events: none;
  content: '';
  mask-image: linear-gradient(to bottom, black, transparent 88%);
}

.hero-trail__map-label {
  position: absolute;
  z-index: 4;
  top: 18px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--vp-c-text-3);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.hero-trail__live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgb(34 197 94 / 0.14);
  animation: live-pulse 1.8s ease-in-out infinite;
}

.hero-trail__track {
  position: absolute;
  z-index: 1;
  top: 157px;
  right: 34px;
  left: 34px;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(90deg, #0f766e, #2563eb, #7c3aed, #ea580c, #16a34a, #db2777);
  box-shadow: 0 4px 12px rgb(37 99 235 / 0.18);
}

.hero-trail__track::after {
  position: absolute;
  inset: -7px 0;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.9), transparent);
  content: '';
  transform: translateX(-100%);
  animation: track-light 4.2s ease-in-out infinite;
}

.hero-trail__robot-lane {
  position: absolute;
  z-index: 3;
  top: 49px;
  right: 28px;
  left: 28px;
  height: 109px;
  pointer-events: none;
}

.hero-trail__robot {
  position: absolute;
  bottom: -2px;
  left: var(--robot-position);
  width: 68px;
  height: 92px;
  color: var(--robot-accent);
  filter: drop-shadow(0 10px 12px rgb(15 23 42 / 0.18));
  transform: translateX(-50%);
  transition: left 1.42s cubic-bezier(0.45, 0, 0.2, 1);
}

.hero-trail__robot-svg {
  position: relative;
  z-index: 2;
  display: block;
  width: 68px;
  height: 88px;
  overflow: visible;
}

.robot__antenna,
.robot__mouth,
.robot__panel-line {
  fill: none;
  stroke-linecap: round;
}

.robot__antenna {
  stroke: currentColor;
  stroke-width: 3;
}

.robot__antenna-tip,
.robot__head-shell,
.robot__body,
.robot__arm rect,
.robot__arm circle,
.robot__leg rect {
  fill: currentColor;
}

.robot__head-shell,
.robot__body {
  stroke: rgb(255 255 255 / 0.58);
  stroke-width: 1.5;
}

.robot__face,
.robot__panel {
  fill: #f8fafc;
}

.robot__neck {
  fill: #64748b;
}

.robot__eyes {
  fill: #0f172a;
  transform-origin: 45px 30px;
}

.robot__mouth {
  stroke: #0f172a;
  stroke-width: 2.4;
}

.robot__mouth--neutral {
  opacity: 1;
}

.robot__mouth--smile {
  opacity: 0;
}

.robot__panel-light {
  fill: #22c55e;
}

.robot__panel-line {
  stroke: #94a3b8;
  stroke-width: 2;
}

.robot__head,
.robot__arm,
.robot__leg {
  transform-box: fill-box;
}

.robot__head {
  transform-origin: center bottom;
}

.robot__arm {
  transform-origin: center 7px;
}

.robot__leg {
  transform-origin: center top;
}

.hero-trail__robot.is-walking .hero-trail__robot-svg {
  animation: robot-bob 0.48s ease-in-out infinite alternate;
}

.hero-trail__robot.is-walking .robot__leg--left,
.hero-trail__robot.is-walking .robot__arm--wave {
  animation: limb-forward 0.48s ease-in-out infinite alternate;
}

.hero-trail__robot.is-walking .robot__leg--right,
.hero-trail__robot.is-walking .robot__arm--left {
  animation: limb-back 0.48s ease-in-out infinite alternate;
}

.hero-trail__robot.is-greeting .robot__head {
  animation: head-turn 1.35s ease-in-out both;
}

.hero-trail__robot.is-greeting .robot__eyes {
  animation: happy-eyes 1.35s ease-in-out both;
}

.hero-trail__robot.is-greeting .robot__mouth--neutral {
  opacity: 0;
}

.hero-trail__robot.is-greeting .robot__mouth--smile {
  opacity: 1;
  animation: smile-pop 1.35s ease-in-out both;
}

.hero-trail__robot.is-greeting .robot__arm--wave {
  animation: arm-wave 0.42s ease-in-out 0.18s 3 alternate;
}

.hero-trail__speech {
  position: absolute;
  z-index: 5;
  top: -20px;
  left: 52px;
  min-width: max-content;
  border: 1px solid rgb(var(--robot-accent-rgb) / 0.25);
  border-radius: 12px 12px 12px 3px;
  padding: 6px 9px;
  color: var(--robot-accent);
  background: color-mix(in srgb, var(--vp-c-bg) 94%, transparent);
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.12);
  font-size: 11px;
  font-weight: 800;
  opacity: 0;
  transform: translate(-4px, 5px) scale(0.82);
  transition: opacity 0.2s ease, transform 0.24s ease;
}

.hero-trail__robot.is-greeting .hero-trail__speech {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

.hero-trail__robot.is-speech-left .hero-trail__speech {
  right: 52px;
  left: auto;
  border-radius: 12px 12px 3px 12px;
}

.hero-trail__robot-shadow {
  position: absolute;
  z-index: 1;
  right: 8px;
  bottom: 0;
  left: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(15 23 42 / 0.18);
  filter: blur(3px);
}

.hero-trail__milestones {
  position: absolute;
  z-index: 4;
  top: 154px;
  right: 28px;
  left: 28px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px;
}

.hero-trail__milestone {
  position: relative;
  min-width: 0;
  padding-top: 27px;
  color: #0f172a;
  text-align: center;
  text-decoration: none;
}

.hero-trail__pin {
  position: absolute;
  top: -10px;
  left: calc(50% - 11px);
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 3px solid #ffffff;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--trail-start), var(--trail-end));
  box-shadow: 0 0 0 4px rgb(var(--trail-rgb) / 0.15);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.hero-trail__pin span {
  font-size: 10px;
  line-height: 1;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.2s ease, transform 0.25s ease;
}

.hero-trail__milestone:hover .hero-trail__pin,
.hero-trail__milestone.is-active .hero-trail__pin {
  box-shadow: 0 0 0 7px rgb(var(--trail-rgb) / 0.18), 0 0 22px rgb(var(--trail-rgb) / 0.38);
  transform: scale(1.12);
}

.hero-trail__milestone:hover .hero-trail__pin span,
.hero-trail__milestone.is-active .hero-trail__pin span {
  opacity: 1;
  transform: scale(1);
}

.hero-trail__milestone strong,
.hero-trail__milestone small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-trail__milestone strong {
  color: var(--trail-start);
  font-size: 13px;
  line-height: 1.4;
}

.hero-trail__milestone small {
  margin-top: 3px;
  color: var(--vp-c-text-3);
  font-size: 10px;
  line-height: 1.35;
}

@keyframes title-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes live-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgb(34 197 94 / 0.12); opacity: 0.72; }
  50% { box-shadow: 0 0 0 7px rgb(34 197 94 / 0); opacity: 1; }
}

@keyframes track-light {
  0% { transform: translateX(-100%); }
  55%, 100% { transform: translateX(100%); }
}

@keyframes robot-bob {
  from { transform: translateY(0) rotate(-1deg); }
  to { transform: translateY(-3px) rotate(1deg); }
}

@keyframes limb-forward {
  from { transform: rotate(-15deg); }
  to { transform: rotate(16deg); }
}

@keyframes limb-back {
  from { transform: rotate(16deg); }
  to { transform: rotate(-15deg); }
}

@keyframes head-turn {
  0%, 100% { transform: rotate(0) scaleX(1); }
  28% { transform: rotate(-8deg) scaleX(0.9); }
  58%, 82% { transform: rotate(7deg) scaleX(1); }
}

@keyframes happy-eyes {
  0%, 20%, 100% { transform: scaleY(1); }
  38%, 72% { transform: scaleY(0.35); }
}

@keyframes smile-pop {
  0%, 15%, 100% { transform: scale(0.75); }
  42%, 82% { transform: scale(1.15); }
}

@keyframes arm-wave {
  from { transform: rotate(0); }
  to { transform: rotate(-58deg); }
}

@media (max-width: 980px) {
  .hero-trail {
    grid-template-columns: 1fr;
    gap: 30px;
    margin-top: 24px;
    padding-top: 40px;
  }

  .hero-trail__title { font-size: 38px; }
  .hero-trail__subtitle { font-size: 16px; }
}

@media (max-width: 640px) {
  .hero-trail {
    padding: 32px 18px 12px;
  }

  .hero-trail__title { font-size: 30px; }

  .hero-trail__map {
    min-height: 454px;
  }

  .hero-trail__track {
    top: 60px;
    right: auto;
    bottom: 34px;
    left: 61px;
    width: 5px;
    height: auto;
    background: linear-gradient(180deg, #0f766e, #2563eb, #7c3aed, #ea580c, #16a34a, #db2777);
  }

  .hero-trail__robot-lane {
    top: 52px;
    right: auto;
    bottom: 35px;
    left: 10px;
    width: 78px;
    height: auto;
  }

  .hero-trail__robot {
    top: var(--robot-position);
    bottom: auto;
    left: 0;
    transform: translateY(-50%) scale(0.68);
    transform-origin: center;
    transition: top 1.42s cubic-bezier(0.45, 0, 0.2, 1);
  }

  .hero-trail__speech {
    top: -11px;
    left: 62px;
  }

  .hero-trail__milestones {
    top: 50px;
    right: 20px;
    bottom: 28px;
    left: 50px;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: 0;
  }

  .hero-trail__milestone {
    min-height: 48px;
    padding: 6px 0 0 54px;
    text-align: left;
  }

  .hero-trail__pin {
    top: 8px;
    left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-trail__title span,
  .hero-trail__live-dot,
  .hero-trail__track::after,
  .hero-trail__robot,
  .hero-trail__robot-svg,
  .robot__head,
  .robot__eyes,
  .robot__mouth,
  .robot__arm,
  .robot__leg {
    animation: none !important;
    transition: none !important;
  }
}
</style>
