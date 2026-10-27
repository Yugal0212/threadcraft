import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { CartItem } from '../core'

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'cartId'>) => void
  removeItem: (cartId: string) => void
  updateQuantity: (cartId: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
})

const STORAGE_KEY = 'threadcraft_cart'

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore quota errors
  }
}

function generateId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadFromStorage)

  useEffect(() => {
    saveToStorage(items)
  }, [items])

  const addItem = useCallback((item: Omit<CartItem, 'cartId'>) => {
    const newItem: CartItem = { ...item, cartId: generateId() }
    setItems((prev) => [...prev, newItem])
  }, [])

  const removeItem = useCallback((cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId))
  }, [])

  const updateQuantity = useCallback((cartId: string, qty: number) => {
    if (qty < 1) return
    setItems((prev) =>
      prev.map((i) => (i.cartId === cartId ? { ...i, quantity: qty } : i)),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  return useContext(CartContext)
}
