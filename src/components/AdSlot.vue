<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { AD_SLOTS, pickSlotSize, resolveSlotForSize, type AdSize } from '../config/adSlots'
import { ensureAdsenseScript, requestAdsenseRender } from '../utils/adsense'

const props = withDefaults(
  defineProps<{
    /**
     * ID interno do slot (opcional). Se não informado, o componente tenta
     * resolver pelo tamanho do criativo recebido.
     */
    slotKey?: string
    /**
     * Tamanho do criativo (ex: "300x250" ou [300, 250]).
     */
    size?: string | AdSize
  }>(),
  {
    slotKey: undefined,
    size: undefined,
  },
)

const adClientId = (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined) || ''
const adRenderKey = ref(0)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)

const selectedSlot = computed(() => {
  if (props.slotKey) {
    return AD_SLOTS.find((slot) => slot.key === props.slotKey)
  }

  return resolveSlotForSize(props.size, viewportWidth.value)
})

const selectedSize = computed(() => {
  if (!selectedSlot.value) return undefined
  return pickSlotSize(selectedSlot.value, props.size)
})

const insStyle = computed(() => {
  if (!selectedSlot.value) return {}
  if (selectedSlot.value.responsive) {
    return {
      display: 'block',
      width: '100%',
    }
  }

  if (selectedSize.value) {
    return {
      display: 'inline-block',
      width: `${selectedSize.value[0]}px`,
      height: `${selectedSize.value[1]}px`,
    }
  }

  return {
    display: 'block',
    width: '100%',
    minHeight: '90px',
  }
})

const renderAd = async () => {
  if (!adClientId || !selectedSlot.value) return

  try {
    await ensureAdsenseScript(adClientId)
    adRenderKey.value += 1
    await nextTick()
    requestAdsenseRender()
  } catch (error) {
    console.warn('Não foi possível renderizar o anúncio', error)
  }
}

const handleResize = () => {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  renderAd()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(selectedSlot, () => renderAd())
watch(
  () => props.size,
  () => renderAd(),
)
</script>

<template>
  <div v-if="adClientId && selectedSlot" class="ad-slot" :data-slot-key="selectedSlot.key">
    <ins
      :key="adRenderKey"
      class="adsbygoogle"
      :style="insStyle"
      :data-ad-client="adClientId"
      :data-ad-slot="selectedSlot.adSlotId"
      :data-ad-format="selectedSlot.responsive ? 'auto' : 'rectangle'"
      :data-full-width-responsive="selectedSlot.responsive ? 'true' : undefined"
      :data-ad-layout-key="selectedSlot.key"
    />
  </div>
</template>

<style scoped lang="scss">
.ad-slot {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}
</style>
