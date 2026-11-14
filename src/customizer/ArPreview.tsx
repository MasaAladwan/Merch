import { useCallback, useState } from 'react'
import ModelViewer from '../components/ModelViewer'

interface Props {
  /** Blob URL of the exported, customized GLB. */
  src: string
  name: string
  onClose: () => void
}

export default function ArPreview({ src, name, onClose }: Props) {
  const [arAvailable, setArAvailable] = useState<boolean | null>(null)
  const onArAvailability = useCallback((ok: boolean) => setArAvailable(ok), [])

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-canvas rounded-3xl w-full max-w-xl overflow-hidden premium-shadow">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold">Your design — {name}</div>
          <button onClick={onClose} className="text-xs text-ink/60 hover:text-ink">
            Close
          </button>
        </div>
        <div className="h-[60vh] bg-white relative">
          <ModelViewer
            src={src}
            alt={`Customized ${name}`}
            autoRotate={false}
            arButtonLabel="Place it in your space"
            onArAvailability={onArAvailability}
          />
        </div>
        <p className="px-6 py-4 text-xs text-ink/60 leading-relaxed">
          {arAvailable === false
            ? 'This is your customized model. AR is not available in this browser; open the site on an iPhone (Safari) or an ARCore Android phone (Chrome) to place it in your room.'
            : 'Tap the button to place your customized product in the room through your camera.'}
        </p>
      </div>
    </div>
  )
}
