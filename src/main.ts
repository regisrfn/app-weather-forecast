import { createApp } from 'vue'
import './styles/index.scss'
import App from './App.vue'
import router from './router'
import { initDatadogRUM } from './config/datadog'
import './composables/useTheme'

// Inicializar Datadog RUM
initDatadogRUM()

// Criar e montar a aplicação
createApp(App).use(router).mount('#app')
