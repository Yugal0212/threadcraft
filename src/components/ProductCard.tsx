import { useState, useMemo } from 'react'
import type { ProductData } from '../data/products'
import type { GarmentColor } from '../core'
import { GARMENT_COLORS, getGarmentDataUrl } from '../core'
import { useRouter } from '../router'

interface ProductCardProps {
  product: ProductData
}

export function ProductCard({ product }: ProductCardProps) {
  const { navigate } = useRouter()
  const defaultColor = product.colors[0] ?? 'white'
  const [hoveredColor, setHoveredColor] = useState<GarmentColor>(defaultColor)

  const garmentSrc = useMemo(() => {
    if (hoveredColor === 'black' || product.id.includes('black')) {
      return '/mockups/black-front.jpg'
    }
    if (hoveredColor === 'white' || product.mockupImages?.front) {
      return '/mockups/white-front.jpg'
    }
    return getGarmentDataUrl(GARMENT_COLORS[hoveredColor]?.hex || '#ffffff', 'front')
  }, [hoveredColor, product])

  const handleCardClick = () => {
    navigate(`/product/${product.id}`)
  }

  return (
    <article className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      {product.badge && (
        <span className="product-card__badge">{product.badge}</span>
      )}

      {/* Garment preview — clickable */}
      <div className="product-card__image-btn">
        <div className="product-card__image-wrap">
          <img
            src={garmentSrc}
            alt={`${product.name} in ${GARMENT_COLORS[hoveredColor]?.label || 'White'}`}
            className="product-card__image"
            loading="lazy"
          />
          <div className="product-card__overlay">
            <span>Customize Now ✦</span>
          </div>
        </div>
      </div>

      <div className="product-card__body">
        {/* Category + fit */}
        <div className="product-card__meta">
          <span>{product.category}</span>
          <span className="product-card__dot">·</span>
          <span>{product.fit}</span>
        </div>

        {/* Name */}
        <h3 className="product-card__name">{product.name}</h3>

        {/* Price in rupees & dollars */}
        <div className="product-card__price-row">
          <span className="product-card__price">
            ₹{Math.round(product.price * 25)} (${product.price.toFixed(2)})
          </span>
          {product.originalPrice && (
            <span className="product-card__original-price">
              ₹{Math.round(product.originalPrice * 25)} (${product.originalPrice.toFixed(2)})
            </span>
          )}
          <span className="product-card__save-tag">55% OFF</span>
        </div>

        {/* Color swatches */}
        <div className="product-card__colors" aria-label="Available colors" onClick={(e) => e.stopPropagation()}>
          {product.colors.slice(0, 7).map((color) => (
            <button
              key={color}
              className={`color-swatch ${hoveredColor === color ? 'color-swatch--active' : ''}`}
              style={{ '--swatch-color': GARMENT_COLORS[color]?.hex || '#000' } as React.CSSProperties}
              aria-label={`Select ${GARMENT_COLORS[color]?.label || color}`}
              title={GARMENT_COLORS[color]?.label || color}
              onMouseEnter={() => setHoveredColor(color)}
              onClick={() => setHoveredColor(color)}
            />
          ))}
          {product.colors.length > 7 && (
            <span className="product-card__more-colors">+{product.colors.length - 7}</span>
          )}
        </div>

        {/* CTA */}
        <button
          className="btn btn--cta btn--full"
          onClick={(e) => {
            e.stopPropagation()
            handleCardClick()
          }}
          style={{ marginTop: '12px' }}
        >
          <span>Select Photo & Customize</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </article>
  )
}
