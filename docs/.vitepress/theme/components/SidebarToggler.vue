<script setup lang="ts">
function expandAll() {
  document.querySelectorAll('.VPSidebarItem.level-0.collapsible.collapsed').forEach((el) => {
    const caret = el.querySelector('.caret') as HTMLElement | null
    if (caret) caret.click()
  })
}

function collapseAll() {
  document.querySelectorAll('.VPSidebarItem.level-0.collapsible:not(.collapsed)').forEach((el) => {
    const caret = el.querySelector('.caret') as HTMLElement | null
    if (caret) caret.click()
  })
}
</script>

<template>
  <div class="sidebar-toggler">
    <button class="toggler-btn toggler-btn--expand" @click="expandAll">
      <span class="toggler-btn__icon" aria-hidden="true">+</span>
      <span class="toggler-btn__text">展开全部</span>
    </button>
    <button class="toggler-btn toggler-btn--collapse" @click="collapseAll">
      <span class="toggler-btn__icon" aria-hidden="true">-</span>
      <span class="toggler-btn__text">折叠全部</span>
    </button>
  </div>
</template>

<style scoped>
.sidebar-toggler {
  position: sticky;
  top: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 0 14px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--vp-c-bg) 96%, transparent) 0%,
      color-mix(in srgb, var(--vp-c-bg) 92%, transparent) 68%,
      transparent 100%
    );
  backdrop-filter: blur(12px);
}

.toggler-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 78%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--vp-c-bg-soft));
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.04);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.toggler-btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  font-size: 13px;
  line-height: 1;
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
}

.toggler-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 42%, var(--vp-c-divider));
  background: var(--vp-c-bg);
  box-shadow: 0 12px 26px rgb(15 23 42 / 0.08);
  transform: translateY(-1px);
}

.toggler-btn:active {
  transform: translateY(0);
}

.toggler-btn--expand .toggler-btn__icon,
.toggler-btn--collapse .toggler-btn__icon {
  color: var(--vp-c-brand-1);
}

.toggler-btn__text {
  white-space: nowrap;
}
</style>
