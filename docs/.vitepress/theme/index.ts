import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import HeroTrail from './components/HeroTrail.vue'
import RecentPosts from './components/RecentPosts.vue'
import TeachingDemo from './components/TeachingDemo.vue'

const theme: Theme = {
  Layout,
  enhanceApp({ app }) {
    app.component('HeroTrail', HeroTrail)
    app.component('RecentPosts', RecentPosts)
    app.component('TeachingDemo', TeachingDemo)
  }
}

export default theme
