import { createRouter, createWebHistory } from 'vue-router'
import WeatherMap from '../components/WeatherMap.vue'
import CityDetailView from '../views/CityDetailView.vue'
import AboutView from '../views/AboutView.vue'
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue'
import TermsView from '../views/TermsView.vue'
import ContactView from '../views/ContactView.vue'

const DEFAULT_DESCRIPTION = 'Previsão do tempo detalhada, radar interativo e alertas para cidades brasileiras.'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: WeatherMap,
      meta: {
        title: 'Mapa do Tempo',
        description: 'Mapa interativo com intensidade de chuva, temperatura, alertas e previsão hora a hora.'
      }
    },
    {
      path: '/city/:cityId',
      name: 'city-detail',
      component: CityDetailView,
      meta: {
        title: 'Detalhes da Cidade',
        description: 'Detalhes de chuva, temperatura e vento por cidade, com previsões horárias e alertas.'
      }
    },
    {
      path: '/sobre',
      name: 'about',
      component: AboutView,
      meta: {
        title: 'Sobre o VemChuva Brasil',
        description: 'Saiba como o VemChuva Brasil entrega previsões claras, mapa interativo e anúncios responsáveis.'
      }
    },
    {
      path: '/politica-de-privacidade',
      name: 'privacy',
      component: PrivacyPolicyView,
      meta: {
        title: 'Política de Privacidade',
        description: 'Entenda como tratamos dados, cookies, anúncios do Google AdSense e suas preferências.'
      }
    },
    {
      path: '/termos-de-uso',
      name: 'terms',
      component: TermsView,
      meta: {
        title: 'Termos de Uso',
        description: 'Regras de uso do VemChuva Brasil, responsabilidade sobre previsões e políticas de conteúdo.'
      }
    },
    {
      path: '/contato',
      name: 'contact',
      component: ContactView,
      meta: {
        title: 'Contato',
        description: 'Fale com o VemChuva Brasil para suporte, parcerias e dúvidas sobre privacidade e anúncios.'
      }
    }
  ],
  scrollBehavior() {
    // Sempre rolar para o topo ao navegar
    return { top: 0 }
  }
})

const updateMetaTag = (name: string, content: string) => {
  if (typeof document === 'undefined') return
  const head = document.head
  if (!head) return

  let tag = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

router.afterEach((to) => {
  if (typeof document === 'undefined') return

  const baseTitle = 'VemChuva Brasil'
  const routeTitle = typeof to.meta.title === 'string' ? to.meta.title : 'Previsão do Tempo'
  const description = typeof to.meta.description === 'string' ? to.meta.description : DEFAULT_DESCRIPTION

  document.title = `${routeTitle} | ${baseTitle}`
  updateMetaTag('description', description)

  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) {
    ogTitle.setAttribute('content', `${routeTitle} | ${baseTitle}`)
  }

  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription) {
    ogDescription.setAttribute('content', description)
  }
})

export default router
