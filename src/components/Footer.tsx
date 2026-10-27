import { Link } from '../router'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-brand">
          <Link to="/" className="site-header__brand">
            <span className="brand-mark">✦</span>
            <span className="brand-name">ThreadCraft</span>
          </Link>
          <p className="footer-brand__tagline">
            Premium custom apparel, designed by you.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-links__col">
            <h4>Shop</h4>
            <Link to="/shop" className="footer-link">All T-Shirts</Link>
            <Link to="/" className="footer-link">New Arrivals</Link>
            <Link to="/" className="footer-link">Best Sellers</Link>
          </div>
          <div className="footer-links__col">
            <h4>Help</h4>
            <Link to="/how-it-works" className="footer-link">How It Works</Link>
            <Link to="/" className="footer-link">Sizing Guide</Link>
            <Link to="/" className="footer-link">Shipping Info</Link>
          </div>
          <div className="footer-links__col">
            <h4>Company</h4>
            <Link to="/" className="footer-link">About Us</Link>
            <Link to="/" className="footer-link">Contact</Link>
            <Link to="/" className="footer-link">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {new Date().getFullYear()} ThreadCraft. All rights reserved.</p>
        <p className="footer-legal">
          All designs are printed on demand. Product images are rendered previews.
        </p>
      </div>
    </footer>
  )
}
