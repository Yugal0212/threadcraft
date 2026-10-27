import { Router, useRouter } from './router'
import { CartProvider } from './context/CartContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ShopPage } from './pages/ShopPage'
import { ProductDetailPage } from './pages/ProductDetailPage'

function Routes() {
  const { path } = useRouter()

  // Studio page gets its own full-screen layout (no footer)
  if (path.startsWith('/studio/')) {
    return (
      <>
        <Header />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="site-content">
        {(path === '/' || path === '/shop') && <ShopPage />}
        {path.startsWith('/product/') && <ProductDetailPage />}
        {!['/', '/shop', '/cart', '/how-it-works'].includes(path) &&
          !path.startsWith('/product/') && (
            <div className="page error-page">
              <h1>Page not found</h1>
              <button
                className="btn btn--primary"
                onClick={() => (window.location.hash = '/shop')}
              >
                Back to All Products
              </button>
            </div>
          )}
      </div>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Router>
      <CartProvider>
        <Routes />
      </CartProvider>
    </Router>
  )
}
