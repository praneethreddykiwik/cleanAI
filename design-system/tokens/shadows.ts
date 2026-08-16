/**
 * CleanAI Design System — Shadow Tokens
 * Separate light/dark variants for correct depth perception
 */

export const shadows = {
  light: {
    // Elevation 0 — hairline ring
    xs:   '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)',
    // Elevation 1 — card at rest
    sm:   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    // Elevation 2 — card hover, floating buttons
    md:   '0 4px 8px -2px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
    // Elevation 3 — dropdowns, tooltips, popovers
    lg:   '0 10px 20px -4px rgba(0,0,0,0.08), 0 4px 8px -4px rgba(0,0,0,0.05)',
    // Elevation 4 — modals, dialogs
    xl:   '0 20px 40px -8px rgba(0,0,0,0.10), 0 8px 16px -8px rgba(0,0,0,0.06)',
    // Elevation 5 — command palettes
    '2xl':'0 32px 64px -12px rgba(0,0,0,0.14), 0 16px 32px -12px rgba(0,0,0,0.08)',

    // Specialized
    card:      '0 0 0 1px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
    cardHover: '0 0 0 1px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.06)',
    glass:     '0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
    glassHover:'0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    sidebar:   '2px 0 16px rgba(0,0,0,0.04), inset -1px 0 0 rgba(0,0,0,0.04)',
    header:    '0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)',

    // Colored glows
    primaryGlow:  '0 4px 16px rgba(37,99,235,0.20), 0 8px 32px rgba(37,99,235,0.10)',
    successGlow:  '0 4px 16px rgba(22,163,74,0.20), 0 8px 32px rgba(22,163,74,0.10)',
    errorGlow:    '0 4px 16px rgba(220,38,38,0.20), 0 8px 32px rgba(220,38,38,0.10)',
    warningGlow:  '0 4px 16px rgba(217,119,6,0.18), 0 8px 32px rgba(217,119,6,0.08)',

    // Focus rings
    focusPrimary: '0 0 0 3px rgba(59,130,246,0.25)',
    focusError:   '0 0 0 3px rgba(220,38,38,0.25)',

    // Inset
    inset: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    insetSm: 'inset 0 1px 2px rgba(0,0,0,0.04)',

    // Bottom nav floating
    bottomNav: '0 -1px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06)',
  },

  dark: {
    xs:   '0 0 0 1px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.40)',
    sm:   '0 1px 3px rgba(0,0,0,0.50), 0 1px 2px rgba(0,0,0,0.40)',
    md:   '0 4px 8px -2px rgba(0,0,0,0.50), 0 2px 4px -2px rgba(0,0,0,0.40)',
    lg:   '0 10px 20px -4px rgba(0,0,0,0.60), 0 4px 8px -4px rgba(0,0,0,0.50)',
    xl:   '0 20px 40px -8px rgba(0,0,0,0.70), 0 8px 16px -8px rgba(0,0,0,0.50)',
    '2xl':'0 32px 64px -12px rgba(0,0,0,0.80), 0 16px 32px -12px rgba(0,0,0,0.60)',

    card:      '0 0 0 1px rgba(255,255,255,0.04), 0 2px 6px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.30)',
    cardHover: '0 0 0 1px rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.50), 0 16px 40px rgba(0,0,0,0.40)',
    glass:     '0 4px 16px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
    glassHover:'0 8px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.10)',
    sidebar:   '2px 0 16px rgba(0,0,0,0.40), inset -1px 0 0 rgba(255,255,255,0.04)',
    header:    '0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.30)',

    primaryGlow:  '0 4px 16px rgba(99,138,255,0.25), 0 8px 32px rgba(99,138,255,0.12)',
    successGlow:  '0 4px 16px rgba(74,222,128,0.20), 0 8px 32px rgba(74,222,128,0.10)',
    errorGlow:    '0 4px 16px rgba(248,113,113,0.22), 0 8px 32px rgba(248,113,113,0.10)',
    warningGlow:  '0 4px 16px rgba(251,191,36,0.20), 0 8px 32px rgba(251,191,36,0.08)',

    focusPrimary: '0 0 0 3px rgba(99,138,255,0.30)',
    focusError:   '0 0 0 3px rgba(248,113,113,0.30)',

    inset: 'inset 0 2px 4px rgba(0,0,0,0.40)',
    insetSm: 'inset 0 1px 2px rgba(0,0,0,0.30)',

    bottomNav: '0 -1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.50), 0 16px 40px rgba(0,0,0,0.40)',
  },
} as const;

export type ShadowKey = keyof typeof shadows.light;
