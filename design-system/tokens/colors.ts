/**
 * CleanAI Design System — Color Tokens
 * All colors in oklch() for perceptual uniformity
 * Do NOT use raw hex or rgb values in components — always reference these tokens
 */

// ============================================================
// PRIMITIVE SCALE — 11 steps per hue (not used directly in UI)
// ============================================================
export const primitives = {
  // Blue (Customer primary)
  blue: {
    50:  'oklch(0.975 0.014 251.54)',
    100: 'oklch(0.945 0.028 251.54)',
    200: 'oklch(0.888 0.058 251.54)',
    300: 'oklch(0.800 0.098 251.54)',
    400: 'oklch(0.700 0.140 251.54)',
    500: 'oklch(0.600 0.175 251.54)',
    600: 'oklch(0.520 0.180 251.54)',
    700: 'oklch(0.440 0.165 251.54)',
    800: 'oklch(0.360 0.138 251.54)',
    900: 'oklch(0.280 0.105 251.54)',
    950: 'oklch(0.180 0.065 251.54)',
  },
  // Violet (Vendor primary)
  violet: {
    50:  'oklch(0.975 0.014 280)',
    100: 'oklch(0.945 0.030 280)',
    200: 'oklch(0.888 0.062 280)',
    300: 'oklch(0.800 0.105 280)',
    400: 'oklch(0.700 0.148 280)',
    500: 'oklch(0.600 0.175 280)',
    600: 'oklch(0.520 0.178 280)',
    700: 'oklch(0.440 0.162 280)',
    800: 'oklch(0.360 0.132 280)',
    900: 'oklch(0.280 0.098 280)',
    950: 'oklch(0.180 0.062 280)',
  },
  // Slate (Admin primary)
  slate: {
    50:  'oklch(0.975 0.006 247.84)',
    100: 'oklch(0.945 0.010 247.84)',
    200: 'oklch(0.888 0.018 247.84)',
    300: 'oklch(0.800 0.028 247.84)',
    400: 'oklch(0.680 0.036 247.84)',
    500: 'oklch(0.560 0.040 247.84)',
    600: 'oklch(0.460 0.036 247.84)',
    700: 'oklch(0.370 0.028 247.84)',
    800: 'oklch(0.260 0.020 247.84)',
    900: 'oklch(0.180 0.014 247.84)',
    950: 'oklch(0.115 0.010 247.84)',
  },
  // Green (Success)
  green: {
    50:  'oklch(0.975 0.020 164.44)',
    100: 'oklch(0.945 0.042 164.44)',
    200: 'oklch(0.888 0.082 164.44)',
    300: 'oklch(0.800 0.120 164.44)',
    400: 'oklch(0.720 0.158 164.44)',
    500: 'oklch(0.640 0.170 164.44)',
    600: 'oklch(0.540 0.158 164.44)',
    700: 'oklch(0.430 0.138 164.44)',
  },
  // Amber (Warning)
  amber: {
    50:  'oklch(0.978 0.020 92.07)',
    100: 'oklch(0.950 0.048 92.07)',
    200: 'oklch(0.900 0.090 92.07)',
    300: 'oklch(0.840 0.130 92.07)',
    400: 'oklch(0.770 0.170 92.07)',
    500: 'oklch(0.700 0.180 92.07)',
    600: 'oklch(0.600 0.168 92.07)',
  },
  // Red (Error/Destructive)
  red: {
    50:  'oklch(0.975 0.020 25.77)',
    100: 'oklch(0.940 0.048 25.77)',
    200: 'oklch(0.880 0.090 25.77)',
    300: 'oklch(0.800 0.140 25.77)',
    400: 'oklch(0.700 0.185 25.77)',
    500: 'oklch(0.600 0.215 25.77)',
    600: 'oklch(0.520 0.215 25.77)',
  },
} as const;

// ============================================================
// SEMANTIC TOKENS — these map to CSS vars in globals.css
// ============================================================

export const semanticColors = {
  light: {
    // Surfaces
    background:      'oklch(0.98 0.004 247.84)',
    surfaceRaised:   'oklch(1.00 0.000 0)',
    surfaceOverlay:  'oklch(0.99 0.003 247.84)',
    surfaceInverse:  'oklch(0.14 0.017 251.78)',

    // Text
    textPrimary:     'oklch(0.14 0.017 251.78)',
    textSecondary:   'oklch(0.40 0.020 251.78)',
    textTertiary:    'oklch(0.54 0.020 251.78)',
    textDisabled:    'oklch(0.70 0.012 251.78)',
    textInverse:     'oklch(0.99 0.002 247.84)',
    textPlaceholder: 'oklch(0.65 0.016 251.78)',

    // Actions
    actionPrimary:         'oklch(0.52 0.180 251.54)',
    actionPrimaryHover:    'oklch(0.47 0.178 251.54)',
    actionPrimaryActive:   'oklch(0.44 0.172 251.54)',
    actionPrimaryForeground: 'oklch(0.99 0.002 247.84)',

    // Borders
    borderSubtle:   'oklch(0.930 0.008 247.84)',
    borderDefault:  'oklch(0.900 0.010 247.84)',
    borderStrong:   'oklch(0.820 0.016 247.84)',

    // Status
    success:        'oklch(0.64 0.170 164.44)',
    successBg:      'oklch(0.97 0.022 164.44)',
    warning:        'oklch(0.70 0.180 92.07)',
    warningBg:      'oklch(0.97 0.024 92.07)',
    error:          'oklch(0.58 0.215 25.77)',
    errorBg:        'oklch(0.97 0.022 25.77)',
    info:           'oklch(0.60 0.160 251.54)',
    infoBg:         'oklch(0.97 0.016 251.54)',
  },
  dark: {
    // Surfaces
    background:      'oklch(0.100 0.012 251.78)',
    surfaceRaised:   'oklch(0.130 0.012 251.78)',
    surfaceOverlay:  'oklch(0.120 0.012 251.78)',
    surfaceInverse:  'oklch(0.970 0.004 247.84)',

    // Text
    textPrimary:     'oklch(0.960 0.004 247.84)',
    textSecondary:   'oklch(0.780 0.016 247.84)',
    textTertiary:    'oklch(0.640 0.014 251.78)',
    textDisabled:    'oklch(0.440 0.012 251.78)',
    textInverse:     'oklch(0.120 0.012 251.78)',
    textPlaceholder: 'oklch(0.500 0.014 251.78)',

    // Actions
    actionPrimary:         'oklch(0.620 0.180 251.54)',
    actionPrimaryHover:    'oklch(0.660 0.178 251.54)',
    actionPrimaryActive:   'oklch(0.590 0.172 251.54)',
    actionPrimaryForeground: 'oklch(0.100 0.012 251.78)',

    // Borders
    borderSubtle:   'oklch(0.200 0.014 251.78)',
    borderDefault:  'oklch(0.240 0.016 251.78)',
    borderStrong:   'oklch(0.320 0.018 251.78)',

    // Status
    success:        'oklch(0.700 0.160 164.44)',
    successBg:      'oklch(0.170 0.040 164.44)',
    warning:        'oklch(0.760 0.175 92.07)',
    warningBg:      'oklch(0.160 0.040 92.07)',
    error:          'oklch(0.660 0.210 25.77)',
    errorBg:        'oklch(0.175 0.045 25.77)',
    info:           'oklch(0.680 0.155 251.54)',
    infoBg:         'oklch(0.160 0.035 251.54)',
  },
} as const;

// ============================================================
// ROLE ACCENT COLORS — customer, vendor, admin
// ============================================================
export const roleColors = {
  customer: {
    primary:    'oklch(0.52 0.180 251.54)',
    primaryDark:'oklch(0.62 0.180 251.54)',
    bg:         'oklch(0.52 0.180 251.54 / 0.08)',
    bgDark:     'oklch(0.62 0.180 251.54 / 0.12)',
    gradient:   'linear-gradient(135deg, oklch(0.52 0.18 251.54), oklch(0.62 0.18 280))',
  },
  vendor: {
    primary:    'oklch(0.52 0.178 280)',
    primaryDark:'oklch(0.62 0.178 280)',
    bg:         'oklch(0.52 0.178 280 / 0.08)',
    bgDark:     'oklch(0.62 0.178 280 / 0.12)',
    gradient:   'linear-gradient(135deg, oklch(0.52 0.178 280), oklch(0.60 0.17 328))',
  },
  admin: {
    primary:    'oklch(0.38 0.032 247.84)',
    primaryDark:'oklch(0.58 0.032 247.84)',
    bg:         'oklch(0.38 0.032 247.84 / 0.08)',
    bgDark:     'oklch(0.58 0.032 247.84 / 0.12)',
    gradient:   'linear-gradient(135deg, oklch(0.38 0.032 247.84), oklch(0.48 0.040 251.54))',
  },
} as const;

// ============================================================
// GLASS TINT COLORS — for glass-* utility classes
// ============================================================
export const glassTints = {
  light: {
    l1: 'rgba(255, 255, 255, 0.60)',
    l2: 'rgba(255, 255, 255, 0.75)',
    l3: 'rgba(255, 255, 255, 0.82)',
    l4: 'rgba(255, 255, 255, 0.90)',
  },
  dark: {
    l1: 'rgba(8, 12, 24, 0.60)',
    l2: 'rgba(10, 14, 28, 0.72)',
    l3: 'rgba(12, 18, 34, 0.80)',
    l4: 'rgba(16, 22, 42, 0.88)',
  },
  border: {
    light: 'rgba(255, 255, 255, 0.50)',
    dark:  'rgba(255, 255, 255, 0.08)',
  },
} as const;

export type ColorRole = keyof typeof roleColors;
