import { useCart } from '../context/CartContext'
import { useRouter } from '../router'
import { GARMENT_COLORS, PRINT_POSITION_LABELS } from '../core'

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart()
  const { navigate } = useRouter()

  if (items.length === 0) {
    return (
      <div className="page cart-page">
        <div className="cart-empty">
          <div className="cart-empty__icon" aria-hidden="true">🛒</div>
          <h1 className="cart-empty__title">Your cart is empty</h1>
          <p className="cart-empty__body">
            Add some custom t-shirts to get started.
          </p>
          <button className="btn btn--cta btn--lg" onClick={() => navigate('/shop')}>
            Browse Collection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page cart-page">
      <div className="cart-header">
        <h1 className="cart-header__title">
          Your Cart
          <span className="cart-header__count">({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
        </h1>
        <button className="btn btn--ghost btn--sm" onClick={clearCart}>
          Clear Cart
        </button>
      </div>

      <div className="cart-layout">
        {/* ─── Cart items ─────────────────────────────────────────── */}
        <div className="cart-items">
          {items.map((item) => (
            <article key={item.cartId} className="cart-item">
              {/* Preview thumbnail */}
              <div className="cart-item__thumb">
                {item.previewDataUrl ? (
                  <img
                    src={item.previewDataUrl}
                    alt={`${item.productName} customized preview`}
                    className="cart-item__thumb-img"
                  />
                ) : (
                  <div
                    className="cart-item__thumb-placeholder"
                    style={{ background: item.colorHex }}
                    aria-label="No preview available"
                  />
                )}
              </div>

              {/* Details */}
              <div className="cart-item__details">
                <h2 className="cart-item__name">{item.productName}</h2>
                <dl className="cart-item__specs">
                  <div className="cart-item__spec">
                    <dt>Color</dt>
                    <dd>
                      <span
                        className="summary-swatch"
                        style={{ background: item.colorHex }}
                      />
                      {GARMENT_COLORS[item.color].label}
                    </dd>
                  </div>
                  <div className="cart-item__spec">
                    <dt>Size</dt>
                    <dd>{item.size}</dd>
                  </div>
                  <div className="cart-item__spec">
                    <dt>Print</dt>
                    <dd>{PRINT_POSITION_LABELS[item.printPosition]}</dd>
                  </div>
                </dl>
              </div>

              {/* Quantity + price */}
              <div className="cart-item__actions">
                <div className="qty-selector qty-selector--sm">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                  >−</button>
                  <span className="qty-value" aria-live="polite">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >+</button>
                </div>

                <span className="cart-item__price">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>

                <button
                  className="cart-item__remove"
                  onClick={() => removeItem(item.cartId)}
                  aria-label={`Remove ${item.productName} from cart`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* ─── Order summary sidebar ──────────────────────────────── */}
        <aside className="cart-summary" aria-label="Order total">
          <h2 className="cart-summary__title">Order Summary</h2>

          <div className="cart-summary__line">
            <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="cart-summary__line">
            <span>Shipping</span>
            <span className="cart-summary__free">Free</span>
          </div>
          <div className="cart-summary__divider" />
          <div className="cart-summary__total">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <button
            className="btn btn--cta btn--full btn--lg"
            onClick={() => alert('Checkout integration coming soon.\nThis is a local demonstration.')}
          >
            Proceed to Checkout
          </button>

          <button
            className="btn btn--ghost btn--full"
            onClick={() => navigate('/shop')}
          >
            Continue Shopping
          </button>

          <p className="cart-summary__note">
            ⓘ No payment is processed here. This is a design preview demonstration.
          </p>
        </aside>
      </div>
    </div>
  )
}
