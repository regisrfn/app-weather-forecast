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
  },
  build: {
    // Gerar sourcemaps para facilitar debug em produção
    sourcemap: true,
    // CSS code splitting para melhor cache
    cssCodeSplit: true,
    // Não fazer inline de assets pequenos
    assetsInlineLimit: 0,
    // Target moderno mas com boa compatibilidade
    target: 'es2015',
    // Minificação otimizada
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Separar CSS por componente para melhor cache
        manualChunks: {
          'vendor': ['vue', 'axios'],
          'leaflet': ['leaflet'],
          'localforage': ['localforage']
        },
        // Nomes consistentes para assets
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  css: {
    // Garantir que PostCSS processe corretamente
    postcss: {
      plugins: []
    }
  }
})
