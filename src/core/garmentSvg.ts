import type { GarmentView } from './types'

/** Derive perceptual luminance from a hex color string. */
function getLuminance(hex: string): number {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Generates an SVG string for a flat-lay garment in the given color and view.
 * ViewBox is 500 × 620 so the garment always has the same proportions.
 */
export function generateGarmentSVG(color: string, view: GarmentView): string {
  const lum = getLuminance(color)
  const isDark = lum < 0.35

  // Shadows and highlights adapt to dark vs light garments
  const shadow = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)'
  const deepShadow = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.18)'
  const highlight = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'
  const collarLine = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.14)'
  const outline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'

  // Main body silhouette — same shape for front & back, collar differs
  const bodyPath =
    'M 200,82 C 176,50 124,58 100,72 L 35,182 L 58,258 L 162,218 L 162,572 L 338,572 L 338,218 L 442,258 L 465,182 L 400,72 C 376,58 324,50 300,82 C 282,130 218,130 200,82 Z'

  const backBodyPath =
    'M 185,72 C 162,52 120,58 100,72 L 35,182 L 58,258 L 162,218 L 162,572 L 338,572 L 338,218 L 442,258 L 465,182 L 400,72 C 380,58 338,52 315,72 C 300,52 200,52 185,72 Z'

  const usePath = view === 'front' ? bodyPath : backBodyPath

  // Collar detail differs between front (U-neck) and back (round)
  const collarDetail =
    view === 'front'
      ? `<path d="M 207,88 C 228,126 272,126 293,88" fill="none" stroke="${collarLine}" stroke-width="2.5" stroke-linecap="round"/>`
      : `<path d="M 190,76 C 212,56 288,56 310,76" fill="none" stroke="${collarLine}" stroke-width="2.5" stroke-linecap="round"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="620" viewBox="0 0 500 620">
  <!-- Drop shadow beneath garment -->
  <ellipse cx="250" cy="612" rx="148" ry="10" fill="rgba(0,0,0,0.12)"/>

  <!-- Garment body -->
  <path d="${usePath}"
        fill="${color}"
        stroke="${outline}"
        stroke-width="1.5"
        stroke-linejoin="round"/>

  <!-- Collar stitching detail -->
  ${collarDetail}

  <!-- Left side-seam shadow -->
  <line x1="162" y1="218" x2="162" y2="572" stroke="${shadow}" stroke-width="8" stroke-linecap="round"/>
  <!-- Right side-seam shadow -->
  <line x1="338" y1="218" x2="338" y2="572" stroke="${shadow}" stroke-width="8" stroke-linecap="round"/>

  <!-- Left armhole / shoulder fold shadow -->
  <path d="M 162,218 L 58,258" stroke="${shadow}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Right armhole / shoulder fold shadow -->
  <path d="M 338,218 L 442,258" stroke="${shadow}" stroke-width="5" fill="none" stroke-linecap="round"/>

  <!-- Left shoulder highlight -->
  <path d="M 100,72 C 130,105 162,165 162,218" stroke="${highlight}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Right shoulder highlight -->
  <path d="M 400,72 C 370,105 338,165 338,218" stroke="${highlight}" stroke-width="5" fill="none" stroke-linecap="round"/>

  <!-- Chest center crease (subtle) -->
  <line x1="250" y1="215" x2="250" y2="400" stroke="${deepShadow}" stroke-width="2" stroke-linecap="round"/>

  <!-- Bottom hem -->
  <line x1="165" y1="572" x2="335" y2="572" stroke="${shadow}" stroke-width="3"/>
</svg>`
}

/** Encode SVG string as a data URL usable in <img> or FabricImage.fromURL. */
export function svgToDataUrl(svgString: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
}

/** Convenience: generate and return a data URL for a garment. */
export function getGarmentDataUrl(colorHex: string, view: GarmentView): string {
  return svgToDataUrl(generateGarmentSVG(colorHex, view))
}
