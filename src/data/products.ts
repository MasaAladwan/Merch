import type { Product } from '../lib/types'

// Stand-in GLBs from public sources so the demo runs with no assets of its own.
// Replace with real product models: put the file in /public/models and set
//   modelUrl: '/models/hoodie.glb', placeholder: false
// The shirt model comes from a public tutorial repo; check its licence before any real use.
const KH = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models'
const SHIRT =
  'https://raw.githubusercontent.com/adrianhajdin/project_threejs_ai/main/client/public/shirt_baked.glb'

export const products: Product[] = [
  {
    id: 'hoodie-core',
    name: 'Essentials Hoodie',
    tagline: 'Heavyweight cotton, built for layering',
    category: 'apparel',
    price: 89,
    modelUrl: SHIRT,
    colors: [
      { name: 'Bone', hex: '#f1ece2' },
      { name: 'Jet', hex: '#1b1b1b' },
      { name: 'Olive', hex: '#5b6330' },
      { name: 'Oxide', hex: '#ff5a1f' },
    ],
    customizable: true,
    sizeMeters: 0.72,
    placeholder: true,
  },
  {
    id: 'tee-classic',
    name: 'Classic Tee',
    tagline: 'Our 220gsm everyday essential',
    category: 'apparel',
    price: 34,
    modelUrl: SHIRT,
    colors: [
      { name: 'White', hex: '#ffffff' },
      { name: 'Jet', hex: '#1b1b1b' },
      { name: 'Oxide', hex: '#ff5a1f' },
    ],
    customizable: true,
    sizeMeters: 0.72,
    placeholder: false,
  },
  {
    id: 'bottle-24',
    name: 'Reusable Bottle 24oz',
    tagline: 'Vacuum-insulated stainless steel',
    category: 'drinkware',
    price: 42,
    modelUrl: `${KH}/WaterBottle/glTF-Binary/WaterBottle.glb`,
    colors: [
      { name: 'Natural', hex: '#ffffff' },
      { name: 'Sand', hex: '#d9c9a8' },
      { name: 'Oxide', hex: '#ff5a1f' },
    ],
    customizable: true,
    sizeMeters: 0.26,
    placeholder: false,
  },
  {
    id: 'mug-std',
    name: 'Studio Mug',
    tagline: '12oz stoneware, wheel-thrown finish',
    category: 'drinkware',
    price: 24,
    modelUrl: `${KH}/Avocado/glTF-Binary/Avocado.glb`,
    colors: [
      { name: 'Natural', hex: '#ffffff' },
      { name: 'Clay', hex: '#b08161' },
    ],
    customizable: false,
    sizeMeters: 0.1,
    placeholder: true,
  },
  {
    id: 'powerbank-10k',
    name: 'Powerbank 10 000mAh',
    tagline: 'USB-C PD 20W, machined aluminium',
    category: 'tech',
    price: 59,
    modelUrl: `${KH}/BoomBox/glTF-Binary/BoomBox.glb`,
    colors: [
      { name: 'Natural', hex: '#ffffff' },
      { name: 'Smoke', hex: '#8a8a8a' },
    ],
    customizable: false,
    sizeMeters: 0.15,
    placeholder: true,
  },
  {
    id: 'tote-canvas',
    name: 'Canvas Tote',
    tagline: '14oz heavy-duck natural canvas',
    category: 'bags',
    price: 28,
    modelUrl: `${KH}/Duck/glTF-Binary/Duck.glb`,
    colors: [
      { name: 'Natural', hex: '#ffffff' },
      { name: 'Sand', hex: '#e9ddc3' },
    ],
    customizable: true,
    sizeMeters: 0.4,
    placeholder: true,
  },
  {
    id: 'pen-brass',
    name: 'Brass Rollerball',
    tagline: 'Solid brass, develops a natural patina',
    category: 'stationery',
    price: 38,
    modelUrl: `${KH}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`,
    colors: [
      { name: 'Natural', hex: '#ffffff' },
      { name: 'Brass', hex: '#b58f3e' },
    ],
    customizable: false,
    sizeMeters: 0.14,
    placeholder: true,
  },
]

export function getProduct(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export const categories: { id: 'all' | Product['category']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'apparel', label: 'Apparel' },
  { id: 'drinkware', label: 'Drinkware' },
  { id: 'tech', label: 'Tech' },
  { id: 'bags', label: 'Bags' },
  { id: 'stationery', label: 'Stationery' },
]
