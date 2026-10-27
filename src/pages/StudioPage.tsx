import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathParam, useRouter } from '../router'
import { getProduct } from '../data/products'
import { useCart } from '../context/CartContext'
import { useTshirtEditor } from '../hooks/useTshirtEditor'
import {
  GARMENT_COLORS,
  PRINT_AREAS,
  PRINT_POSITION_LABELS,
  getGarmentDataUrl,
  isAcceptedImageFile,
  isFileSizeAccepted,
} from '../core'
import type { GarmentColor, GarmentView, PrintPosition } from '../core'

export function StudioPage() {
  const productId = usePathParam(1) // /studio/:id
  const { search, navigate } = useRouter()
  const { addItem } = useCart()
  const product = getProduct(productId)

  // ─── State ─────────────────────────────────────────────────────────────────
  const [selectedColor, setSelectedColor] = useState<GarmentColor>(
    () => (search.color as GarmentColor) ?? product?.colors[0] ?? 'white',
  )
  const [selectedSize, setSelectedSize] = useState<string>(
    () => search.size ?? product?.sizes[2] ?? 'M',
  )
  const [printPosition, setPrintPosition] = useState<PrintPosition>(
    () => (search.position as PrintPosition) ?? 'front-center',
  )
  const [view, setView] = useState<GarmentView>('front')
  const [quantity, setQuantity] = useState(1)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'controls' | 'summary'>('controls')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Editor hook ────────────────────────────────────────────────────────────
  const {
    canvasRef,
    containerRef,
    getEditor,
    isEditorReady,
    hasProduct,
    hasDesign,
    statusMessage,
    errorMessage,
    showError,
    loadGarment,
    updatePrintArea,
    togglePrintBoundary,
    scaleDesign,
    centerDesign,
    removeDesign,
  } = useTshirtEditor()

  // ─── Initial garment load ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditorReady) return
    const url = getGarmentDataUrl(GARMENT_COLORS[selectedColor].hex, view)
    void loadGarment(url)
    togglePrintBoundary(true)
    const area = PRINT_AREAS[printPosition]
    updatePrintArea(area)
  // Only run once editor is ready; subsequent changes handled below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorReady])

  // ─── Color / view changes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditorReady) return
    const url = getGarmentDataUrl(GARMENT_COLORS[selectedColor].hex, view)
    void loadGarment(url)
  }, [selectedColor, view, isEditorReady, loadGarment])

  // ─── Print position changes ────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditorReady) return
    const area = PRINT_AREAS[printPosition]
    updatePrintArea(area)
    // Switch garment view to match position
    if (area.view !== view) {
      setView(area.view)
    }
  }, [printPosition, isEditorReady, updatePrintArea, view])

  // ─── Image upload ──────────────────────────────────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null)
      setPreviewUrl(null)

      if (!isAcceptedImageFile(file)) {
        setUploadError('Unsupported file type. Please upload a PNG, JPEG, or WebP image.')
        return
      }
      if (!isFileSizeAccepted(file)) {
        setUploadError('File is too large. Maximum size is 10 MB.')
        return
      }

      const editor = getEditor()
      if (!editor) return

      try {
        await editor.setCustomImageFromFile(file)
        setUploadFileName(file.name)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Failed to load the image.')
      }
    },
    [getEditor],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => setIsDraggingOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  // ─── Garment color change ──────────────────────────────────────────────────
  const handleColorChange = (color: GarmentColor) => {
    setSelectedColor(color)
    setAddedToCart(false)
    setPreviewUrl(null)
  }

  // ─── View toggle ─────────────────────────────────────────────────────────────
  const handleViewChange = (v: GarmentView) => {
    setView(v)
  }

  // ─── Position change ──────────────────────────────────────────────────────
  const handlePositionChange = (pos: PrintPosition) => {
    setPrintPosition(pos)
  }

  // ─── Remove design ────────────────────────────────────────────────────────
  const handleRemoveDesign = () => {
    removeDesign()
    setUploadFileName(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Preview ──────────────────────────────────────────────────────────────
  const handleGeneratePreview = () => {
    const editor = getEditor()
    if (!editor) return
    try {
      const url = editor.exportCompositePng()
      setPreviewUrl(url)
      setShowPreview(true)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not generate preview.')
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `threadcraft-${product?.id ?? 'custom'}.png`
    a.click()
  }

  // ─── Add to cart ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product) return

    let preview: string | null = null
    const editor = getEditor()
    if (editor && hasProduct) {
      try {
        preview = editor.exportCompositePng()
      } catch {
        // Continue without preview
      }
    }

    addItem({
      productId: product.id,
      productName: product.name,
      color: selectedColor,
      colorHex: GARMENT_COLORS[selectedColor].hex,
      size: selectedSize,
      quantity,
      printPosition,
      designDataUrl: null,
      previewDataUrl: preview,
      price: product.price,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 3000)
  }

  // ─── Product not found ────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="page error-page">
        <h2>Product not found</h2>
        <button className="btn btn--primary" onClick={() => navigate('/shop')}>
          Back to Shop
        </button>
      </div>
    )
  }

  const activeMessage = errorMessage ?? uploadError ?? statusMessage

  return (
    <div className="studio-page">
      {/* ─── Studio header ─────────────────────────────────────────── */}
      <div className="studio-header">
        <div className="studio-header__left">
          <button
            className="studio-back-btn"
            onClick={() => navigate(`/product/${product.id}`)}
            aria-label="Back to product"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {product.name}
          </button>
        </div>
        <h1 className="studio-header__title">Customization Studio</h1>
        <div className="studio-header__right">
          <button
            className="btn btn--cta"
            onClick={handleAddToCart}
            disabled={!hasProduct}
          >
            {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* ─── Mobile panel tabs ─────────────────────────────────────── */}
      <div className="studio-mobile-tabs">
        <button
          className={`studio-tab-btn ${activePanel === 'controls' ? 'studio-tab-btn--active' : ''}`}
          onClick={() => setActivePanel('controls')}
        >Controls</button>
        <button
          className={`studio-tab-btn ${activePanel === 'summary' ? 'studio-tab-btn--active' : ''}`}
          onClick={() => setActivePanel('summary')}
        >Summary</button>
      </div>

      {/* ─── Main studio layout ────────────────────────────────────── */}
      <div className="studio-layout">

        {/* Left panel — controls */}
        <aside
          className={`studio-panel studio-panel--left ${activePanel === 'controls' ? 'studio-panel--visible' : ''}`}
          aria-label="Customization controls"
        >
          {/* Garment color */}
          <section className="studio-section">
            <h2 className="studio-section__title">Garment Color</h2>
            <div className="color-selector" role="group" aria-label="Select garment color">
              {product.colors.map((c) => (
                <button
                  key={c}
                  className={`color-swatch color-swatch--lg ${selectedColor === c ? 'color-swatch--active' : ''}`}
                  style={{ '--swatch-color': GARMENT_COLORS[c].hex } as React.CSSProperties}
                  aria-label={`Select ${GARMENT_COLORS[c].label}`}
                  aria-pressed={selectedColor === c}
                  title={GARMENT_COLORS[c].label}
                  onClick={() => handleColorChange(c)}
                />
              ))}
            </div>
            <p className="studio-hint">{GARMENT_COLORS[selectedColor].label}</p>
          </section>

          {/* Garment view */}
          <section className="studio-section">
            <h2 className="studio-section__title">Garment View</h2>
            <div className="view-toggle" role="group" aria-label="Switch garment view">
              {product.supportedViews.map((v) => (
                <button
                  key={v}
                  className={`view-toggle__btn ${view === v ? 'view-toggle__btn--active' : ''}`}
                  aria-pressed={view === v}
                  onClick={() => handleViewChange(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Print position */}
          <section className="studio-section">
            <h2 className="studio-section__title">Print Position</h2>
            <p className="studio-hint">Left/right refer to the wearer's perspective.</p>
            <div className="studio-positions" role="group" aria-label="Select print position">
              {product.supportedPositions.map((pos) => (
                <button
                  key={pos}
                  className={`position-btn position-btn--studio ${printPosition === pos ? 'position-btn--active' : ''}`}
                  aria-pressed={printPosition === pos}
                  onClick={() => handlePositionChange(pos)}
                >
                  {PRINT_POSITION_LABELS[pos]}
                </button>
              ))}
            </div>
          </section>

          {/* Image upload */}
          <section className="studio-section">
            <h2 className="studio-section__title">Your Design</h2>
            <div
              className={`upload-zone ${isDraggingOver ? 'upload-zone--dragover' : ''} ${hasDesign ? 'upload-zone--has-design' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload design image"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={handleFileInput}
                className="upload-zone__input"
                aria-hidden="true"
              />
              {hasDesign ? (
                <div className="upload-zone__success">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>{uploadFileName ?? 'Design uploaded'}</span>
                  <span className="upload-zone__replace">Click to replace</span>
                </div>
              ) : (
                <div className="upload-zone__empty">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                  </svg>
                  <span className="upload-zone__label">Drop image here</span>
                  <span className="upload-zone__sublabel">or click to browse</span>
                  <span className="upload-zone__formats">PNG · JPEG · WebP · Max 10 MB</span>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="studio-error" role="alert">{uploadError}</p>
            )}
          </section>

          {/* Design controls */}
          {hasDesign && (
            <section className="studio-section">
              <h2 className="studio-section__title">Design Controls</h2>
              <div className="design-controls">
                <button
                  className="design-ctrl-btn"
                  onClick={() => scaleDesign(1.1)}
                  title="Scale up"
                  aria-label="Increase design size"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Larger
                </button>
                <button
                  className="design-ctrl-btn"
                  onClick={() => scaleDesign(0.9)}
                  title="Scale down"
                  aria-label="Decrease design size"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Smaller
                </button>
                <button
                  className="design-ctrl-btn"
                  onClick={centerDesign}
                  title="Center design"
                  aria-label="Center design in print area"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="3" x2="12" y2="6"/>
                    <line x1="12" y1="18" x2="12" y2="21"/>
                    <line x1="3" y1="12" x2="6" y2="12"/>
                    <line x1="18" y1="12" x2="21" y2="12"/>
                  </svg>
                  Center
                </button>
                <button
                  className="design-ctrl-btn design-ctrl-btn--danger"
                  onClick={handleRemoveDesign}
                  title="Remove design"
                  aria-label="Remove uploaded design"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                  Remove
                </button>
              </div>
            </section>
          )}
        </aside>

        {/* Center — canvas */}
        <main className="studio-canvas-area" aria-label="T-shirt design canvas">
          <div
            ref={containerRef}
            className={`studio-canvas-wrap ${!hasProduct ? 'studio-canvas-wrap--loading' : ''}`}
          >
            <canvas
              ref={canvasRef}
              tabIndex={0}
              aria-label="T-shirt customization canvas. Use mouse to drag and resize your design."
            />
            {!hasProduct && (
              <div className="studio-canvas-placeholder">
                <div className="studio-canvas-spinner" aria-hidden="true" />
                <p>Loading garment…</p>
              </div>
            )}
          </div>

          {/* Message strip */}
          {activeMessage && (
            <div
              className={`studio-message ${errorMessage || uploadError ? 'studio-message--error' : 'studio-message--info'}`}
              role="status"
              aria-live="polite"
            >
              {activeMessage}
            </div>
          )}

          {/* Canvas actions */}
          <div className="studio-canvas-actions">
            <button
              className="btn btn--ghost btn--sm"
              disabled={!hasProduct}
              onClick={handleGeneratePreview}
            >
              Generate Preview
            </button>
            {previewUrl && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={handleDownload}
              >
                Download PNG
              </button>
            )}
          </div>

          {/* Preview modal */}
          {showPreview && previewUrl && (
            <div
              className="preview-modal-overlay"
              onClick={() => setShowPreview(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Design preview"
            >
              <div
                className="preview-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="preview-modal__header">
                  <h2>Your Design Preview</h2>
                  <button
                    className="preview-modal__close"
                    onClick={() => setShowPreview(false)}
                    aria-label="Close preview"
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={previewUrl}
                  alt="Customized t-shirt preview"
                  className="preview-modal__image"
                />
                <div className="preview-modal__actions">
                  <button className="btn btn--ghost" onClick={handleDownload}>
                    Download PNG
                  </button>
                  <button className="btn btn--cta" onClick={handleAddToCart}>
                    {addedToCart ? '✓ Added!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right panel — summary */}
        <aside
          className={`studio-panel studio-panel--right ${activePanel === 'summary' ? 'studio-panel--visible' : ''}`}
          aria-label="Order summary"
        >
          <section className="studio-section">
            <h2 className="studio-section__title">Order Summary</h2>

            <div className="summary-item">
              <span className="summary-label">Product</span>
              <span className="summary-value">{product.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Color</span>
              <span className="summary-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className="summary-swatch"
                  style={{ background: GARMENT_COLORS[selectedColor].hex }}
                />
                {GARMENT_COLORS[selectedColor].label}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Print Position</span>
              <span className="summary-value">{PRINT_POSITION_LABELS[printPosition]}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Design</span>
              <span className="summary-value">{hasDesign ? '✓ Uploaded' : 'Not uploaded'}</span>
            </div>
          </section>

          {/* Size selector */}
          <section className="studio-section">
            <h2 className="studio-section__title">Size</h2>
            <div className="size-selector" role="group" aria-label="Select size">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  className={`size-btn ${selectedSize === s ? 'size-btn--active' : ''}`}
                  aria-pressed={selectedSize === s}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Quantity */}
          <section className="studio-section">
            <h2 className="studio-section__title">Quantity</h2>
            <div className="qty-selector">
              <button
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
              >−</button>
              <span className="qty-value" aria-live="polite">{quantity}</span>
              <button
                className="qty-btn"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >+</button>
            </div>
          </section>

          {/* Price + CTA */}
          <section className="studio-section studio-section--cta">
            <div className="summary-price-row">
              <span className="summary-price-label">Total</span>
              <span className="summary-price">
                ${(product.price * quantity).toFixed(2)}
              </span>
            </div>
            <button
              className="btn btn--cta btn--full btn--lg"
              onClick={handleAddToCart}
              disabled={!hasProduct}
            >
              {addedToCart ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Added to Cart!
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
            <button
              className="btn btn--ghost btn--full"
              onClick={() => navigate('/cart')}
            >
              View Cart
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
