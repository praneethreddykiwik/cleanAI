/**
 * CleanAI Design System — Glass Tokens
 * iOS 26 Liquid Glass × Apple HIG × Material You
 */

// Blur levels
export const blurScale = {
  none:  '0px',
  xs:    '4px',
  sm:    '8px',
  md:    '12px',
  lg:    '16px',
  xl:    '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '60px',
} as const;

// Saturation applied alongside blur
export const saturationScale = {
  none:   '1',
  subtle: '1.1',
  medium: '1.2',
  high:   '1.4',
  vivid:  '1.8',
} as const;

/**
 * Glass Levels — ordered from most transparent to most opaque
 *
 * L1 — Navigation surfaces: header, sidebar (most thin / transparent)
 * L2 — Content cards, section panels
 * L3 — Floating panels: dropdowns, notification drawer
 * L4 — Modals, command palettes (most opaque / elevated)
 */
export const glassPresets = {
  light: {
    l1: {
      background: 'rgba(255, 255, 255, 0.58)',
      backdropFilter: 'blur(20px) saturate(1.2)',
      border: '1px solid rgba(255, 255, 255, 0.50)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 4px 16px rgba(0,0,0,0.04)',
    },
    l2: {
      background: 'rgba(255, 255, 255, 0.72)',
      backdropFilter: 'blur(14px) saturate(1.15)',
      border: '1px solid rgba(255, 255, 255, 0.55)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 2px 8px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.03)',
    },
    l3: {
      background: 'rgba(255, 255, 255, 0.82)',
      backdropFilter: 'blur(18px) saturate(1.3)',
      border: '1px solid rgba(255, 255, 255, 0.65)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.95) inset, 0 8px 24px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.04)',
    },
    l4: {
      background: 'rgba(255, 255, 255, 0.90)',
      backdropFilter: 'blur(24px) saturate(1.4)',
      border: '1px solid rgba(255, 255, 255, 0.72)',
      boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 16px 40px rgba(0,0,0,0.10), 0 32px 64px rgba(0,0,0,0.06)',
    },
  },
  dark: {
    l1: {
      background: 'rgba(8, 12, 22, 0.60)',
      backdropFilter: 'blur(20px) saturate(1.15)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 16px rgba(0,0,0,0.30)',
    },
    l2: {
      background: 'rgba(10, 14, 26, 0.72)',
      backdropFilter: 'blur(14px) saturate(1.10)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 2px 8px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.30)',
    },
    l3: {
      background: 'rgba(12, 18, 32, 0.80)',
      backdropFilter: 'blur(18px) saturate(1.18)',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset, 0 8px 24px rgba(0,0,0,0.50), 0 20px 40px rgba(0,0,0,0.30)',
    },
    l4: {
      background: 'rgba(16, 22, 40, 0.88)',
      backdropFilter: 'blur(24px) saturate(1.20)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 16px 40px rgba(0,0,0,0.60), 0 32px 64px rgba(0,0,0,0.40)',
    },
  },
} as const;

// Noise texture overlay — adds grain to glass (subtle)
export const glassNoise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`;

// CSS class mappings — matches globals.css class names
export const glassCssClasses = {
  l1: 'glass-1',
  l2: 'glass-2',
  l3: 'glass-3',
  l4: 'glass-4',
  base: 'glass',
} as const;

export type GlassLevel = 1 | 2 | 3 | 4;
export type BlurKey = keyof typeof blurScale;
