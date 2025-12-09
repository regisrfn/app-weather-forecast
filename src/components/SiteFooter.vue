<script setup lang="ts">
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-brand">
        <p class="footer-kicker">VemChuva Brasil</p>
        <h2>Previsão do tempo confiável e fácil de ler</h2>
        <p class="footer-description">
          Mapa interativo, alertas oficiais e previsões detalhadas para qualquer cidade brasileira.
          Atualizamos com frequência e mantemos uma experiência rápida, sem exigir login.
        </p>
        <div class="footer-contact">
          <span>Fale com a gente:</span>
          <a href="mailto:contato@vemchuvabrasil.com">contato@vemchuvabrasil.com</a>
        </div>
      </div>
      <div class="footer-links">
        <div class="footer-column">
          <h3>Institucional</h3>
          <RouterLink to="/">Mapa de previsão</RouterLink>
          <RouterLink to="/sobre">Sobre o projeto</RouterLink>
          <RouterLink to="/contato">Contato</RouterLink>
        </div>
        <div class="footer-column">
          <h3>Políticas</h3>
          <RouterLink to="/politica-de-privacidade">Política de Privacidade</RouterLink>
          <RouterLink to="/termos-de-uso">Termos de Uso</RouterLink>
          <a href="/ads.txt" target="_blank" rel="noopener">ads.txt</a>
        </div>
      </div>
    </div>
    <div class="footer-meta">
      <span>© {{ currentYear }} VemChuva Brasil</span>
      <span class="meta-separator">•</span>
    </div>
  </footer>
</template>
