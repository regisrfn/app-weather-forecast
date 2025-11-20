import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // Aceita conexões de qualquer IP da rede
    port: 5173,
    // Opcional: configurar strictPort para não mudar a porta se estiver ocupada
    strictPort: false,
  }
})
