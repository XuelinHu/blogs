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
    <button class="toggler-btn" @click="expandAll">展开全部</button>
    <button class="toggler-btn" @click="collapseAll">折叠全部</button>
  </div>
</template>

<style scoped>
.sidebar-toggler {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 6px;
  padding: 8px 0 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 92%, transparent);
  backdrop-filter: blur(10px);
}

.toggler-btn {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.toggler-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  transform: translateY(-1px);
}
</style>
