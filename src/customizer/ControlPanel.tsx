import { useRef, useState } from 'react'
import { useDesignStore } from '../lib/store'
import { ACCEPTED_IMAGE_TYPES, fileToDataUrl } from '../lib/image'
import type { Product } from '../lib/types'

interface Props {
  product: Product
  pendingImageUrl: string | null
  onPendingImage: (url: string | null) => void
  onSave: () => void
  onExport: () => void
}

export default function ControlPanel({
  product,
  pendingImageUrl,
  onPendingImage,
  onSave,
  onExport,
}: Props) {
  const uploadRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const color = useDesignStore(s => s.colorHex)
  const setColor = useDesignStore(s => s.setColor)
  const decals = useDesignStore(s => s.decals)
  const selectedId = useDesignStore(s => s.selectedDecalId)
  const selectDecal = useDesignStore(s => s.selectDecal)
  const updateDecal = useDesignStore(s => s.updateDecal)
  const removeDecal = useDesignStore(s => s.removeDecal)
  const reset = useDesignStore(s => s.reset)

  const selected = decals.find(d => d.id === selectedId) ?? null

  async function readImage(input: HTMLInputElement): Promise<string | null> {
    const file = input.files?.[0]
    input.value = ''
    if (!file) return null
    try {
      setError(null)
      return await fileToDataUrl(file)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.')
      return null
    }
  }

  return (
    <aside className="w-full lg:w-[360px] lg:min-w-[360px] bg-white rounded-3xl premium-shadow p-6 space-y-6 lg:overflow-y-auto">
      <section>
        <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">{product.name}</div>
        <h1 className="text-2xl font-bold tracking-tight">Customize</h1>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-widest text-ink/50 mb-3">Base colour</h3>
        <div className="flex gap-2 flex-wrap">
          {product.colors.map(c => {
            const active = color.toLowerCase() === c.hex.toLowerCase()
            return (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                title={c.name}
                aria-label={c.name}
                className={`w-9 h-9 rounded-full border-2 transition-transform ${
                  active ? 'border-ink scale-110' : 'border-ink/10 hover:scale-105'
                }`}
                style={{ background: c.hex }}
              />
            )
          })}
          <label
            title="Custom colour"
            className="w-9 h-9 rounded-full border-2 border-dashed border-ink/25 cursor-pointer relative flex items-center justify-center text-ink/50 hover:border-ink/50"
          >
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            +
          </label>
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-widest text-ink/50 mb-3">Your artwork</h3>
        <input
          ref={uploadRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={async e => {
            const url = await readImage(e.currentTarget)
            if (url) {
              selectDecal(null)
              onPendingImage(url)
            }
          }}
        />
        <input
          ref={replaceRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={async e => {
            const url = await readImage(e.currentTarget)
            if (url && selected) updateDecal(selected.id, { imageUrl: url })
          }}
        />
        <button
          onClick={() => uploadRef.current?.click()}
          className="w-full px-4 py-3.5 bg-ink text-canvas rounded-xl text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          Upload image
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        {pendingImageUrl && (
          <div className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/40 flex items-center gap-3">
            <img
              src={pendingImageUrl}
              alt=""
              className="w-10 h-10 object-contain rounded-md border border-ink/10 bg-white"
            />
            <div className="flex-1 text-xs font-medium">Click the product to place it</div>
            <button
              onClick={() => onPendingImage(null)}
              className="text-ink/50 hover:text-ink text-xs"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {decals.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-widest text-ink/50 mb-3">
            Designs on product ({decals.length})
          </h3>
          <div className="space-y-2">
            {decals.map((d, i) => {
              const active = selectedId === d.id
              return (
                <div
                  key={d.id}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                    active ? 'border-accent bg-accent/5' : 'border-ink/10'
                  }`}
                >
                  <img
                    src={d.imageUrl}
                    alt=""
                    className="w-9 h-9 object-contain rounded-md border border-ink/10 bg-white"
                  />
                  <button
                    onClick={() => selectDecal(active ? null : d.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-medium">Design {i + 1}</div>
                    <div className="text-[10px] text-ink/50 capitalize">{d.zone}</div>
                  </button>
                  <button
                    onClick={() => removeDecal(d.id)}
                    className="text-xs text-ink/40 hover:text-accent px-1"
                    aria-label={`Delete design ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {selected && (
        <section className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest text-ink/50">Selected design</h3>
          <p className="text-[11px] text-ink/50">Click anywhere on the product to move it there.</p>
          <Slider
            label="Size"
            min={0.08}
            max={1.2}
            value={selected.scale}
            onChange={v => updateDecal(selected.id, { scale: v })}
            format={v => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="Rotation"
            min={-Math.PI}
            max={Math.PI}
            value={selected.rotation}
            onChange={v => updateDecal(selected.id, { rotation: v })}
            format={v => `${Math.round((v * 180) / Math.PI)}°`}
          />
          <button
            onClick={() => replaceRef.current?.click()}
            className="w-full px-4 py-2.5 rounded-xl text-xs border border-ink/15 text-ink/70 hover:text-ink hover:border-ink/40"
          >
            Replace image
          </button>
        </section>
      )}

      <section className="pt-4 border-t border-ink/5 space-y-2">
        <button
          onClick={onSave}
          className="w-full px-4 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Save design
        </button>
        <button
          onClick={onExport}
          className="w-full px-4 py-2.5 rounded-xl text-xs border border-ink/15 text-ink/70 hover:text-ink hover:border-ink/40"
        >
          Export preview + design file
        </button>
        <button
          onClick={() => {
            if (confirm('Remove all designs from this product?')) reset()
          }}
          disabled={decals.length === 0}
          className="w-full px-4 py-2.5 rounded-xl text-xs text-ink/50 hover:text-ink disabled:opacity-40"
        >
          Reset
        </button>
      </section>
    </aside>
  )
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  format,
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-widest text-ink/50">{label}</span>
        <span className="text-xs text-ink/60 tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  )
}
