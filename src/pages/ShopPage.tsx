import { PRODUCTS } from '../data/products'
import { ProductCard } from '../components/ProductCard'

export function ShopPage() {
  return (
    <div className="page shop-page">
      <div className="shop-hero">
        <h1 className="shop-hero__title">All T-Shirts</h1>
        <p className="shop-hero__body">
          Choose a style, pick your color, upload your design, and make it yours.
        </p>
      </div>

      <div className="product-grid product-grid--wide">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
