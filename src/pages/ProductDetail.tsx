import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct } from '../data/products'
import ModelViewer from '../components/ModelViewer'

export default function ProductDetail() {
  const { id } = useParams()
  const product = id ? getProduct(id) : undefined
  const [colorIdx, setColorIdx] = useState(0)
  const [arAvailable, setArAvailable] = useState<boolean | null>(null)
  const onArAvailability = useCallback((ok: boolean) => setArAvailable(ok), [])

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-ink/60">Product not found.</p>
        <Link to="/" className="mt-6 inline-block text-sm underline">Back to showroom</Link>
      </div>
    )
  }

  const color = product.colors[colorIdx]

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Link to="/" className="text-xs uppercase tracking-widest text-ink/50 hover:text-ink">
        ← Showroom
      </Link>

      <div className="grid lg:grid-cols-5 gap-10 mt-6">
        <div className="lg:col-span-3">
          <div
            className="aspect-[4/5] max-h-[78vh] w-full rounded-3xl overflow-hidden premium-shadow relative transition-colors duration-500"
            style={{
              background: `radial-gradient(ellipse at 50% 20%, ${color.hex}26 0%, #e4e1da 70%)`,
            }}
          >
            <ModelViewer
              key={product.id}
              src={product.modelUrl}
              iosSrc={product.iosModelUrl}
              alt={product.name}
              tint={color.hex}
              onArAvailability={onArAvailability}
            />
            <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-ink/50 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full pointer-events-none">
              Drag to rotate · Pinch or scroll to zoom
            </div>
            {product.placeholder && (
              <div className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-ink/50 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full pointer-events-none">
                Placeholder model
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="text-[10px] uppercase tracking-widest text-ink/50">
            {product.category}
          </div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{product.name}</h1>
          <p className="mt-3 text-ink/60">{product.tagline}</p>

          <div className="mt-6 text-2xl font-semibold">${product.price}</div>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-widest text-ink/50 mb-3">
              Colour — {color.name}
            </div>
            <div className="flex gap-2">
              {product.colors.map((c, i) => (
                <button
                  key={c.hex}
                  onClick={() => setColorIdx(i)}
                  className={`w-9 h-9 rounded-full border-2 transition-transform ${
                    i === colorIdx ? 'border-ink scale-110' : 'border-ink/10 hover:scale-105'
                  }`}
                  style={{ background: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {product.customizable && (
            <Link
              to={`/customize/${product.id}`}
              className="mt-8 flex items-center justify-center bg-accent text-white rounded-full px-6 py-3.5 text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Customize with your artwork
            </Link>
          )}

          <div className="mt-8 text-xs text-ink/55 leading-relaxed border-t border-ink/10 pt-6">
            <b className="text-ink/80">View in your space.</b>{' '}
            {arAvailable === null && 'Checking whether this device supports AR…'}
            {arAvailable === true &&
              'Tap the button on the model. Your camera is only used on-device to place the product.'}
            {arAvailable === false &&
              'AR is not available in this browser. Open this page on an iPhone (Safari) or an ARCore Android phone (Chrome) and a "View in your space" button appears on the model.'}
          </div>
        </div>
      </div>
    </div>
  )
}
