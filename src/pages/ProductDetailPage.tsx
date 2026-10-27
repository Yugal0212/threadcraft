import { useState, useRef, useMemo } from 'react'
import { useRouter } from '../router'
import { useCart } from '../context/CartContext'
import { GARMENT_COLORS } from '../core'
import type { GarmentColor } from '../core'

export type TShirtAngle = 'front' | 'logo-chest' | 'back' | 'sleeve'

interface AngleConfig {
  key: TShirtAngle
  label: string
  shortLabel: string
  dimensionsLabel: string
  printAreaStyle: {
    top: string
    left: string
    width: string
    height: string
  }
}

const ANGLES: AngleConfig[] = [
  {
    key: 'front',
    label: 'Front (Full Photo)',
    shortLabel: 'Front Photo',
    dimensionsLabel: '28 × 35 cm',
    printAreaStyle: {
      top: '50%',
      left: '50%',
      width: '42%',
      height: '38%',
    },
  },
  {
    key: 'logo-chest',
    label: 'Left Chest (Logo)',
    shortLabel: 'Logo Side',
    dimensionsLabel: '10 × 10 cm',
    printAreaStyle: {
      top: '32%',
      left: '64%',
      width: '18%',
      height: '18%',
    },
  },
  {
    key: 'back',
    label: 'Back Side',
    shortLabel: 'Back',
    dimensionsLabel: '28 × 35 cm',
    printAreaStyle: {
      top: '44%',
      left: '50%',
      width: '42%',
      height: '38%',
    },
  },
  {
    key: 'sleeve',
    label: 'Sleeve',
    shortLabel: 'Sleeve',
    dimensionsLabel: '10 × 10 cm',
    printAreaStyle: {
      top: '28%',
      left: '52%',
      width: '20%',
      height: '20%',
    },
  },
]

const SAMPLE_LOGOS = [
  { id: 'explore', label: 'Explore Badge', src: '/sample-logos/mountain-badge.svg' },
  { id: 'vintage', label: 'Vintage NYC', src: '/sample-logos/vintage-typography.svg' },
  { id: 'gift', label: 'Gift Heart', src: '/sample-logos/gift-heart.svg' },
]

const AVAILABLE_COLORS: GarmentColor[] = [
  'black',
  'white',
  'navy',
  'red',
  'grey',
  'olive',
  'yellow',
  'purple',
  'maroon',
  'green',
  'charcoal',
  'sky-blue',
  'pink',
  'peach',
  'teal',
]

const SIZES = ['Small', 'Medium', 'Large', 'XL', '2XL', '3XL', '4XL']
const MATERIALS = ['Poly-Cotton', 'Cotton', 'Supima-Cotton']

export function ProductDetailPage() {
  const { navigate } = useRouter()
  const { addItem } = useCart()

  // Selected T-shirt angle / placement
  const [activeAngle, setActiveAngle] = useState<TShirtAngle>('front')

  // Selected Garment Color, Size & Material
  const [selectedColor, setSelectedColor] = useState<GarmentColor>('white')
  const [selectedSize, setSelectedSize] = useState<string>('Medium')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Cotton')
  const [isPlainItem, setIsPlainItem] = useState<boolean>(false)
  const [quantity, setQuantity] = useState<number>(1)

  // Per-placement artwork image & transform states
  const [designs, setDesigns] = useState<Record<TShirtAngle, string | null>>({
    front: null,
    'logo-chest': null,
    back: null,
    sleeve: null,
  })

  const [scales, setScales] = useState<Record<TShirtAngle, number>>({
    front: 100,
    'logo-chest': 100,
    back: 100,
    sleeve: 100,
  })

  const [offsets, setOffsets] = useState<Record<TShirtAngle, { x: number; y: number }>>({
    front: { x: 0, y: 0 },
    'logo-chest': { x: 0, y: 0 },
    back: { x: 0, y: 0 },
    sleeve: { x: 0, y: 0 },
  })

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAngle, setReviewAngle] = useState<TShirtAngle>('front')

  // Dragging & Resizing refs
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const initialOffset = useRef({ x: 0, y: 0 })
  const initialScale = useRef<number>(100)
  const resizeCenter = useRef({ x: 0, y: 0 })

  // Notifications
  const [showToast, setShowToast] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Current active angle configuration
  const currentConfig = useMemo(() => {
    return ANGLES.find((a) => a.key === activeAngle) || ANGLES[0]
  }, [activeAngle])

  const isDarkShirt = selectedColor === 'black' || selectedColor === 'navy' || selectedColor === 'charcoal'

  // Compute mockup image based on color and angle
  const garmentMockupSrc = useMemo(() => {
    if (activeAngle === 'back') {
      return isDarkShirt ? '/mockups/black-back.jpg?v=4' : '/mockups/white-back.jpg?v=4'
    }
    if (activeAngle === 'sleeve') {
      return isDarkShirt ? '/mockups/black-sleeve.jpg?v=4' : '/mockups/white-sleeve.jpg?v=4'
    }
    // 'front' and 'logo-chest' use front mockup
    return isDarkShirt ? '/mockups/black-front.jpg?v=4' : '/mockups/white-front.jpg?v=4'
  }, [isDarkShirt, activeAngle])

  const activeImage = isPlainItem ? null : designs[activeAngle]
  const activeScale = scales[activeAngle]
  const activeOffset = offsets[activeAngle]

  const setCurImage = (src: string | null) => {
    setDesigns((prev) => ({ ...prev, [activeAngle]: src }))
  }

  const setCurScale = (val: number) => {
    setScales((prev) => ({ ...prev, [activeAngle]: val }))
  }

  const setCurOffset = (offset: { x: number; y: number }) => {
    setOffsets((prev) => ({ ...prev, [activeAngle]: offset }))
  }

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setFileError('Please select a valid image file (PNG, JPEG, or WebP).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size is too large. Please select an image under 10 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCurImage(event.target.result)
        setCurScale(100)
        setCurOffset({ x: 0, y: 0 })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Handle Quick Add Text
  const handlePromptAddText = () => {
    const text = window.prompt('Enter custom text to print on your T-shirt:', 'CUSTOM VIBES')
    if (!text || !text.trim()) return

    const textColor = isDarkShirt ? '#ffffff' : '#0f172a'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" fill="${textColor}" letter-spacing="2">
        ${text.trim().toUpperCase()}
      </text>
    </svg>`
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    setCurImage(dataUrl)
    setCurScale(100)
    setCurOffset({ x: 0, y: 0 })
  }

  // Drag-to-move pointer handlers
  const handleMovePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isResizing.current) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    initialOffset.current = { ...activeOffset }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleMovePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const maxOffset = 60
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, initialOffset.current.x + dx))
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, initialOffset.current.y + dy))
    setCurOffset({ x: clampedX, y: clampedY })
  }

  const handleMovePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  // Corner resize pointer handlers
  const handleCornerResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    isResizing.current = true
    isDragging.current = false

    const box = (e.currentTarget.parentElement as HTMLElement)?.getBoundingClientRect()
    if (box) {
      resizeCenter.current = {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
      }
    }
    initialScale.current = activeScale
    dragStart.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleCornerResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing.current) return
    e.stopPropagation()

    const initialDist = Math.hypot(
      dragStart.current.x - resizeCenter.current.x,
      dragStart.current.y - resizeCenter.current.y,
    )
    const currentDist = Math.hypot(
      e.clientX - resizeCenter.current.x,
      e.clientY - resizeCenter.current.y,
    )

    if (initialDist > 0) {
      const scaleMultiplier = currentDist / initialDist
      const newScale = Math.round(Math.max(40, Math.min(180, initialScale.current * scaleMultiplier)))
      setCurScale(newScale)
    }
  }

  const handleCornerResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isResizing.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  // Add to cart handler
  const handleAddToCart = () => {
    const colorLabel = GARMENT_COLORS[selectedColor]?.label || 'White'
    const unitPrice = isPlainItem ? 12.99 : 19.99

    addItem({
      productId: 'customized-half-sleeve-tee',
      productName: `${colorLabel} Customized Half Sleeve Men's Cotton T-Shirt (${currentConfig.label})`,
      color: selectedColor,
      colorHex: GARMENT_COLORS[selectedColor].hex,
      size: selectedSize,
      quantity,
      printPosition: activeAngle === 'front' ? 'front-center' : activeAngle === 'logo-chest' ? 'front-left-chest' : activeAngle === 'back' ? 'back-center' : 'sleeves-left',
      designDataUrl: isPlainItem ? null : (designs.front || designs['logo-chest'] || designs.back || designs.sleeve || null),
      previewDataUrl: garmentMockupSrc,
      price: unitPrice,
    })

    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      navigate('/cart')
    }, 800)
  }

  const colorLabel = GARMENT_COLORS[selectedColor]?.label || 'White'

  return (
    <div className="product-page-wrapper">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Cart Toast notification */}
      {showToast && (
        <div className="mobile-cart-toast" role="status">
          ✓ Added {quantity} item(s) to cart! Taking you to checkout...
        </div>
      )}

      {/* ─── Breadcrumb Back Navigation ──────────────────────────────── */}
      <div className="product-top-nav">
        <button
          className="back-catalog-btn"
          onClick={() => navigate('/shop')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to All Products</span>
        </button>
      </div>

      {/* ─── 2-Column Product Layout (Left Mockup, Right Options) ─────── */}
      <div className="product-main-grid">

        {/* ══════════════════════════════════════════════════════════════
            LEFT COLUMN: T-SHIRT MOCKUP + PRINT AREA + STAGE CONTROLS
           ══════════════════════════════════════════════════════════════ */}
        <div className="product-left-col">
          <div className="garment-card">

            {/* Top Ribbon matching reference */}
            <div className="stage-top-ribbon">
              <div className="stage-sides-group">
                <span className="stage-sides-label">Print Placement:</span>
                <label
                  className={`stage-side-chk ${activeAngle === 'front' ? 'stage-side-chk--active' : ''}`}
                  onClick={() => setActiveAngle('front')}
                >
                  <input type="checkbox" checked={activeAngle === 'front'} readOnly />
                  <span>Front Photo ({ANGLES[0].dimensionsLabel})</span>
                </label>
                <label
                  className={`stage-side-chk ${activeAngle === 'logo-chest' ? 'stage-side-chk--active' : ''}`}
                  onClick={() => setActiveAngle('logo-chest')}
                >
                  <input type="checkbox" checked={activeAngle === 'logo-chest'} readOnly />
                  <span>Logo Side ({ANGLES[1].dimensionsLabel})</span>
                </label>
                <label
                  className={`stage-side-chk ${activeAngle === 'back' ? 'stage-side-chk--active' : ''}`}
                  onClick={() => setActiveAngle('back')}
                >
                  <input type="checkbox" checked={activeAngle === 'back'} readOnly />
                  <span>Back ({ANGLES[2].dimensionsLabel})</span>
                </label>
                <label
                  className={`stage-side-chk ${activeAngle === 'sleeve' ? 'stage-side-chk--active' : ''}`}
                  onClick={() => setActiveAngle('sleeve')}
                >
                  <input type="checkbox" checked={activeAngle === 'sleeve'} readOnly />
                  <span>Sleeve ({ANGLES[3].dimensionsLabel})</span>
                </label>
              </div>
              <div className="stage-top-badge" title="High-Definition DTG Direct-To-Garment Print">
                <span>✦</span>
              </div>
            </div>

            {/* Mockup stage with properly proportioned print area */}
            <div className="garment-stage">
              <img
                src={garmentMockupSrc}
                alt={`${colorLabel} Customized T-shirt ${currentConfig.label}`}
                className="garment-stage-img"
              />

              {/* Proportional, clipped printable region (hidden if plain item toggled) */}
              {!isPlainItem && (
                <div
                  className={`printable-region ${!activeImage ? 'printable-region--empty' : 'printable-region--loaded'} ${isDarkShirt ? 'printable-region--dark' : 'printable-region--light'}`}
                  style={{
                    top: currentConfig.printAreaStyle.top,
                    left: currentConfig.printAreaStyle.left,
                    width: currentConfig.printAreaStyle.width,
                    height: currentConfig.printAreaStyle.height,
                  }}
                  onClick={() => {
                    if (!activeImage) fileInputRef.current?.click()
                  }}
                >
                  {!activeImage ? (
                    /* Minimal, subtle placeholder without big text clutter */
                    <div className="clean-add-art-placeholder">
                      <div className="clean-add-art-pill">
                        <span className="plus-sym">+</span>
                        <span>Add Image</span>
                      </div>
                    </div>
                  ) : (
                    /* Customer's uploaded image strictly contained within the print area */
                    <div
                      className="interactive-artwork-box"
                      style={{
                        transform: `translate(${activeOffset.x}px, ${activeOffset.y}px) scale(${activeScale / 100})`,
                      }}
                      onPointerDown={handleMovePointerDown}
                      onPointerMove={handleMovePointerMove}
                      onPointerUp={handleMovePointerUp}
                    >
                      <img
                        src={activeImage}
                        alt="Customer artwork on T-Shirt"
                        className="customer-print-img"
                        draggable={false}
                      />

                      {/* 4 Corner Resize Handles */}
                      <div
                        className="corner-handle corner-handle--nw"
                        onPointerDown={handleCornerResizeDown}
                        onPointerMove={handleCornerResizeMove}
                        onPointerUp={handleCornerResizeUp}
                        title="Resize top-left"
                      />
                      <div
                        className="corner-handle corner-handle--ne"
                        onPointerDown={handleCornerResizeDown}
                        onPointerMove={handleCornerResizeMove}
                        onPointerUp={handleCornerResizeUp}
                        title="Resize top-right"
                      />
                      <div
                        className="corner-handle corner-handle--se"
                        onPointerDown={handleCornerResizeDown}
                        onPointerMove={handleCornerResizeMove}
                        onPointerUp={handleCornerResizeUp}
                        title="Resize bottom-right"
                      />
                      <div
                        className="corner-handle corner-handle--sw"
                        onPointerDown={handleCornerResizeDown}
                        onPointerMove={handleCornerResizeMove}
                        onPointerUp={handleCornerResizeUp}
                        title="Resize bottom-left"
                      />

                      {/* Remove Button */}
                      <button
                        className="remove-art-pill"
                        title="Remove artwork"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurImage(null)
                          setCurOffset({ x: 0, y: 0 })
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error banner */}
            {fileError && (
              <div className="file-error-banner" role="alert">
                {fileError}
              </div>
            )}

            {/* ─── 4 Action Buttons directly below mockup stage ─ */}
            <div className="stage-actions-bar">
              <button
                className="stage-action-pill stage-action-pill--dark"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>{activeImage ? 'Change Image' : 'Add Image'}</span>
              </button>

              <button
                className="stage-action-pill stage-action-pill--dark"
                onClick={handlePromptAddText}
              >
                <span className="action-pill-glyph">A</span>
                <span>Add Text</span>
              </button>

              <button
                className="stage-action-pill stage-action-pill--outline"
                onClick={() => {
                  setReviewAngle(activeAngle)
                  setShowReviewModal(true)
                }}
              >
                <span className="action-pill-glyph">👁️</span>
                <span>Preview</span>
              </button>

              <button
                className="stage-action-pill stage-action-pill--outline"
                onClick={() => window.open('https://api.whatsapp.com/send?text=Hi,%20I%20want%20to%20customize%20my%20T-Shirt', '_blank')}
              >
                <span className="action-pill-glyph" style={{ color: '#22c55e' }}>💬</span>
                <span>Design on WhatsApp</span>
              </button>
            </div>

            {/* ─── 4 Placement Switcher Buttons ──────────────────────── */}
            <div className="angles-switcher-container">
              <span className="angles-switcher-title">Select Placement:</span>
              <div className="angles-button-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {ANGLES.map((angle) => {
                  const isActive = activeAngle === angle.key
                  const hasDesign = Boolean(designs[angle.key])
                  return (
                    <button
                      key={angle.key}
                      className={`angle-btn ${isActive ? 'angle-btn--active' : ''}`}
                      onClick={() => setActiveAngle(angle.key)}
                    >
                      <span className="angle-icon">
                        {angle.key === 'front' ? '🖼️' : angle.key === 'logo-chest' ? '👕' : angle.key === 'back' ? '🔄' : '💪'}
                      </span>
                      <span className="angle-name">{angle.shortLabel}</span>
                      <span className="angle-dimensions">{angle.dimensionsLabel}</span>
                      {hasDesign && <span className="angle-dot" title="Has artwork">•</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── Sample Logos Strip ────────────────────────────────── */}
            <div className="sample-logos-strip">
              <span className="sample-logos-title">Or test with a sample logo:</span>
              <div className="sample-logos-list">
                {SAMPLE_LOGOS.map((logo) => (
                  <button
                    key={logo.id}
                    className="sample-logo-chip"
                    onClick={() => {
                      setCurImage(logo.src)
                      setCurScale(100)
                      setCurOffset({ x: 0, y: 0 })
                    }}
                  >
                    <img src={logo.src} alt={logo.label} />
                    <span>{logo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Scale Controls Toolbar (when image loaded) ────────── */}
            {activeImage && (
              <div className="interactive-size-toolbar">
                <span className="size-toolbar-title">Scale:</span>
                <div className="size-btn-group">
                  <button
                    className="size-step-btn"
                    onClick={() => setCurScale(Math.max(40, activeScale - 10))}
                    title="Decrease scale"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min="40"
                    max="180"
                    value={activeScale}
                    onChange={(e) => setCurScale(Number(e.target.value))}
                    className="size-stepless-slider"
                    aria-label="Adjust scale"
                  />
                  <button
                    className="size-step-btn"
                    onClick={() => setCurScale(Math.min(180, activeScale + 10))}
                    title="Increase scale"
                  >
                    +
                  </button>
                </div>
                <button
                  className="size-reset-btn"
                  onClick={() => {
                    setCurScale(100)
                    setCurOffset({ x: 0, y: 0 })
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT COLUMN: PRODUCT DETAILS, COLORS, SIZES & ACTIONS
           ══════════════════════════════════════════════════════════════ */}
        <div className="product-right-col">
          <div className="product-details-card">
            {/* Title matching reference screenshot */}
            <h1 className="product-detail-title">
              {colorLabel} Customized Half Sleeve Men's Cotton T-Shirt
            </h1>

            {/* Rating */}
            <div className="rating-row">
              <span className="stars">★★★★★</span>
              <span className="score">4.9</span>
              <span className="sep">•</span>
              <span className="reviews">1,428 Verified Reviews</span>
            </div>

            {/* Print Placement Selector on right */}
            <div className="option-section option-section--sides">
              <label className="option-header">
                Print Placement:
              </label>
              <div className="sides-chk-row">
                <label className={`side-box-label ${activeAngle === 'front' ? 'active' : ''}`} onClick={() => setActiveAngle('front')}>
                  <input type="checkbox" checked={activeAngle === 'front'} readOnly />
                  <span>Front Photo</span>
                </label>
                <label className={`side-box-label ${activeAngle === 'logo-chest' ? 'active' : ''}`} onClick={() => setActiveAngle('logo-chest')}>
                  <input type="checkbox" checked={activeAngle === 'logo-chest'} readOnly />
                  <span>Logo Side</span>
                </label>
                <label className={`side-box-label ${activeAngle === 'back' ? 'active' : ''}`} onClick={() => setActiveAngle('back')}>
                  <input type="checkbox" checked={activeAngle === 'back'} readOnly />
                  <span>Back</span>
                </label>
                <label className={`side-box-label ${activeAngle === 'sleeve' ? 'active' : ''}`} onClick={() => setActiveAngle('sleeve')}>
                  <input type="checkbox" checked={activeAngle === 'sleeve'} readOnly />
                  <span>Sleeve</span>
                </label>
              </div>
            </div>

            {/* Size Selector */}
            <div className="option-section">
              <div className="option-header-row">
                <label className="option-header">
                  Size: <strong>{selectedSize}</strong>
                </label>
                <a href="#size-chart" className="size-chart-link" onClick={(e) => { e.preventDefault(); alert('Size Chart: Standard Men regular fit S(38"), M(40"), L(42"), XL(44"), 2XL(46"), 3XL(48").'); }}>
                  Size Chart
                </a>
              </div>
              <div className="size-pills-row">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    className={`size-choice-btn ${selectedSize === s ? 'size-choice-btn--active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Material Selector */}
            <div className="option-section">
              <label className="option-header">
                Material: <strong>{selectedMaterial}</strong>
              </label>
              <div className="material-pills-row">
                {MATERIALS.map((m) => (
                  <button
                    key={m}
                    className={`material-choice-btn ${selectedMaterial === m ? 'material-choice-btn--active' : ''}`}
                    onClick={() => setSelectedMaterial(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Swatches */}
            <div className="option-section">
              <label className="option-header">
                Color: <strong>{colorLabel}</strong>
              </label>
              <div className="color-swatches-grid">
                {AVAILABLE_COLORS.map((col) => {
                  const isSelected = selectedColor === col
                  const hex = GARMENT_COLORS[col]?.hex || '#ffffff'
                  return (
                    <button
                      key={col}
                      className={`color-swatch-circle ${isSelected ? 'color-swatch-circle--active' : ''}`}
                      style={{ backgroundColor: hex }}
                      title={GARMENT_COLORS[col]?.label || col}
                      onClick={() => setSelectedColor(col)}
                    >
                      {isSelected && (
                        <span
                          className="swatch-checkmark"
                          style={{ color: col === 'white' ? '#0f172a' : '#ffffff' }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Plain Item Toggle */}
            <div className="plain-item-row">
              <label className="plain-item-switch">
                <input
                  type="checkbox"
                  checked={isPlainItem}
                  onChange={(e) => setIsPlainItem(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
              <span className="plain-item-text">
                Plain item without custom print for <strong>₹324 ($12.99)</strong>
              </span>
            </div>

            {/* Feature Bullets */}
            <ul className="product-detail-bullets">
              <li>• <strong>{selectedSize} Size</strong> selected · Regular Men's Comfort Fit</li>
              <li>• The T-Shirt is made up of <strong>100% Premium Bio-Washed Combed Cotton</strong> material.</li>
            </ul>

            {/* Pricing Box */}
            <div className="pricing-box">
              <span className="deal-price">
                {isPlainItem ? '₹324' : '₹499'} <small>({isPlainItem ? '$12.99' : '$19.99'})</small>
              </span>
              <span className="regular-price">₹1,109 <small>($39.99)</small></span>
              <span className="discount-badge">Save 55%</span>
              <span className="price-info-tag" title="Includes taxes and digital print fee">ⓘ</span>
            </div>

            {/* Quantity & Add to Cart Row */}
            <div className="cart-checkout-row">
              <div className="quantity-select-wrap">
                <label htmlFor="prod-qty" className="qty-label">Qty</label>
                <select
                  id="prod-qty"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="quantity-dropdown"
                >
                  {[1, 2, 3, 4, 5, 10, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <button
                className="btn-add-cart-large"
                onClick={handleAddToCart}
              >
                <span>Add To Cart</span>
              </button>
            </div>

            {/* Bulk Pricing Tier Box */}
            <div className="bulk-save-box">
              <div className="bulk-save-title">🎉 Shop more, Save more!</div>
              <div className="bulk-tier-table">
                <div className="tier-col">
                  <span className="tier-header">Qty</span>
                  <span className="tier-val">Price</span>
                </div>
                <div className="tier-col">
                  <span className="tier-qty">1-5</span>
                  <span className="tier-price">₹499</span>
                </div>
                <div className="tier-col">
                  <span className="tier-qty">6-10</span>
                  <span className="tier-price">₹449</span>
                </div>
                <div className="tier-col">
                  <span className="tier-qty">11-20</span>
                  <span className="tier-price">₹399</span>
                </div>
                <div className="tier-col">
                  <span className="tier-qty">21+</span>
                  <span className="tier-price">₹349</span>
                </div>
              </div>
            </div>

            {/* Assurance Badges */}
            <div className="quality-bullets">
              <div className="bullet-item">✓ 100% Premium Bio-Washed Combed Cotton</div>
              <div className="bullet-item">✓ Fade-Resistant DTG High-Resolution Digital Print</div>
              <div className="bullet-item">✓ Free Express Shipping & 100% Satisfaction Guarantee</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Review Generated Mockup Modal ──────────────────────────────── */}
      {showReviewModal && (
        <div className="review-modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <div>
                <h2>Realistic Mockup Preview</h2>
                {(() => {
                  const currentConf = ANGLES.find((a) => a.key === reviewAngle)!
                  return (
                    <div className="review-modal-subtitle">
                      {currentConf.label} • Placement Area: <strong>{currentConf.dimensionsLabel}</strong>
                    </div>
                  )
                })()}
              </div>
              <button
                className="review-modal-close"
                onClick={() => setShowReviewModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Angle tabs inside preview modal */}
            <div className="review-angle-tabs">
              {ANGLES.map((a) => (
                <button
                  key={a.key}
                  className={`review-tab-btn ${reviewAngle === a.key ? 'active' : ''}`}
                  onClick={() => setReviewAngle(a.key)}
                >
                  <span className="review-tab-name">{a.shortLabel}</span>
                  <span className="review-tab-dim">{a.dimensionsLabel}</span>
                </button>
              ))}
            </div>

            {/* Clean Realistic Mockup without dashed lines or handles */}
            <div className="clean-mockup-display">
              {(() => {
                const conf = ANGLES.find((a) => a.key === reviewAngle)!
                const dSrc = isPlainItem ? null : designs[reviewAngle]
                const dScale = scales[reviewAngle]
                const dOff = offsets[reviewAngle]

                const mockSrc =
                  isDarkShirt
                    ? reviewAngle === 'back'
                      ? '/mockups/black-back.jpg?v=4'
                      : reviewAngle === 'sleeve'
                      ? '/mockups/black-sleeve.jpg?v=4'
                      : '/mockups/black-front.jpg?v=4'
                    : reviewAngle === 'sleeve'
                    ? '/mockups/white-sleeve.jpg?v=4'
                    : reviewAngle === 'back'
                    ? '/mockups/white-back.jpg?v=4'
                    : '/mockups/white-front.jpg?v=4'

                return (
                  <div className="clean-mockup-wrap">
                    <div className="clean-mockup-badge">
                      <span>{conf.shortLabel}</span>
                      <span className="clean-mockup-badge-size">{conf.dimensionsLabel}</span>
                    </div>
                    <img
                      src={mockSrc}
                      alt={`Clean realistic mockup ${conf.label}`}
                      className="clean-mockup-tshirt"
                    />
                    {dSrc && (
                      <div
                        className="clean-mockup-art-zone"
                        style={{
                          top: conf.printAreaStyle.top,
                          left: conf.printAreaStyle.left,
                          width: conf.printAreaStyle.width,
                          height: conf.printAreaStyle.height,
                        }}
                      >
                        <img
                          src={dSrc}
                          alt="Printed artwork"
                          className="clean-mockup-art-img"
                          style={{
                            transform: `translate(${dOff.x}px, ${dOff.y}px) scale(${dScale / 100})`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            <div className="review-modal-actions">
              <button
                className="btn-modal-add-cart"
                onClick={() => {
                  setShowReviewModal(false)
                  handleAddToCart()
                }}
              >
                Looks Great! Add to cart →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
