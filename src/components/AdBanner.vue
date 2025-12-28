<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

const AD_CLIENT_ID = 'ca-pub-5677395868811418'

const props = defineProps<{
  slotId: string
  label?: string
}>()

const adRef = ref<HTMLElement | null>(null)

const renderAd = () => {
  if (typeof window === 'undefined' || !adRef.value) return

  const adElement = adRef.value
  adElement.innerHTML = ''
  adElement.removeAttribute('data-ad-status')

  try {
    const adsbygoogle = ((window as any).adsbygoogle = (window as any).adsbygoogle || [])
    adsbygoogle.push({})
  } catch (error) {
    console.warn('Falha ao inicializar anúncio AdSense:', error)
  }
}

onMounted(() => {
  nextTick(renderAd)
})
</script>

<template>
  <div class="ad-banner">
    <div v-if="props.label" class="ad-banner__label">{{ props.label }}</div>
    <ins
      ref="adRef"
      class="adsbygoogle ad-banner__slot"
      style="display:block"
      :data-ad-client="AD_CLIENT_ID"
      :data-ad-slot="props.slotId"
      data-ad-format="auto"
      data-full-width-responsive="true"
      aria-label="Bloco de anúncio"
    />
  </div>
</template>
