import { useMemo, useState } from 'react'
import { products, categories } from '../data/products'
import type { Product } from '../lib/types'
import ProductCard from '../components/ProductCard'

export default function Showroom() {
  const [cat, setCat] = useState<string>('all')
  const [q, setQ] = useState('')

  const filtered = useMemo<Product[]>(() => {
    const term = q.trim().toLowerCase()
    return products.filter(p => {
      if (cat !== 'all' && p.category !== cat) return false
      if (term && !`${p.name} ${p.tagline}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [cat, q])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <section className="py-14 sm:py-20">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.02]">
          Merchandise,<br />in three dimensions.
        </h1>
        <p className="mt-5 max-w-xl text-ink/60 text-base sm:text-lg">
          Browse the collection, rotate anything, preview it in your space with AR,
          and drop your own artwork on apparel.
        </p>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-6 px-6">
          {categories.map(c => {
            const active = cat === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`text-xs uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${
                  active
                    ? 'bg-ink text-canvas border-ink'
                    : 'bg-transparent text-ink/60 border-ink/15 hover:border-ink/40'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
        <div className="relative sm:w-64">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search merch…"
            className="w-full px-4 py-2.5 rounded-full border border-ink/15 bg-white/70 text-sm focus:outline-none focus:border-ink/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-ink/40 text-sm">No items match.</div>
      )}
    </div>
  )
}
