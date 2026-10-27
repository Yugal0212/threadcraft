import { useState } from 'react'
import { Link, useRouter } from '../router'
import { useCart } from '../context/CartContext'

export function Header() {
  const { path } = useRouter()
  const { totalItems, navigate } = { ...useRouter(), ...useCart() }
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) =>
    path === href ? 'nav-link nav-link--active' : 'nav-link'

  return (
    <header className="site-header">
      <div className="site-header__inner">
        {/* Brand */}
        <Link to="/shop" className="site-header__brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">✦</span>
          <span className="brand-name">ThreadCraft</span>
        </Link>

        {/* Desktop nav — hidden on product customization page */}
        {!path.startsWith('/product/') && (
          <nav className="site-header__nav" aria-label="Main navigation">
            <Link to="/shop" className={isActive('/shop')}>All Products</Link>
            <Link to="/how-it-works" className="nav-link">How It Works</Link>
          </nav>
        )}

        {/* Actions */}
        <div className="site-header__actions">
          <button
            className="cart-btn"
            aria-label={`Cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
            onClick={() => navigate('/cart')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalItems > 0 && (
              <span className="cart-btn__badge">{totalItems}</span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            className="hamburger-btn"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="7" x2="21" y2="7"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="17" x2="21" y2="17"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <Link to="/shop" className="mobile-nav__link" onClick={() => setMenuOpen(false)}>All Products</Link>
          <Link to="/how-it-works" className="mobile-nav__link" onClick={() => setMenuOpen(false)}>How It Works</Link>
          <Link to="/cart" className="mobile-nav__link mobile-nav__link--cart" onClick={() => setMenuOpen(false)}>
            Cart {totalItems > 0 && `(${totalItems})`}
          </Link>
        </nav>
      )}
    </header>
  )
}
