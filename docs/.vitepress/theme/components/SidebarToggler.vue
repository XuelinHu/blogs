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
  <div class="sidebar-toggler" role="group" aria-label="侧边栏分类展开状态">
    <button class="toggler-btn toggler-btn--expand" type="button" title="展开全部分类" @click="expandAll">
      <span class="toggler-btn__icon" aria-hidden="true"><i /><i /></span>
      <span class="toggler-btn__text">全部展开</span>
    </button>
    <button class="toggler-btn toggler-btn--collapse" type="button" title="收起全部分类" @click="collapseAll">
      <span class="toggler-btn__icon" aria-hidden="true"><i /><i /></span>
      <span class="toggler-btn__text">全部收起</span>
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
  gap: 2px;
  margin-bottom: 12px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 76%, transparent);
  border-radius: 11px;
  padding: 3px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--vp-c-bg-soft) 86%, var(--vp-c-bg)) 0%,
      color-mix(in srgb, var(--vp-c-bg) 94%, transparent) 100%
    );
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 18px rgb(15 23 42 / 0.035);
}

.toggler-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 31px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.toggler-btn__icon {
  position: relative;
  display: inline-flex;
  width: 11px;
  height: 12px;
  color: currentColor;
}

.toggler-btn__icon i {
  position: absolute;
  left: 2px;
  width: 7px;
  height: 7px;
  border-right: 1.35px solid currentColor;
  border-bottom: 1.35px solid currentColor;
}

.toggler-btn--expand .toggler-btn__icon i:first-child {
  top: -2px;
  transform: rotate(45deg);
}

.toggler-btn--expand .toggler-btn__icon i:last-child {
  top: 3px;
  transform: rotate(45deg);
}

.toggler-btn--collapse .toggler-btn__icon i:first-child {
  top: 0;
  transform: rotate(225deg);
}

.toggler-btn--collapse .toggler-btn__icon i:last-child {
  top: 5px;
  transform: rotate(225deg);
}

.toggler-btn:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  box-shadow: 0 3px 10px rgb(15 23 42 / 0.06);
}

.toggler-btn:active {
  background: color-mix(in srgb, var(--vp-c-brand-1) 8%, var(--vp-c-bg));
}

.toggler-btn--expand .toggler-btn__icon,
.toggler-btn--collapse .toggler-btn__icon {
  color: var(--vp-c-brand-1);
}

.toggler-btn__text {
  white-space: nowrap;
}
</style>
