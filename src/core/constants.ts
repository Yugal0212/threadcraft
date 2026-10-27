import type { PrintAreaPct, PrintPosition, GarmentColor } from './types'

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

export const ACCEPTED_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
] as const

/** Maximum upload size in bytes (10 MB). */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

/** Longest canvas edge in pixels — keeps layout stable for large uploads. */
export const MAX_CANVAS_EDGE = 800

export const OBJECT_ROLE = {
  PRODUCT: 'product',
  CUSTOM_IMAGE: 'custom-image',
  CUSTOM_TEXT: 'custom-text',
  PRINT_AREA_GUIDE: 'print-area-guide',
} as const

export type ObjectRole = (typeof OBJECT_ROLE)[keyof typeof OBJECT_ROLE]

/**
 * Print area coordinates as percentages of the logical canvas.
 * Calibrated against the SVG garment template (viewBox 0 0 500 620).
 *
 * Chest left/right are named from the WEARER's perspective:
 *  - "left-chest"  → wearer's left  = viewer's RIGHT side of the image
 *  - "right-chest" → wearer's right = viewer's LEFT side of the image
 */
export const PRINT_AREAS: Record<PrintPosition, PrintAreaPct> = {
  'front-center': {
    xPct: 0.33,
    yPct: 0.37,
    wPct: 0.34,
    hPct: 0.32,
    view: 'front',
  },
  'front-left-chest': {
    // Wearer's left = right side of the image from the viewer's perspective
    xPct: 0.53,
    yPct: 0.30,
    wPct: 0.17,
    hPct: 0.13,
    view: 'front',
  },
  'front-right-chest': {
    // Wearer's right = left side of the image from the viewer's perspective
    xPct: 0.30,
    yPct: 0.30,
    wPct: 0.17,
    hPct: 0.13,
    view: 'front',
  },
  'back-center': {
    xPct: 0.33,
    yPct: 0.34,
    wPct: 0.34,
    hPct: 0.35,
    view: 'back',
  },
  'sleeves-left': {
    xPct: 0.70,
    yPct: 0.35,
    wPct: 0.18,
    hPct: 0.18,
    view: 'sleeves',
  },
  'sleeves-right': {
    xPct: 0.12,
    yPct: 0.35,
    wPct: 0.18,
    hPct: 0.18,
    view: 'sleeves',
  },
}

export const PRINT_POSITION_LABELS: Record<PrintPosition, string> = {
  'front-center': 'Front Center',
  'front-left-chest': 'Left Chest / Shoulder',
  'front-right-chest': 'Right Chest',
  'back-center': 'Back Center',
  'sleeves-left': 'Left Sleeve',
  'sleeves-right': 'Right Sleeve',
}

export const GARMENT_COLORS: Record<GarmentColor, { label: string; hex: string }> = {
  black: { label: 'Black', hex: '#1C1C1E' },
  white: { label: 'White', hex: '#FFFFFF' },
  navy: { label: 'Navy Blue', hex: '#1B2A4A' },
  red: { label: 'Crimson Red', hex: '#DC2626' },
  grey: { label: 'Heather Grey', hex: '#71717A' },
  olive: { label: 'Olive Green', hex: '#848E4E' },
  yellow: { label: 'Vibrant Yellow', hex: '#EAB308' },
  purple: { label: 'Royal Purple', hex: '#7E22CE' },
  maroon: { label: 'Deep Maroon', hex: '#7F1D1D' },
  green: { label: 'Forest Green', hex: '#15803D' },
  lime: { label: 'Lime Green', hex: '#84CC16' },
  charcoal: { label: 'Dark Charcoal', hex: '#374151' },
  lavender: { label: 'Soft Lavender', hex: '#D8B4FE' },
  sage: { label: 'Sage Mint', hex: '#A7F3D0' },
  'sky-blue': { label: 'Sky Blue', hex: '#7DD3FC' },
  pink: { label: 'Pastel Pink', hex: '#F9A8D4' },
  peach: { label: 'Warm Peach', hex: '#FDBA74' },
  teal: { label: 'Deep Teal', hex: '#0D9488' },
  beige: { label: 'Natural Beige', hex: '#E5D5C5' },
}
