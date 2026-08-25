<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = withDefaults(defineProps<{
  height?: number
  src: string
  title: string
}>(), {
  height: 500
})

const resolvedSrc = computed(() => withBase(props.src))
const frameStyle = computed(() => ({ minHeight: `${props.height}px` }))
</script>

<template>
  <div class="teaching-demo">
    <iframe
      :src="resolvedSrc"
      :title="title"
      :style="frameStyle"
      loading="lazy"
      sandbox="allow-scripts"
    />
  </div>
</template>

<style scoped>
.teaching-demo {
  width: 100%;
  margin: 18px 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.teaching-demo iframe {
  display: block;
  width: 100%;
  border: 0;
  background: #f7faf9;
}

@media (max-width: 640px) {
  .teaching-demo {
    margin-right: -4px;
    margin-left: -4px;
    width: calc(100% + 8px);
  }
}
</style>
