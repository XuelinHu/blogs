<script setup lang="ts">
export type OutlineTreeItem = {
  children: OutlineTreeItem[]
  level: number
  link: string
  title: string
}

defineProps<{
  activeLink: string
  collapsedLinks: string[]
  items: OutlineTreeItem[]
}>()

defineEmits<{
  (event: 'item-click', value: Event): void
  (event: 'toggle-item', value: string): void
}>()
</script>

<template>
  <template v-for="item in items" :key="item.link">
    <li class="aside-page-outline__item">
      <div class="aside-page-outline__row">
        <button
          v-if="item.children.length > 0"
          class="aside-page-outline__branch-toggle"
          type="button"
          :aria-label="collapsedLinks.includes(item.link) ? '展开子目录' : '折叠子目录'"
          @click="$emit('toggle-item', item.link)"
        >
          {{ collapsedLinks.includes(item.link) ? '+' : '-' }}
        </button>
        <span v-else class="aside-page-outline__branch-placeholder" />

        <a
          class="aside-page-outline__link"
          :class="{ 'is-active': item.link === activeLink }"
          :href="item.link"
          :title="item.title"
          @click="$emit('item-click', $event)"
        >
          {{ item.title }}
        </a>
      </div>

      <ul
        v-if="item.children.length > 0 && !collapsedLinks.includes(item.link)"
        class="aside-page-outline__children"
      >
        <AsidePageOutlineTree
          :items="item.children"
          :active-link="activeLink"
          :collapsed-links="collapsedLinks"
          @item-click="$emit('item-click', $event)"
          @toggle-item="$emit('toggle-item', $event)"
        />
      </ul>
    </li>
  </template>
</template>
