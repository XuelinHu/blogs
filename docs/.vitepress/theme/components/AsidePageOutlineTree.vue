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
          <span
            class="aside-page-outline__branch-icon"
            :class="{ 'is-collapsed': collapsedLinks.includes(item.link) }"
          />
        </button>
        <span v-else class="aside-page-outline__branch-spacer" />

        <a
          class="aside-page-outline__link"
          :class="{
            'is-active': item.link === activeLink,
            'is-child': item.level > 2
          }"
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

<style scoped>
.aside-page-outline__children {
  margin: 0;
  padding: 0 0 0 22px;
  list-style: none;
}

.aside-page-outline__item {
  margin: 0;
}

.aside-page-outline__row {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 30px;
}

.aside-page-outline__branch-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 999px;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.aside-page-outline__branch-toggle:hover {
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
}

.aside-page-outline__branch-icon {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid var(--vp-c-text-3);
  border-bottom: 1.5px solid var(--vp-c-text-3);
  transform: rotate(45deg);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.aside-page-outline__branch-toggle:hover .aside-page-outline__branch-icon {
  border-color: var(--vp-c-brand-1);
}

.aside-page-outline__branch-icon.is-collapsed {
  transform: rotate(-45deg);
}

.aside-page-outline__branch-spacer {
  width: 16px;
  height: 16px;
}

.aside-page-outline__link {
  display: block;
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  padding: 5px 8px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.45;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.aside-page-outline__link.is-child {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.aside-page-outline__link:hover {
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent);
  transform: translateX(1px);
}

.aside-page-outline__link.is-active {
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
  font-weight: 600;
}
</style>
