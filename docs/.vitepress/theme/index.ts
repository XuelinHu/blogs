import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import RecentPosts from './components/RecentPosts.vue'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('RecentPosts', RecentPosts)
  }
}

export default theme
