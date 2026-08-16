/**
 * CleanAI Design System — Motion Tokens
 * Based on spring physics and Apple HIG timing guidelines
 */

// Easing curves — cubic-bezier strings for CSS transitions
export const easings = {
  // Standard easings
  linear:    'linear',
  easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
  easeOut:   'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Premium physics curves
  spring:    'cubic-bezier(0.34, 1.56, 0.64, 1)',  // overshoots slightly
  snappy:    'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  smooth:    'cubic-bezier(0.16, 1, 0.3, 1)',       // expo out
  gentle:    'cubic-bezier(0.37, 0, 0.63, 1)',       // sine in-out
  bounce:    'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Framer Motion spring configs
export const springs = {
  // UI micro-interactions
  micro: {
    type:      'spring' as const,
    stiffness: 600,
    damping:   30,
    mass:      0.5,
  },
  // Standard button/hover
  ui: {
    type:      'spring' as const,
    stiffness: 400,
    damping:   25,
    mass:      0.8,
  },
  // Card lifts, sidebar items
  card: {
    type:      'spring' as const,
    stiffness: 300,
    damping:   25,
    mass:      1,
  },
  // Page-level transitions
  page: {
    type:      'spring' as const,
    stiffness: 200,
    damping:   24,
    mass:      1,
  },
  // Drawer/sidebar slide
  drawer: {
    type:      'spring' as const,
    stiffness: 280,
    damping:   30,
    mass:      1,
  },
  // Bottom sheet
  sheet: {
    type:      'spring' as const,
    stiffness: 260,
    damping:   32,
    mass:      1,
  },
  // Modal / Dialog
  modal: {
    type:      'spring' as const,
    stiffness: 380,
    damping:   28,
    mass:      0.8,
  },
  // Active nav indicator pill
  navPill: {
    type:      'spring' as const,
    stiffness: 380,
    damping:   30,
    mass:      1,
  },
  // Notification badge pop
  badge: {
    type:      'spring' as const,
    stiffness: 500,
    damping:   18,
    mass:      0.6,
  },
} as const;

// Duration constants (milliseconds)
export const durations = {
  instant:  0,
  micro:    80,
  fast:     120,
  base:     200,
  medium:   250,
  slow:     300,
  slower:   400,
  page:     350,
  long:     500,
  xlong:    700,
} as const;

// CSS transition shorthand strings
export const transitions = {
  fast:    `${durations.fast}ms ${easings.easeOut}`,
  base:    `${durations.base}ms ${easings.easeInOut}`,
  slow:    `${durations.slow}ms ${easings.easeInOut}`,
  spring:  `${durations.slow}ms ${easings.spring}`,
  smooth:  `${durations.medium}ms ${easings.smooth}`,
  all:     `all ${durations.base}ms ${easings.easeInOut}`,
} as const;

// Stagger delays for list animations
export const staggerDelays = {
  none:    0,
  tight:   0.04,    // 40ms between items
  normal:  0.06,    // 60ms
  relaxed: 0.08,    // 80ms
  slow:    0.12,    // 120ms
  cards:   0.06,
  list:    0.04,
  grid:    0.05,
} as const;

// Delay before children animate (for container stagger)
export const childDelays = {
  none:    0,
  fast:    0.05,
  normal:  0.10,
  slow:    0.15,
} as const;

// Layer z-index scale
export const zIndex = {
  base:        0,
  raised:      1,
  dropdown:    10,
  sticky:      20,
  overlay:     30,
  header:      40,
  sidebar:     45,
  modal:       50,
  notification:55,
  toast:       60,
  tooltip:     70,
  command:     80,
  max:         9999,
} as const;

export type EasingKey = keyof typeof easings;
export type SpringKey = keyof typeof springs;
export type DurationKey = keyof typeof durations;
export type ZIndexKey = keyof typeof zIndex;
