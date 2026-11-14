import { Link, useNavigate } from 'react-router-dom'
import { getProduct } from '../data/products'
import { useDesignStore } from '../lib/store'

export default function Saved() {
  const navigate = useNavigate()
  const designs = useDesignStore(s => s.savedDesigns)
  const loadDesign = useDesignStore(s => s.loadDesign)
  const deleteDesign = useDesignStore(s => s.deleteDesign)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-extrabold tracking-tight">Saved designs</h1>
      <p className="mt-2 text-sm text-ink/55">Stored in this browser only.</p>

      {designs.length === 0 ? (
        <div className="py-24 text-center text-ink/50 text-sm">
          Nothing saved yet.{' '}
          <Link to="/" className="underline">Pick a product to customize</Link>.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {designs.map(d => {
            const product = getProduct(d.productId)
            return (
              <div key={d.id} className="bg-white rounded-2xl premium-shadow overflow-hidden">
                <div className="aspect-square bg-canvas">
                  {d.thumbnail && (
                    <img src={d.thumbnail} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <div className="font-semibold text-sm">{product?.name ?? 'Removed product'}</div>
                  <div className="text-[11px] text-ink/50 mt-0.5">
                    {d.decals.length} design{d.decals.length === 1 ? '' : 's'} ·{' '}
                    {new Date(d.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={!product}
                      onClick={() => {
                        loadDesign(d.id)
                        navigate(`/customize/${d.productId}`)
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-ink text-canvas text-xs font-medium disabled:opacity-40"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this saved design?')) deleteDesign(d.id)
                      }}
                      className="px-3 py-2 rounded-lg border border-ink/15 text-xs text-ink/60 hover:text-ink"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
