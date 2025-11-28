import { createApp } from 'vue'
import './styles/index.scss'
import App from './App.vue'
import router from './router'
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'

// Inicializa Vercel Analytics e Speed Insights
inject()
injectSpeedInsights()

createApp(App).use(router).mount('#app')
