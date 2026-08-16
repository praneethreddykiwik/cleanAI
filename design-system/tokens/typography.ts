/**
 * CleanAI Design System — Typography Tokens
 * Uses clamp() for fluid responsive type
 */

// Font families
export const fontFamily = {
  sans:    '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  display: '"Inter Display", "SF Pro Display", system-ui, -apple-system, sans-serif',
  mono:    '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
} as const;

// Type scale — static values in rem
export const fontSize = {
  '2xs': '0.625rem',   // 10px
  xs:    '0.6875rem',  // 11px
  sm:    '0.8125rem',  // 13px
  base:  '0.875rem',   // 14px (body default)
  md:    '1rem',       // 16px
  lg:    '1.125rem',   // 18px
  xl:    '1.25rem',    // 20px
  '2xl': '1.5rem',     // 24px
  '3xl': '1.875rem',   // 30px
  '4xl': '2.25rem',    // 36px
  '5xl': '3rem',       // 48px
  '6xl': '3.75rem',    // 60px
} as const;

// Fluid type scale — using clamp for responsiveness
export const fluidFontSize = {
  bodySmall:  'clamp(0.75rem, 1.5vw, 0.875rem)',
  body:       'clamp(0.875rem, 1.8vw, 1rem)',
  lead:       'clamp(1rem, 2vw, 1.125rem)',
  h4:         'clamp(1.0625rem, 2.2vw, 1.25rem)',
  h3:         'clamp(1.25rem, 2.5vw, 1.5rem)',
  h2:         'clamp(1.5rem, 3vw, 2rem)',
  h1:         'clamp(1.875rem, 4vw, 2.625rem)',
  display:    'clamp(2.25rem, 5vw, 3.5rem)',
} as const;

// Font weights
export const fontWeight = {
  normal:    400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
  black:     900,
} as const;

// Line heights
export const lineHeight = {
  none:     1,
  tight:    1.2,
  snug:     1.375,
  normal:   1.5,
  relaxed:  1.625,
  loose:    1.8,
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: '-0.03em',
  tight:   '-0.015em',
  normal:  '0em',
  wide:    '0.025em',
  wider:   '0.05em',
  widest:  '0.1em',
} as const;

// Semantic type styles — maps to Tailwind classes
export const typeStyles = {
  // Headings
  displayHeading: {
    size: fluidFontSize.display,
    weight: fontWeight.extrabold,
    leading: lineHeight.tight,
    tracking: letterSpacing.tighter,
  },
  h1: {
    size: fluidFontSize.h1,
    weight: fontWeight.bold,
    leading: lineHeight.tight,
    tracking: letterSpacing.tight,
  },
  h2: {
    size: fluidFontSize.h2,
    weight: fontWeight.bold,
    leading: lineHeight.snug,
    tracking: letterSpacing.tight,
  },
  h3: {
    size: fluidFontSize.h3,
    weight: fontWeight.semibold,
    leading: lineHeight.snug,
    tracking: letterSpacing.tight,
  },
  h4: {
    size: fluidFontSize.h4,
    weight: fontWeight.semibold,
    leading: lineHeight.normal,
    tracking: letterSpacing.tight,
  },

  // Body
  bodyLarge: {
    size: fluidFontSize.lead,
    weight: fontWeight.normal,
    leading: lineHeight.relaxed,
    tracking: letterSpacing.normal,
  },
  body: {
    size: fluidFontSize.body,
    weight: fontWeight.normal,
    leading: lineHeight.normal,
    tracking: letterSpacing.normal,
  },
  bodySmall: {
    size: fluidFontSize.bodySmall,
    weight: fontWeight.normal,
    leading: lineHeight.normal,
    tracking: letterSpacing.normal,
  },

  // UI Labels
  label: {
    size: fontSize.sm,
    weight: fontWeight.semibold,
    leading: lineHeight.none,
    tracking: letterSpacing.normal,
  },
  labelXs: {
    size: fontSize.xs,
    weight: fontWeight.bold,
    leading: lineHeight.none,
    tracking: letterSpacing.wider,
  },
  caption: {
    size: fontSize['2xs'],
    weight: fontWeight.medium,
    leading: lineHeight.snug,
    tracking: letterSpacing.wide,
  },

  // Code
  code: {
    family: fontFamily.mono,
    size: fontSize.sm,
    weight: fontWeight.normal,
    leading: lineHeight.relaxed,
  },
} as const;

export type FontSizeKey = keyof typeof fontSize;
export type FontWeightKey = keyof typeof fontWeight;
