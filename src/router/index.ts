import { createRouter, createWebHistory } from 'vue-router'
import WeatherMap from '../components/WeatherMap.vue'
import CityDetailView from '../views/CityDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: WeatherMap,
      meta: {
        title: 'Mapa do Tempo'
      }
    },
    {
      path: '/city/:cityId',
      name: 'city-detail',
      component: CityDetailView,
      meta: {
        title: 'Detalhes da Cidade'
      }
    }
  ],
  scrollBehavior() {
    // Sempre rolar para o topo ao navegar
    return { top: 0 }
  }
})

export default router
