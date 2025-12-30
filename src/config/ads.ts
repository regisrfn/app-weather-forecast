export type AdSize = {
  /**
   * Largura mínima de viewport (px) para usar este tamanho
   */
  minWidth: number;
  /**
   * Largura fixa do bloco
   */
  width: number;
  /**
   * Altura fixa do bloco
   */
  height: number;
  /**
   * ID do slot do AdSense a ser usado neste breakpoint
   */
  slotId?: string;
};

export const ADSENSE_CLIENT = 'ca-pub-5677395868811418';

export const AD_SLOT_IDS = {
  top: {
    desktop: '6154580818', // 970x90
    tablet: '7399148217', // 728x90
    mobile: '1180072844', // 320x100
  },
  middle: {
    desktop: '2230991134', // 336x280
    mobile: '2549813732', // 300x250
  },
  sidebar: {
    desktop: '7418997036', // 300x600
    mobile: '2836236614', // 300x250
  },
} as const;

/**
 * Tamanhos recomendados para cada posição fixa de anúncio.
 * Substitua os IDs acima pelos slots criados no AdSense.
 */
export const AD_SIZE_PRESETS: Record<'top' | 'middle' | 'sidebar', AdSize[]> = {
  top: [
    { minWidth: 1280, width: 970, height: 90, slotId: AD_SLOT_IDS.top.desktop },
    { minWidth: 900, width: 728, height: 90, slotId: AD_SLOT_IDS.top.tablet },
    { minWidth: 0, width: 320, height: 100, slotId: AD_SLOT_IDS.top.mobile },
  ],
  middle: [
    { minWidth: 1024, width: 336, height: 280, slotId: AD_SLOT_IDS.middle.desktop },
    { minWidth: 0, width: 300, height: 250, slotId: AD_SLOT_IDS.middle.mobile },
  ],
  sidebar: [
    { minWidth: 1280, width: 300, height: 250, slotId: AD_SLOT_IDS.sidebar.desktop },
    { minWidth: 0, width: 300, height: 250, slotId: AD_SLOT_IDS.sidebar.mobile },
  ],
};
