import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import RecentPosts from './components/RecentPosts.vue'

const theme: Theme = {
  Layout,
  enhanceApp({ app }) {
    app.component('RecentPosts', RecentPosts)
  }
}

export default theme
