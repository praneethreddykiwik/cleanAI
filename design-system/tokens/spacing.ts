/**
 * CleanAI Design System — Spacing Tokens
 * 8-point base grid
 */

// Raw scale (px values as numbers)
export const spacingScale = {
  0:   0,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  3.5: 14,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  9:   36,
  10:  40,
  11:  44,
  12:  48,
  14:  56,
  16:  64,
  18:  72,
  20:  80,
  24:  96,
  28:  112,
  32:  128,
  36:  144,
  40:  160,
  48:  192,
  56:  224,
  64:  256,
} as const;

// Named semantic aliases
export const space = {
  none:       0,
  hairline:   1,
  micro:      2,   // 2px
  tiny:       4,   // 4px — icon padding
  xs:         6,   // 6px
  sm:         8,   // 8px — inline gaps
  md:         12,  // 12px — compact padding
  base:       16,  // 16px — standard padding
  comfortable:20,  // 20px
  lg:         24,  // 24px — section padding
  xl:         32,  // 32px — large spacing
  '2xl':      40,  // 40px
  '3xl':      48,  // 48px — section margins
  '4xl':      64,  // 64px — page margins
  '5xl':      80,  // 80px
  '6xl':      96,  // 96px
} as const;

// Component-specific layout spacing
export const componentSpacing = {
  // Card padding
  cardPaddingXs:  '12px 16px',
  cardPaddingSm:  '16px 20px',
  cardPaddingMd:  '20px 24px',
  cardPaddingLg:  '24px 28px',
  cardPaddingXl:  '28px 32px',

  // Section margins
  sectionGap:     '24px',
  sectionGapMd:   '32px',
  sectionGapLg:   '48px',

  // Dashboard grid
  gridGap:        '16px',
  gridGapMd:      '20px',
  gridGapLg:      '24px',

  // Header
  headerHeight:   '64px',
  headerHeightSm: '56px',

  // Sidebar
  sidebarWidth:      '260px',
  sidebarWidthCollapsed: '72px',

  // Bottom nav
  bottomNavHeight: '64px',
  bottomNavOffset: '80px', // content padding-bottom on mobile

  // Safe area
  safeAreaBottom: 'env(safe-area-inset-bottom, 0px)',
  safeAreaTop:    'env(safe-area-inset-top, 0px)',
} as const;

export type SpaceKey = keyof typeof space;
