const ADSENSE_SCRIPT_ID = 'google-adsense-script'
let scriptPromise: Promise<void> | null = null

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/**
 * Garante que o script do AdSense seja carregado apenas uma vez.
 */
export const ensureAdsenseScript = (adClientId: string): Promise<void> => {
  if (!adClientId) {
    return Promise.reject(new Error('AdSense client ID não configurado'))
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve()
  }

  if (scriptPromise) return scriptPromise

  const existingScript = document.getElementById(ADSENSE_SCRIPT_ID)
  if (existingScript) {
    scriptPromise = Promise.resolve()
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = ADSENSE_SCRIPT_ID
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adClientId)}`
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar o script do AdSense'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * Solicita o render do anúncio no slot atual.
 */
export const requestAdsenseRender = (): void => {
  if (typeof window === 'undefined') return

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window.adsbygoogle as any[] | undefined)?.push({})
  } catch (error) {
    console.warn('Erro ao solicitar render do AdSense', error)
  }
}

