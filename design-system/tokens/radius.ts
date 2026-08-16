/**
 * CleanAI Design System — Border Radius Tokens
 */

export const radius = {
  none:  '0px',
  xs:    '4px',
  sm:    '8px',
  md:    '12px',
  lg:    '16px',
  xl:    '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
  full:  '9999px',
} as const;

// Component radius presets — these enforce consistency
export const componentRadius = {
  button:       radius.xl,      // 20px — pill-like but not full
  buttonSm:     radius.lg,      // 16px
  buttonXs:     radius.md,      // 12px
  input:        radius.xl,      // 20px — matches button
  inputSm:      radius.lg,      // 16px
  badge:        radius.full,    // pill
  badgeSq:      radius.sm,      // 8px — square badge
  avatar:       radius.full,    // circle
  chip:         radius.full,    // tags/chips
  card:         radius['2xl'],  // 24px — content cards
  cardSm:       radius.xl,      // 20px
  cardLg:       radius['3xl'],  // 28px
  panel:        radius['2xl'],  // sidebar / sheet panels
  modal:        radius['3xl'],  // 28px
  tooltip:      radius.md,      // 12px
  dropdown:     radius['2xl'],  // 24px
  popover:      radius['2xl'],  // 24px
  notification: radius['2xl'],  // 24px
  bottomSheet:  radius['3xl'],  // 28px — rounded top corners only
  image:        radius.xl,      // 20px
  heroSection:  radius['3xl'],  // 28px
  statCard:     radius['2xl'],  // 24px
} as const;

export type RadiusKey = keyof typeof radius;
export type ComponentRadiusKey = keyof typeof componentRadius;
