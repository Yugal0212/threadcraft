import type { GarmentColor, GarmentView, PrintPosition } from '../core'

export interface ProductData {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  fit: string
  material: string
  sizes: string[]
  colors: GarmentColor[]
  price: number
  originalPrice?: number
  supportedPositions: PrintPosition[]
  supportedViews: GarmentView[]
  features: string[]
  badge?: string
  mockupImages?: {
    front?: string
    back?: string
  }
}

export const ALL_COLORS: GarmentColor[] = [
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
  'lime',
  'charcoal',
  'lavender',
  'sage',
  'sky-blue',
  'pink',
  'peach',
  'teal',
]

export const ALL_SIZES = [
  'Small',
  'Medium',
  'Large',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  '6XL',
  '7XL',
]

export const PRODUCTS: ProductData[] = [
  {
    id: 'customized-half-sleeve-tee',
    name: "Customized Half Sleeve Men's Cotton T-Shirt",
    tagline: 'Personalized photo & logo print with premium 100% bio-washed cotton',
    description:
      'The ultimate personalized t-shirt. Upload your photo, personal design, company logo or artwork. Printed with state-of-the-art DTG digital technology for vivid colors that never crack or wash out.',
    category: "Men's Half Sleeve",
    fit: 'Comfort Regular Fit',
    material: '100% Premium Cotton',
    sizes: ALL_SIZES,
    colors: ALL_COLORS,
    price: 19.99,
    originalPrice: 39.99,
    supportedPositions: [
      'front-center',
      'front-left-chest',
      'front-right-chest',
      'back-center',
      'sleeves-left',
    ],
    supportedViews: ['front', 'back', 'sleeves'],
    features: [
      'The T-Shirt is made up of Premium Cotton material.',
      '180-220 GSM high-density breathable combed fabric.',
      'Fade-resistant high-definition digital printing.',
      'Reinforced crew neckline & double-stitched hem.',
      'Pre-shrunk fabric ensuring true-to-size wash after wash.',
    ],
    badge: 'Save 55%',
    mockupImages: {
      front: '/mockups/white-front.jpg',
      back: '/mockups/white-back.jpg',
    },
  },
  {
    id: 'black-customized-cotton-tee',
    name: "Black Customized Half Sleeve Men's Cotton T-Shirt",
    tagline: 'Deep jet-black canvas engineered for striking high-contrast prints',
    description:
      'Our signature black crewneck t-shirt. Deep black reactive dye prevents fading while our white underbase printing makes your artwork and photos pop with high vibrance.',
    category: "Men's Half Sleeve",
    fit: 'Regular Fit',
    material: '100% Combed Cotton',
    sizes: ALL_SIZES,
    colors: ALL_COLORS,
    price: 19.99,
    originalPrice: 39.99,
    supportedPositions: [
      'front-center',
      'front-left-chest',
      'front-right-chest',
      'back-center',
      'sleeves-left',
    ],
    supportedViews: ['front', 'back', 'sleeves'],
    features: [
      'The T-Shirt is made up of Premium Cotton material.',
      'Deep jet-black reactive dyed cotton.',
      'High-contrast underbase digital print technology.',
      'Shoulder-to-shoulder reinforced taping.',
      'Ultra-soft touch and lint-free surface.',
    ],
    badge: 'Popular',
    mockupImages: {
      front: '/mockups/black-front.jpg',
      back: '/mockups/black-back.jpg',
    },
  },
  {
    id: 'oversized-streetwear-tee',
    name: 'Custom Heavyweight Oversized Tee',
    tagline: '240 GSM drop-shoulder boxy streetwear silhouette',
    description:
      'Heavyweight 240 GSM combed cotton with dropped shoulders and relaxed modern boxy cut. Made for oversized chest statements and streetwear fashion.',
    category: 'Oversized',
    fit: 'Oversized Boxy Fit',
    material: 'Heavyweight Cotton • 240gsm',
    sizes: ['Small', 'Medium', 'Large', 'XL', '2XL', '3XL'],
    colors: ['white', 'black', 'charcoal', 'navy', 'sage', 'beige'],
    price: 24.99,
    originalPrice: 49.99,
    supportedPositions: ['front-center', 'front-left-chest', 'back-center'],
    supportedViews: ['front', 'back'],
    features: [
      'Heavyweight 240 GSM luxury cotton',
      'Drop-shoulder relaxed street fit',
      'Thick 1-inch ribbed collar',
      'Double-needle stitching throughout',
    ],
    badge: 'Trending',
    mockupImages: {
      front: '/mockups/white-front.jpg',
      back: '/mockups/white-back.jpg',
    },
  },
  {
    id: 'classic-white-crew',
    name: 'Minimalist White Crew-Neck Tee',
    tagline: 'Clean white canvas for photographs and vibrant logos',
    description:
      'Bright optical white 100% combed cotton. The most popular choice for family photos, custom company logos, and gift t-shirts.',
    category: 'Crew Neck',
    fit: 'Regular Fit',
    material: '100% Organic Cotton • 190gsm',
    sizes: ALL_SIZES,
    colors: ALL_COLORS,
    price: 19.99,
    originalPrice: 39.99,
    supportedPositions: [
      'front-center',
      'front-left-chest',
      'front-right-chest',
      'back-center',
    ],
    supportedViews: ['front', 'back'],
    features: [
      'Optical white bio-washed cotton',
      'True-to-color photographic reproduction',
      'Ribbed neckline with shape retention',
      'Eco-friendly water-based inks',
    ],
    badge: 'Best Seller',
    mockupImages: {
      front: '/mockups/white-front.jpg',
      back: '/mockups/white-back.jpg',
    },
  },
]

export function getProduct(id: string): ProductData | undefined {
  return (
    PRODUCTS.find((p) => p.id === id) ||
    // Fallback so old links still resolve smoothly
    PRODUCTS[0]
  )
}
