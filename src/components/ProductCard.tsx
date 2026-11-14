import { Link } from 'react-router-dom'
import type { Product } from '../lib/types'

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block rounded-2xl bg-white premium-shadow overflow-hidden transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-[4/5] bg-gradient-to-br from-canvas to-white relative">
        {/* Lightweight preview — the full model-viewer only mounts on the detail page.
            We reveal on interaction and show the poster/color chip for the grid. */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `radial-gradient(ellipse at center, ${product.colors[0].hex}22 0%, transparent 70%)`,
          }}
        >
          <div
            className="w-40 h-40 rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${product.colors[0].hex}, ${product.colors[0].hex}88)`,
              filter: 'blur(1px)',
            }}
          />
        </div>
        <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-ink/50">
          {product.category}
        </div>
        {product.customizable && (
          <div className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-accent">
            Customizable
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-ink leading-tight">{product.name}</h3>
            <p className="text-xs text-ink/55 mt-1">{product.tagline}</p>
          </div>
          <div className="text-sm font-medium">${product.price}</div>
        </div>
        <div className="mt-4 flex gap-1.5">
          {product.colors.map(c => (
            <span
              key={c.hex}
              title={c.name}
              className="w-3.5 h-3.5 rounded-full border border-ink/10"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>
    </Link>
  )
}
