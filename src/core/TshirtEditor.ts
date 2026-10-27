import {
  Canvas,
  FabricImage,
  IText,
  Rect,
  type FabricObject,
} from 'fabric'
import {
  MAX_CANVAS_EDGE,
  OBJECT_ROLE,
  type ObjectRole,
} from './constants'
import type { PrintAreaPct } from './types'
import {
  computeFitScale,
  readFileAsDataUrl,
  verifyImageDataUrl,
} from './imageUtils'
import type { TshirtEditorCallbacks } from './types'

type RoleObject = FabricObject & { objectRole?: ObjectRole }

function setObjectRole(obj: FabricObject, role: ObjectRole): void {
  ;(obj as RoleObject).objectRole = role
}

function getObjectRole(obj: FabricObject): ObjectRole | undefined {
  return (obj as RoleObject).objectRole
}

export class TshirtEditor {
  private canvas: Canvas
  private container: HTMLElement | null = null
  private callbacks: TshirtEditorCallbacks
  private productObject: FabricImage | null = null
  private customImageObject: FabricImage | null = null
  private printAreaGuideObject: Rect | null = null
  private resizeObserver: ResizeObserver | null = null
  private logicalWidth = 0
  private logicalHeight = 0
  private currentPrintArea: PrintAreaPct | null = null
  private showingPrintBoundary = false

  constructor(
    canvasElement: HTMLCanvasElement,
    callbacks: TshirtEditorCallbacks = {},
  ) {
    this.callbacks = callbacks
    this.canvas = new Canvas(canvasElement, {
      preserveObjectStacking: true,
      selection: true,
      uniformScaling: true,
    })

    this.canvas.on('selection:created', () => this.emitSelection())
    this.canvas.on('selection:updated', () => this.emitSelection())
    this.canvas.on('selection:cleared', () => this.emitSelection())
    this.canvas.on('object:modified', () => this.callbacks.onCanvasChanged?.())
    this.canvas.on('object:added', () => this.callbacks.onCanvasChanged?.())
    this.canvas.on('object:removed', () => this.callbacks.onCanvasChanged?.())
    this.canvas.on('text:changed', () => this.callbacks.onCanvasChanged?.())
    this.canvas.on('object:moving', (e) => {
      if (
        e.target &&
        getObjectRole(e.target) === OBJECT_ROLE.CUSTOM_IMAGE
      ) {
        this.constrainObjectToCanvas(e.target)
      }
    })
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  attachContainer(container: HTMLElement): void {
    this.container = container
    this.resizeObserver = new ResizeObserver(() => this.applyResponsiveScale())
    this.resizeObserver.observe(container)
    this.applyResponsiveScale()
  }

  dispose(): void {
    this.resizeObserver?.disconnect()
    this.canvas.dispose()
  }

  // ─── State queries ──────────────────────────────────────────────────────────

  hasProductImage(): boolean {
    return this.productObject !== null
  }

  hasCustomDesign(): boolean {
    return this.customImageObject !== null
  }

  getCanvasElement(): HTMLCanvasElement {
    return this.canvas.getElement()
  }

  focusCanvas(): void {
    this.canvas.getElement().focus()
  }

  // ─── Garment image ─────────────────────────────────────────────────────────

  /**
   * Load an initial product image (clears all customizations).
   * Use setGarmentImage() to swap without clearing design.
   */
  async setProductImageFromFile(file: File): Promise<void> {
    const dataUrl = await readFileAsDataUrl(file)
    await verifyImageDataUrl(dataUrl)
    await this.setProductImageFromUrl(dataUrl)
  }

  async setProductImageFromUrl(dataUrl: string): Promise<void> {
    await verifyImageDataUrl(dataUrl)

    const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })
    const { width: naturalWidth, height: naturalHeight } = img.getOriginalSize()
    const fitScale = computeFitScale(
      naturalWidth,
      naturalHeight,
      MAX_CANVAS_EDGE,
    )

    this.clearCustomizations()
    if (this.productObject) {
      this.canvas.remove(this.productObject)
      this.productObject = null
    }
    if (this.printAreaGuideObject) {
      this.canvas.remove(this.printAreaGuideObject)
      this.printAreaGuideObject = null
    }

    this.logicalWidth = naturalWidth * fitScale
    this.logicalHeight = naturalHeight * fitScale

    this.canvas.setDimensions({
      width: this.logicalWidth,
      height: this.logicalHeight,
    })

    img.set(this.lockedImageProps(0, 0, fitScale))
    setObjectRole(img, OBJECT_ROLE.PRODUCT)

    this.productObject = img
    this.canvas.add(img)
    this.canvas.sendObjectToBack(img)
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.applyResponsiveScale()
    this.callbacks.onProductLoaded?.()
    this.callbacks.onCanvasChanged?.()
  }

  /**
   * Swap the garment background image WITHOUT clearing the customer's design.
   * Used when the user changes garment color or switches front/back views.
   */
  async setGarmentImage(dataUrl: string): Promise<void> {
    const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })
    const { width: naturalWidth, height: naturalHeight } = img.getOriginalSize()
    const fitScale = computeFitScale(
      naturalWidth,
      naturalHeight,
      MAX_CANVAS_EDGE,
    )

    if (this.productObject) {
      this.canvas.remove(this.productObject)
      this.productObject = null
    }

    this.logicalWidth = naturalWidth * fitScale
    this.logicalHeight = naturalHeight * fitScale

    this.canvas.setDimensions({
      width: this.logicalWidth,
      height: this.logicalHeight,
    })

    img.set(this.lockedImageProps(0, 0, fitScale))
    setObjectRole(img, OBJECT_ROLE.PRODUCT)

    this.productObject = img
    this.canvas.add(img)
    this.canvas.sendObjectToBack(img)

    // Re-position custom image in the new print area coordinates
    if (this.customImageObject && this.currentPrintArea) {
      this.centerImageInPrintArea(this.customImageObject)
      this.customImageObject.setCoords()
    }

    // Rebuild the print area guide
    this.rebuildPrintAreaGuide()

    this.applyResponsiveScale()
    this.canvas.renderAll()
    this.callbacks.onProductLoaded?.()
    this.callbacks.onCanvasChanged?.()
  }

  // ─── Custom image ───────────────────────────────────────────────────────────

  async setCustomImageFromFile(file: File): Promise<void> {
    if (!this.hasProductImage()) {
      throw new Error('No garment loaded. Select a product first.')
    }

    const dataUrl = await readFileAsDataUrl(file)
    await verifyImageDataUrl(dataUrl)

    const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })

    if (this.customImageObject) {
      this.canvas.remove(this.customImageObject)
      this.customImageObject = null
    }

    img.set({
      originX: 'center',
      originY: 'center',
      lockScalingFlip: true,
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerColor: '#7c6cff',
      cornerStrokeColor: '#7c6cff',
      borderColor: '#7c6cff',
      borderScaleFactor: 1.5,
    })
    setObjectRole(img, OBJECT_ROLE.CUSTOM_IMAGE)

    if (this.currentPrintArea) {
      this.centerImageInPrintArea(img)
    } else {
      const { width: nw } = img.getOriginalSize()
      const scale = (this.logicalWidth * 0.40) / nw
      img.set({
        left: this.logicalWidth / 2,
        top: this.logicalHeight * 0.4,
        scaleX: scale,
        scaleY: scale,
      })
    }

    this.customImageObject = img
    this.canvas.add(img)
    this.canvas.bringObjectToFront(img)
    this.canvas.setActiveObject(img)
    this.canvas.renderAll()
    this.emitSelection()
    this.callbacks.onCanvasChanged?.()
  }

  removeCustomImage(): void {
    if (!this.customImageObject) return
    this.canvas.remove(this.customImageObject)
    this.customImageObject = null
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.emitSelection()
    this.callbacks.onCanvasChanged?.()
  }

  // ─── Print area ─────────────────────────────────────────────────────────────

  setPrintArea(area: PrintAreaPct): void {
    this.currentPrintArea = area

    if (this.customImageObject) {
      this.centerImageInPrintArea(this.customImageObject)
      this.customImageObject.setCoords()
    }

    this.rebuildPrintAreaGuide()
    this.canvas.renderAll()
    this.callbacks.onCanvasChanged?.()
  }

  showPrintBoundary(visible: boolean): void {
    this.showingPrintBoundary = visible
    this.rebuildPrintAreaGuide()
    this.canvas.renderAll()
  }

  // ─── Design controls ────────────────────────────────────────────────────────

  scaleDesignBy(factor: number): void {
    if (!this.customImageObject) return
    const sx = (this.customImageObject.scaleX ?? 1) * factor
    const sy = (this.customImageObject.scaleY ?? 1) * factor
    this.customImageObject.set({ scaleX: sx, scaleY: sy })
    this.customImageObject.setCoords()
    this.canvas.renderAll()
    this.callbacks.onCanvasChanged?.()
  }

  moveDesignToCenter(): void {
    if (!this.customImageObject) return
    const area = this.computeAbsolutePrintArea()
    if (area) {
      this.customImageObject.set({
        left: area.left + area.width / 2,
        top: area.top + area.height / 2,
      })
    } else {
      this.customImageObject.set({
        left: this.logicalWidth / 2,
        top: this.logicalHeight / 2,
      })
    }
    this.customImageObject.setCoords()
    this.canvas.renderAll()
    this.callbacks.onCanvasChanged?.()
  }

  // ─── Text ───────────────────────────────────────────────────────────────────

  addText(text: string, fontSize: number, fill: string): void {
    if (!this.hasProductImage()) {
      throw new Error('Upload a product image before adding text.')
    }

    const trimmed = text.trim()
    if (!trimmed) {
      throw new Error('Enter some text before adding it to the design.')
    }

    const textObject = new IText(trimmed, {
      left: this.logicalWidth / 2,
      top: this.logicalHeight * 0.55,
      originX: 'center',
      originY: 'center',
      fontSize,
      fill,
      fontFamily: 'Inter, Arial, Helvetica, sans-serif',
      lockScalingFlip: true,
    })
    setObjectRole(textObject, OBJECT_ROLE.CUSTOM_TEXT)

    this.canvas.add(textObject)
    this.canvas.setActiveObject(textObject)
    this.canvas.renderAll()
    this.emitSelection()
    this.callbacks.onCanvasChanged?.()
  }

  updateSelectedText(text: string, fontSize: number, fill: string): void {
    const active = this.canvas.getActiveObject()
    if (!active || getObjectRole(active) !== OBJECT_ROLE.CUSTOM_TEXT) {
      return
    }

    const textObject = active as IText
    textObject.set({
      text: text.trim() || ' ',
      fontSize,
      fill,
    })
    textObject.setCoords()
    this.canvas.renderAll()
    this.callbacks.onCanvasChanged?.()
  }

  // ─── Selection & deletion ───────────────────────────────────────────────────

  deleteSelected(): boolean {
    const active = this.canvas.getActiveObject()
    if (!active) {
      return false
    }

    const role = getObjectRole(active)
    if (role === OBJECT_ROLE.PRODUCT || role === OBJECT_ROLE.PRINT_AREA_GUIDE) {
      return false
    }

    if (role === OBJECT_ROLE.CUSTOM_IMAGE) {
      this.customImageObject = null
    }

    this.canvas.remove(active)
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.emitSelection()
    this.callbacks.onCanvasChanged?.()
    return true
  }

  clearCustomizations(): void {
    const toRemove = this.canvas
      .getObjects()
      .filter(
        (obj) =>
          getObjectRole(obj) !== OBJECT_ROLE.PRODUCT &&
          getObjectRole(obj) !== OBJECT_ROLE.PRINT_AREA_GUIDE,
      )

    for (const obj of toRemove) {
      this.canvas.remove(obj)
    }

    this.customImageObject = null
    this.canvas.discardActiveObject()
    this.canvas.renderAll()
    this.emitSelection()
    this.callbacks.onCanvasChanged?.()
  }

  // ─── Export ─────────────────────────────────────────────────────────────────

  exportCompositePng(): string {
    if (!this.hasProductImage()) {
      throw new Error('Load a garment before generating a preview.')
    }

    // Temporarily hide the print area guide for a clean export
    if (this.printAreaGuideObject) {
      this.printAreaGuideObject.visible = false
    }

    this.canvas.discardActiveObject()
    this.canvas.renderAll()

    const dataUrl = this.canvas.toDataURL({
      format: 'png',
      multiplier: 1,
      enableRetinaScaling: false,
    })

    // Restore guide visibility
    if (this.printAreaGuideObject) {
      this.printAreaGuideObject.visible = this.showingPrintBoundary
      this.canvas.renderAll()
    }

    return dataUrl
  }

  // ─── Keyboard ───────────────────────────────────────────────────────────────

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Delete' && event.key !== 'Backspace') {
      return
    }

    const active = this.canvas.getActiveObject()
    if (active instanceof IText && (active as IText).isEditing) {
      return
    }

    if (this.deleteSelected()) {
      event.preventDefault()
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private lockedImageProps(left: number, top: number, scale: number) {
    return {
      left,
      top,
      originX: 'left' as const,
      originY: 'top' as const,
      scaleX: scale,
      scaleY: scale,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
    }
  }

  private computeAbsolutePrintArea(): {
    left: number
    top: number
    width: number
    height: number
  } | null {
    if (!this.currentPrintArea || this.logicalWidth === 0) return null
    const { xPct, yPct, wPct, hPct } = this.currentPrintArea
    return {
      left: xPct * this.logicalWidth,
      top: yPct * this.logicalHeight,
      width: wPct * this.logicalWidth,
      height: hPct * this.logicalHeight,
    }
  }

  private centerImageInPrintArea(img: FabricImage): void {
    const area = this.computeAbsolutePrintArea()
    if (!area) return

    const { width: nw, height: nh } = img.getOriginalSize()
    const scaleToFit = Math.min(
      (area.width * 0.8) / nw,
      (area.height * 0.8) / nh,
    )

    img.set({
      left: area.left + area.width / 2,
      top: area.top + area.height / 2,
      scaleX: scaleToFit,
      scaleY: scaleToFit,
    })
  }

  private rebuildPrintAreaGuide(): void {
    if (this.printAreaGuideObject) {
      this.canvas.remove(this.printAreaGuideObject)
      this.printAreaGuideObject = null
    }

    if (!this.showingPrintBoundary) return

    const area = this.computeAbsolutePrintArea()
    if (!area) return

    const rect = new Rect({
      left: area.left,
      top: area.top,
      width: area.width,
      height: area.height,
      fill: 'rgba(124, 108, 255, 0.04)',
      stroke: '#7c6cff',
      strokeWidth: 1.5,
      strokeDashArray: [8, 5],
      rx: 4,
      ry: 4,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    })
    setObjectRole(rect, OBJECT_ROLE.PRINT_AREA_GUIDE)

    this.printAreaGuideObject = rect
    this.canvas.add(rect)

    // Keep guide below the custom image
    if (this.customImageObject) {
      this.canvas.bringObjectToFront(this.customImageObject)
    }
  }

  private constrainObjectToCanvas(obj: FabricObject): void {
    const l = obj.left ?? 0
    const t = obj.top ?? 0
    const w = obj.getScaledWidth()
    const h = obj.getScaledHeight()

    obj.set({
      left: Math.max(w / 2, Math.min(this.logicalWidth - w / 2, l)),
      top: Math.max(h / 2, Math.min(this.logicalHeight - h / 2, t)),
    })
  }

  private applyResponsiveScale(): void {
    if (!this.container || this.logicalWidth === 0 || this.logicalHeight === 0) {
      return
    }

    const availableWidth = this.container.clientWidth
    if (availableWidth <= 0) {
      return
    }

    const scale = Math.min(1, availableWidth / this.logicalWidth)
    const cssWidth = Math.round(this.logicalWidth * scale)
    const cssHeight = Math.round(this.logicalHeight * scale)

    this.canvas.setDimensions(
      { width: `${cssWidth}px`, height: `${cssHeight}px` },
      { cssOnly: true },
    )
    this.canvas.requestRenderAll()
  }

  private emitSelection(): void {
    const active = this.canvas.getActiveObject()
    if (!active) {
      this.callbacks.onSelectionChange?.(null)
      return
    }

    const role = getObjectRole(active)
    if (role === OBJECT_ROLE.CUSTOM_IMAGE && active instanceof FabricImage) {
      this.callbacks.onSelectionChange?.({
        kind: 'custom-image',
        object: active,
      })
      return
    }

    if (role === OBJECT_ROLE.CUSTOM_TEXT && active instanceof IText) {
      this.callbacks.onSelectionChange?.({
        kind: 'text',
        object: active,
        text: active.text ?? '',
        fontSize: active.fontSize ?? 32,
        fill: typeof active.fill === 'string' ? active.fill : '#000000',
      })
      return
    }

    this.callbacks.onSelectionChange?.(null)
  }
}
