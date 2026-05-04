<script setup lang="ts">
function expandAll() {
  document.querySelectorAll('.VPSidebarGroup.collapsed').forEach((el) => {
    const summary = el.querySelector('summary') as HTMLElement | null
    if (summary) summary.click()
  })
}

function collapseAll() {
  document.querySelectorAll('.VPSidebarGroup:not(.collapsed)').forEach((el) => {
    const summary = el.querySelector('summary') as HTMLElement | null
    if (summary) summary.click()
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
  display: flex;
  gap: 6px;
  padding: 0 0 12px;
}

.toggler-btn {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.toggler-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
</style>
