/**
 * Definições de slots de anúncios e helpers para escolher o slot
 * com base no tamanho do criativo enviado.
 *
 * Substitua os `adSlotId` abaixo pelos IDs reais criados no AdSense.
 */

export type AdSize = [number, number]

export type AdSlotDefinition = {
  /**
   * Identificador interno para usar no componente.
   */
  key: string
  /**
   * ID do slot no AdSense (10 dígitos).
   */
  adSlotId: string
  /**
   * Tamanhos aceitos pelo slot.
   */
  sizes: AdSize[]
  /**
   * Marca slots responsivos (auto).
   */
  responsive?: boolean
  /**
   * Media query opcional para restringir a dispositivos.
   */
  mediaQuery?: string
}

export const AD_SLOTS: AdSlotDefinition[] = [
  {
    key: 'leaderboard',
    adSlotId: '2549813732',
    sizes: [
      [728, 90],
      [970, 250],
    ],
    mediaQuery: '(min-width: 1024px)',
  },
  {
    key: 'medium-rectangle',
    adSlotId: '2230991134',
    sizes: [
      [300, 250],
    ],
  },
  {
    key: 'mobile-banner',
    adSlotId: '6154580818',
    sizes: [
      [350, 50],
      [320, 100],
      [320, 50],
    ],
    mediaQuery: '(max-width: 767px)',
  },
  {
    key: 'responsive-auto',
    adSlotId: '1180072844',
    sizes: [],
    responsive: true,
  },
]

type ParsedSize = { width: number; height: number }

export const parseAdSize = (size?: string | AdSize): ParsedSize | null => {
  if (!size) return null
  if (Array.isArray(size)) {
    const [width, height] = size
    if (Number.isFinite(width) && Number.isFinite(height)) {
      return { width, height }
    }
    return null
  }

  const [wRaw, hRaw] = size.toLowerCase().split('x')
  const w = Number(wRaw)
  const h = Number(hRaw)
  if (Number.isFinite(w) && Number.isFinite(h)) {
    return { width: w, height: h }
  }

  return null
}

const matchesMedia = (query: string, viewportWidth: number): boolean => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia(query).matches
    } catch {
      // segue para fallback simplificado
    }
  }

  const min = query.match(/min-width:\s*(\d+)px/)
  const max = query.match(/max-width:\s*(\d+)px/)

  if (min && viewportWidth < Number(min[1])) return false
  if (max && viewportWidth > Number(max[1])) return false

  return true
}

/**
 * Escolhe o slot mais adequado para um tamanho de criativo informado.
 */
export const resolveSlotForSize = (
  size?: string | AdSize,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280,
): AdSlotDefinition | undefined => {
  const requested = parseAdSize(size)
  const candidates = AD_SLOTS.filter((slot) => !slot.mediaQuery || matchesMedia(slot.mediaQuery, viewportWidth))

  if (!requested) {
    return candidates.find((slot) => slot.responsive) ?? candidates[0]
  }

  const exact = candidates.find((slot) =>
    slot.sizes.some(([width, height]) => width === requested.width && height === requested.height),
  )
  if (exact) return exact

  const fits = candidates.find((slot) =>
    slot.sizes.some(([width, height]) => width >= requested.width && height >= requested.height),
  )
  if (fits) return fits

  return candidates.find((slot) => slot.responsive) ?? candidates[0]
}

/**
 * Escolhe qual tamanho usar dentro de um slot (para definir largura/altura).
 */
export const pickSlotSize = (slot: AdSlotDefinition, requestedSize?: string | AdSize): AdSize | undefined => {
  if (!slot.sizes.length) return undefined

  const requested = parseAdSize(requestedSize)
  if (!requested) return slot.sizes[0]

  const exact = slot.sizes.find(([width, height]) => width === requested.width && height === requested.height)
  if (exact) return exact

  const fits = slot.sizes.find(([width, height]) => width >= requested.width && height >= requested.height)
  if (fits) return fits

  return slot.sizes[0]
}
