/**
 * CleanAI Motion System — Premium Framer Motion Presets
 * Physics-based spring animations for premium feel
 */
import type { Variants } from 'framer-motion';

// ==================
// Page Transitions
// ==================
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.30,
      ease: [0.16, 1, 0.3, 1], // expo out
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// ==================
// Container Stagger
// ==================
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const containerFastVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

export const containerSlowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

// ==================
// Cards
// ==================
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

export const statCardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.07,
      duration: 0.40,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
};

export const serviceCardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.38,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
};

// ==================
// List Items
// ==================
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
};

export const listItemRightVariants: Variants = {
  hidden: { opacity: 0, x: 10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
};

// ==================
// Fade Variants
// ==================
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.22 },
  },
};

export const fadeScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.24, ease: [0.34, 1.56, 0.64, 1] },
  },
};

// ==================
// Modal / Dialog
// ==================
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 6,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

// ==================
// Backdrop
// ==================
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.20 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

// ==================
// Drawer (right)
// ==================
export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', damping: 30, stiffness: 280 },
  },
  exit: {
    x: '100%',
    transition: { duration: 0.24, ease: [0.4, 0, 1, 1] },
  },
};

// ==================
// Drawer (left)
// ==================
export const drawerLeftVariants: Variants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', damping: 30, stiffness: 280 },
  },
  exit: {
    x: '-100%',
    transition: { duration: 0.24, ease: [0.4, 0, 1, 1] },
  },
};

// ==================
// Bottom Sheet (NEW)
// ==================
export const bottomSheetVariants: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 32, stiffness: 260, mass: 1 },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.26, ease: [0.4, 0, 1, 1] },
  },
};

// ==================
// Sidebar Items
// ==================
export const sidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.035, duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ==================
// Sidebar Active Pill (NEW)
// ==================
export const sidebarPillVariants = {
  layout: true,
  transition: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 30,
    mass: 1,
  },
};

// ==================
// Notification Badge
// ==================
export const badgeBounceVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 500, damping: 18, mass: 0.6 },
  },
};

// ==================
// Count Badge Change (NEW)
// ==================
export const countBadgeVariants: Variants = {
  initial: { scale: 0.8, opacity: 0, y: -4 },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 20 },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: 4,
    transition: { duration: 0.14 },
  },
};

// ==================
// Notification Banner (NEW) — swipe dismiss
// ==================
export const notificationBannerVariants: Variants = {
  hidden: { opacity: 0, x: 60, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 340, damping: 28 },
  },
  exit: {
    opacity: 0,
    x: 60,
    scale: 0.95,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

// ==================
// Tab Switch (NEW) — horizontal slide
// ==================
export const tabSwitchVariants = (direction: number): Variants => ({
  hidden: { opacity: 0, x: direction * 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: direction * -20,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
});

// ==================
// Hero Text Stagger (NEW)
// ==================
export const heroTextContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const heroTextItemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ==================
// Glass Reveal (NEW) — blur-in
// ==================
export const glassRevealVariants: Variants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)', scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ==================
// Toast (NEW)
// ==================
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -16, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 360, damping: 28 },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.96,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

// ==================
// Success Check (NEW) — SVG path
// ==================
export const successCheckVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: 'easeInOut' },
      opacity: { duration: 0.2 },
    },
  },
};

// ==================
// Error Shake (NEW)
// ==================
export const errorShakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

// ==================
// Skeleton Wave (NEW)
// ==================
export const skeletonVariants: Variants = {
  hidden: { opacity: 0.5 },
  visible: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse' as const,
      duration: 0.9,
      ease: 'easeInOut',
    },
  },
};

// ==================
// Timeline Steps
// ==================
export const timelineVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.14,
      duration: 0.38,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
};

// ==================
// Dropdown
// ==================
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.14, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -3,
    transition: { duration: 0.10, ease: [0.4, 0, 1, 1] },
  },
};

// ==================
// Tooltip
// ==================
export const tooltipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.14, ease: [0.34, 1.56, 0.64, 1] },
  },
};

// ==================
// Notification Bell
// ==================
export const bellVariants: Variants = {
  idle: { rotate: 0 },
  shake: {
    rotate: [0, 12, -9, 6, -3, 2, 0] as number[],
    transition: { duration: 0.65 },
  },
};

// ==================
// Chart Draw
// ==================
export const chartVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.5, ease: 'easeInOut' },
  },
};

// ==================
// Collapse / Expand
// ==================
export const collapseVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

// ==================
// Number / Count Up
// ==================
export const numberVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

// ==================
// Auth Card
// ==================
export const authCardVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

export const authBlobVariants: Variants = {
  animate: {
    borderRadius: [
      '60% 40% 30% 70% / 60% 30% 70% 40%',
      '30% 60% 70% 40% / 50% 60% 30% 60%',
      '60% 40% 30% 70% / 60% 30% 70% 40%',
    ],
    transition: {
      duration: 9,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================
// Table Rows
// ==================
export const tableRowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.03, duration: 0.22 },
  }),
};

// ==================
// Button Interactions
// ==================
export const buttonInteractionVariants = {
  hover: { scale: 1.015, y: -0.5, transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] } },
  tap:   { scale: 0.985, y: 0.5,  transition: { duration: 0.08, ease: [0.4, 0, 0.2, 1] } },
};
