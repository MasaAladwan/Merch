export type ProductCategory =
  | 'apparel'
  | 'drinkware'
  | 'tech'
  | 'bags'
  | 'stationery'

export interface ColorOption {
  name: string
  hex: string
}

export interface Product {
  id: string
  name: string
  tagline: string
  category: ProductCategory
  price: number
  /** GLB url: a file under /public/models or a CORS-enabled remote url. */
  modelUrl: string
  /** Optional .usdz for iOS Quick Look; model-viewer generates one when absent. */
  iosModelUrl?: string
  colors: ColorOption[]
  customizable: boolean
  /** Largest real-world dimension in metres, used to scale the customized AR export. */
  sizeMeters: number
  /** True while the GLB is a stand-in rather than the real product model. */
  placeholder: boolean
}

export type Zone = 'front' | 'back' | 'sleeve'

export interface Decal {
  id: string
  /** Data URL of the (downscaled) uploaded artwork, so saved designs survive reloads. */
  imageUrl: string
  zone: Zone
  /** Position on the garment, in the customizer's normalized model space. */
  position: [number, number, number]
  /** Spin around the surface normal, radians. */
  rotation: number
  /** Edge length of the square print area, in normalized model units. */
  scale: number
}

export interface SavedDesign {
  id: string
  productId: string
  colorHex: string
  decals: Decal[]
  createdAt: number
  thumbnail?: string
}
