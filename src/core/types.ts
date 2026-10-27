import type { FabricImage } from 'fabric'
import type { IText } from 'fabric'

export type EditorSelection =
  | { kind: 'custom-image'; object: FabricImage }
  | { kind: 'text'; object: IText; text: string; fontSize: number; fill: string }
  | null

export interface TshirtEditorCallbacks {
  onProductLoaded?: () => void
  onProductCleared?: () => void
  onSelectionChange?: (selection: EditorSelection) => void
  onCanvasChanged?: () => void
  onError?: (message: string) => void
}

export type GarmentColor =
  | 'black'
  | 'white'
  | 'navy'
  | 'red'
  | 'grey'
  | 'olive'
  | 'yellow'
  | 'purple'
  | 'maroon'
  | 'green'
  | 'lime'
  | 'charcoal'
  | 'lavender'
  | 'sage'
  | 'sky-blue'
  | 'pink'
  | 'peach'
  | 'teal'
  | 'beige'

export type GarmentView = 'front' | 'back' | 'sleeves'
export type PrintPosition =
  | 'front-center'
  | 'front-left-chest'
  | 'front-right-chest'
  | 'back-center'
  | 'sleeves-left'
  | 'sleeves-right'

/** Print area coordinates as fractions (0–1) of canvas dimensions. */
export interface PrintAreaPct {
  /** Left edge as fraction of canvas width */
  xPct: number
  /** Top edge as fraction of canvas height */
  yPct: number
  /** Width as fraction of canvas width */
  wPct: number
  /** Height as fraction of canvas height */
  hPct: number
  /** Which garment view this position requires */
  view: GarmentView
}

export interface CartItem {
  cartId: string
  productId: string
  productName: string
  color: GarmentColor
  colorHex: string
  size: string
  quantity: number
  printPosition: PrintPosition
  designDataUrl: string | null
  previewDataUrl: string | null
  price: number
}
