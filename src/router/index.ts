import { createRouter, createWebHistory } from 'vue-router'
import WeatherMap from '../components/WeatherMap.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: WeatherMap
    }
  ]
})

export default router
