import { useEffect, useRef } from 'react'
import '@google/model-viewer'

interface Props {
  src: string
  iosSrc?: string
  alt: string
  autoRotate?: boolean
  /** Multiplies every material's base colour, e.g. the selected product colour. */
  tint?: string
  arButtonLabel?: string
  /** Reports whether this device/browser can start AR, once the model has loaded. */
  onArAvailability?: (available: boolean) => void
}

interface ModelViewerElement extends HTMLElement {
  canActivateAR?: boolean
  model?: {
    materials: { pbrMetallicRoughness: { setBaseColorFactor: (c: string) => void } }[]
  }
}

/**
 * Wrapper around the <model-viewer> web component, which owns the WebGL context,
 * the camera-permission prompt and the AR session lifecycle.
 *
 * AR modes, tried in order:
 *   webxr        Android Chrome, in-page (keeps tint and customized exports)
 *   scene-viewer Android fallback, opens Google's viewer with the original GLB url
 *   quick-look   iOS Safari; a USDZ is generated on the fly when no ios-src is given
 *
 * The button in the `ar-button` slot is only shown by model-viewer when AR can start.
 */
export default function ModelViewer({
  src,
  iosSrc,
  alt,
  autoRotate = true,
  tint,
  arButtonLabel = 'View in your space',
  onArAvailability,
}: Props) {
  const ref = useRef<ModelViewerElement>(null)
  const tintRef = useRef(tint)
  tintRef.current = tint

  function applyTint() {
    const model = ref.current?.model
    if (!model || !tintRef.current) return
    for (const m of model.materials) m.pbrMetallicRoughness.setBaseColorFactor(tintRef.current)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onLoad = () => {
      applyTint()
      onArAvailability?.(Boolean(el.canActivateAR))
    }
    el.addEventListener('load', onLoad)
    return () => el.removeEventListener('load', onLoad)
  }, [onArAvailability])

  useEffect(applyTint, [tint])

  return (
    <model-viewer
      ref={ref}
      src={src}
      ios-src={iosSrc}
      alt={alt}
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="auto"
      camera-controls
      touch-action="pan-y"
      {...(autoRotate ? { 'auto-rotate': true } : {})}
      auto-rotate-delay={3000}
      rotation-per-second="20deg"
      shadow-intensity="1"
      shadow-softness="0.9"
      exposure="1"
      interaction-prompt="none"
    >
      <button
        slot="ar-button"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 20,
          transform: 'translateX(-50%)',
          background: '#0a0a0a',
          color: '#f7f5f1',
          border: 0,
          borderRadius: 999,
          padding: '14px 26px',
          fontSize: 14,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {arButtonLabel}
      </button>
    </model-viewer>
  )
}
