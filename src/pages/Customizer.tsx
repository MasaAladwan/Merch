import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type * as THREE from 'three'
import { getProduct } from '../data/products'
import { useDesignStore } from '../lib/store'
import { downloadJson, downloadUrl } from '../lib/download'
import type { Product } from '../lib/types'
import CustomizerScene, { MODEL_SIZE, type View } from '../customizer/CustomizerScene'
import ControlPanel from '../customizer/ControlPanel'

// model-viewer and the GLB exporter are only fetched when the user asks for AR.
const ArPreview = lazy(() => import('../customizer/ArPreview'))
// The pose-tracking library is only fetched when the webcam try-on is opened.
const TryOnMirror = lazy(() => import('../customizer/TryOnMirror'))

const VIEWS: { id: View; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left sleeve' },
  { id: 'right', label: 'Right sleeve' },
]

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Customizer() {
  const { id } = useParams()
  const product = id ? getProduct(id) : undefined

  if (!product || !product.customizable) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-ink/60">This product can't be customized.</p>
        <Link to="/" className="mt-6 inline-block text-sm underline">Back to showroom</Link>
      </div>
    )
  }
  if (!webglSupported()) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center text-ink/60">
        The customizer needs WebGL, which this browser or device doesn't provide.
      </div>
    )
  }
  return <Studio key={product.id} product={product} />
}

function Studio({ product }: { product: Product }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<{ id: View }>({ id: 'front' })
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [arUrl, setArUrl] = useState<string | null>(null)
  const [tryOnGarment, setTryOnGarment] = useState<THREE.Object3D | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const activeProductId = useDesignStore(s => s.activeProductId)
  const setActiveProduct = useDesignStore(s => s.setActiveProduct)
  const selectDecal = useDesignStore(s => s.selectDecal)
  const saveDesign = useDesignStore(s => s.saveDesign)

  // Keep an in-progress or reopened design; start clean only when switching product.
  useEffect(() => {
    if (activeProductId !== product.id) setActiveProduct(product.id, product.colors[0].hex)
  }, [activeProductId, product, setActiveProduct])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => () => { if (arUrl) URL.revokeObjectURL(arUrl) }, [arUrl])

  /** Clears the selection highlight and waits for the canvas to redraw without it. */
  async function settle() {
    selectDecal(null)
    await new Promise(r => setTimeout(r, 120))
  }

  function snapshot(maxDim?: number, type = 'image/png'): string | undefined {
    const canvas = stageRef.current?.querySelector('canvas')
    if (!canvas) return undefined
    if (!maxDim) return canvas.toDataURL(type)
    const k = Math.min(1, maxDim / Math.max(canvas.width, canvas.height))
    const out = document.createElement('canvas')
    out.width = Math.round(canvas.width * k)
    out.height = Math.round(canvas.height * k)
    const ctx = out.getContext('2d')
    if (!ctx) return undefined
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, 0, 0, out.width, out.height)
    return out.toDataURL(type, 0.8)
  }

  async function handleSave() {
    await settle()
    const saved = saveDesign(snapshot(320, 'image/jpeg'))
    setNotice(
      saved
        ? 'Design saved. Find it under Saved.'
        : 'Could not save: browser storage is full. Delete an older design first.',
    )
  }

  async function handleExport() {
    await settle()
    const { colorHex, decals } = useDesignStore.getState()
    const png = snapshot()
    if (png) downloadUrl(`${product.id}-preview.png`, png)
    downloadJson(`${product.id}-design.json`, {
      version: 1,
      product: { id: product.id, name: product.name, modelUrl: product.modelUrl },
      colorHex,
      units: {
        note: 'position and size are in normalized model units',
        modelSize: MODEL_SIZE,
        metresPerUnit: product.sizeMeters / MODEL_SIZE,
      },
      placements: decals.map(d => ({
        zone: d.zone,
        position: d.position,
        rotationDeg: Math.round((d.rotation * 180) / Math.PI),
        size: d.scale,
        sizeMetres: +(d.scale * (product.sizeMeters / MODEL_SIZE)).toFixed(3),
        artwork: d.imageUrl,
      })),
    })
  }

  async function handleAr() {
    if (!meshRef.current) return
    setBusy(true)
    try {
      await settle()
      const { exportMeshToGlb } = await import('../lib/exportGlb')
      const blob = await exportMeshToGlb(meshRef.current, product.sizeMeters / MODEL_SIZE)
      setArUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error('AR export failed', e)
      setNotice('Could not prepare the AR model.')
    } finally {
      setBusy(false)
    }
  }

  async function handleTryOn() {
    if (!meshRef.current) return
    setShowOriginal(false)
    await settle()
    // A copy that shares geometry, materials and artwork with the customizer scene.
    if (meshRef.current) setTryOnGarment(meshRef.current.clone(true))
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6">
      <Link
        to={`/product/${product.id}`}
        className="text-xs uppercase tracking-widest text-ink/50 hover:text-ink"
      >
        ← {product.name}
      </Link>

      <div className="mt-4 flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-150px)] lg:min-h-[560px]">
        <div
          ref={stageRef}
          className={`relative h-[62vh] shrink-0 lg:shrink lg:flex-1 lg:h-auto rounded-3xl overflow-hidden premium-shadow bg-gradient-to-b from-[#efede8] to-[#d6d2c9] ${
            pendingImageUrl ? 'cursor-crosshair' : 'cursor-grab'
          }`}
        >
          <CustomizerScene
            product={product}
            meshRef={meshRef}
            view={view}
            pendingImageUrl={pendingImageUrl}
            showOriginal={showOriginal}
            onPlaced={() => setPendingImageUrl(null)}
          />

          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => setView({ id: v.id })}
                className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest backdrop-blur transition-colors ${
                  view.id === v.id ? 'bg-ink text-canvas' : 'bg-white/80 text-ink/60 hover:text-ink'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => setShowOriginal(o => !o)}
              className={`px-4 py-2 rounded-full text-xs backdrop-blur transition-colors ${
                showOriginal ? 'bg-ink text-canvas' : 'bg-white/80 text-ink/70 hover:text-ink'
              }`}
            >
              {showOriginal ? 'Showing original — back to my design' : 'Compare with original'}
            </button>
            <div className="flex flex-wrap gap-2">
              {product.category === 'apparel' && (
                <button
                  onClick={handleTryOn}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent/90"
                >
                  Try it on (webcam)
                </button>
              )}
              <button
                onClick={handleAr}
                disabled={busy}
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-ink text-canvas hover:bg-ink/90 disabled:opacity-60"
              >
                {busy ? 'Preparing…' : 'View my design in AR'}
              </button>
            </div>
          </div>

          {notice && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-ink text-canvas text-xs px-4 py-2.5 rounded-full shadow-lg">
              {notice}
            </div>
          )}
        </div>

        <ControlPanel
          product={product}
          pendingImageUrl={pendingImageUrl}
          onPendingImage={setPendingImageUrl}
          onSave={handleSave}
          onExport={handleExport}
        />
      </div>

      {arUrl && (
        <Suspense fallback={null}>
          <ArPreview src={arUrl} name={product.name} onClose={() => setArUrl(null)} />
        </Suspense>
      )}
      {tryOnGarment && (
        <Suspense fallback={null}>
          <TryOnMirror
            garment={tryOnGarment}
            name={product.name}
            onClose={() => setTryOnGarment(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
