import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import * as THREE from 'three'
import {
  LEFT_SHOULDER,
  RIGHT_SHOULDER,
  shoulderForeshortening,
  torsoQuaternion,
} from '../lib/torsoPose'

// The pose model and its WASM runtime are fetched from public CDNs on first use
// (about 20 MB, cached by the browser afterwards). Keep the version in step with
// the installed @mediapipe/tasks-vision package.
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

// Where the wearer's shoulder joints sit on the normalized garment model (model
// units: distance between the joints, and their height above the model's centre).
// Estimated for the sample T-shirt; the Fit sliders let the user correct it, and a
// real product model should get measured values.
const SHOULDER_SPAN = 0.75
const SHOULDER_Y = 0.65
// Model units moved per unit of the Fit height slider.
const LIFT_UNITS = 1.7
// Neck and head sizes in the same model units (one unit is roughly half a metre).
const NECK_RADIUS = 0.12
const HEAD_RADIUS = 0.2

const MIN_VISIBILITY = 0.5
// 0 = no smoothing, 1 = frozen. Removes jitter at the cost of a little lag.
const SMOOTHING = 0.6
// Below this much visible shoulder width the wearer is close to side-on, where the
// on-screen shoulder distance says nothing about their size; the last size is kept.
const MIN_FORESHORTENING = 0.5

type Status = 'starting' | 'running' | 'error'

interface Props {
  /** The customized garment (mesh plus its decals) in normalized model space. */
  garment: THREE.Object3D
  name: string
  onClose: () => void
}

function cameraErrorMessage(e: unknown): string {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError') return 'Camera access was blocked. Allow the camera for this site and try again.'
  if (name === 'NotFoundError') return 'No camera was found on this computer.'
  if (name === 'NotReadableError') return 'The camera is in use by another app.'
  return 'Could not start the try-on. Check your camera and internet connection.'
}

export default function TryOnMirror({ garment, name, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<Status>('starting')
  const [error, setError] = useState<string | null>(null)
  const [bodyVisible, setBodyVisible] = useState(true)
  const [mirror, setMirror] = useState(false)
  // Read inside the render loop without restarting the camera when they change.
  const fit = useRef({ size: 1, lift: 0 })
  const [fitUi, setFitUi] = useState(fit.current)

  useEffect(() => {
    let cancelled = false
    let raf = 0
    let stream: MediaStream | null = null
    let landmarker: PoseLandmarker | null = null
    let tracked = false
    let lastVisible = true
    // Shoulder width in pixels as it would appear facing the camera.
    let widthPx = 0
    const targetPos = new THREE.Vector3()
    const targetQuat = new THREE.Quaternion()

    // The garment is drawn by its own small WebGL scene, in pixel coordinates, and
    // composited over each camera frame. `body` sits at the midpoint of the shoulders.
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight('#ffffff', '#8f897e', 0.9))
    const key = new THREE.DirectionalLight('#ffffff', 1.2)
    key.position.set(0.4, 0.6, 1)
    scene.add(key)
    const body = new THREE.Group()
    body.add(garment)
    // Invisible stand-ins for the neck and head. They write depth only, so the part
    // of the collar that passes behind the wearer's neck is hidden and the camera
    // image shows through instead.
    const occluderMaterial = new THREE.MeshBasicMaterial({ colorWrite: false })
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(NECK_RADIUS, NECK_RADIUS, 0.5, 24), occluderMaterial)
    neck.position.y = 0.15
    const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS, 24, 16), occluderMaterial)
    head.position.y = 0.2 + HEAD_RADIUS
    head.scale.y = 1.25
    neck.renderOrder = head.renderOrder = -1
    body.add(neck, head)
    scene.add(body)
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 20000)
    camera.position.z = 10000

    function draw() {
      raf = requestAnimationFrame(draw)
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !landmarker || video.readyState < 2) return

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        renderer.setSize(canvas.width, canvas.height, false)
        camera.right = canvas.width
        camera.top = canvas.height
        camera.updateProjectionMatrix()
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const W = canvas.width
      const H = canvas.height
      ctx.drawImage(video, 0, 0, W, H)

      const result = landmarker.detectForVideo(video, performance.now())
      const pose = result.landmarks[0]
      const world = result.worldLandmarks[0]
      const l = pose?.[LEFT_SHOULDER]
      const r = pose?.[RIGHT_SHOULDER]
      const visible =
        !!l && !!r && !!world &&
        (l.visibility ?? 0) > MIN_VISIBILITY && (r.visibility ?? 0) > MIN_VISIBILITY
      if (visible !== lastVisible) {
        lastVisible = visible
        setBodyVisible(visible)
      }
      if (!visible) {
        tracked = false
        return
      }

      // Position comes from the image; orientation from the 3D pose, so the garment
      // turns with the wearer and shows its back when they face away.
      targetPos.set(((l.x + r.x) / 2) * W, H - ((l.y + r.y) / 2) * H, 0)
      torsoQuaternion(world, targetQuat)
      const seen = shoulderForeshortening(world)
      const spanPx = Math.hypot((l.x - r.x) * W, (l.y - r.y) * H)
      const follow = tracked ? 1 - SMOOTHING : 1
      if (seen > MIN_FORESHORTENING || widthPx === 0) {
        const estimate = spanPx / Math.max(seen, MIN_FORESHORTENING)
        widthPx = widthPx === 0 ? estimate : widthPx + (estimate - widthPx) * follow
      }
      body.position.lerp(targetPos, follow)
      body.quaternion.slerp(targetQuat, follow)
      body.scale.setScalar((widthPx / SHOULDER_SPAN) * fit.current.size)
      garment.position.set(0, -SHOULDER_Y + fit.current.lift * LIFT_UNITS, 0)
      tracked = true

      renderer.render(scene, camera)
      ctx.drawImage(renderer.domElement, 0, 0, W, H)
    }

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new DOMException('Camera needs HTTPS or localhost', 'NotFoundError')
        }
        // Ask for the camera first so the permission prompt is the first thing the user sees.
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        })
        if (cancelled) return
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
        const created = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
        if (cancelled) {
          created.close()
          return
        }
        landmarker = created
        setStatus('running')
        draw()
      } catch (e) {
        if (cancelled) return
        console.error('Try-on failed to start', e)
        setError(cameraErrorMessage(e))
        setStatus('error')
      }
    }
    start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach(t => t.stop())
      landmarker?.close()
      // Geometry, materials and textures belong to the customizer; only this
      // renderer's own GPU copies are released.
      neck.geometry.dispose()
      head.geometry.dispose()
      occluderMaterial.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }, [garment])

  function setFit(patch: Partial<typeof fit.current>) {
    fit.current = { ...fit.current, ...patch }
    setFitUi(fit.current)
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-canvas rounded-3xl w-full max-w-3xl overflow-hidden premium-shadow">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold">Try it on — {name}</div>
          <button onClick={onClose} className="text-xs text-ink/60 hover:text-ink">
            Close
          </button>
        </div>

        <div className="relative bg-ink aspect-video">
          <video ref={videoRef} playsInline muted className="hidden" />
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
            style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
          />
          {status === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center text-canvas/80 text-sm text-center px-6">
              Starting camera and loading body tracking…
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center text-canvas text-sm text-center px-8">
              {error}
            </div>
          )}
          {status === 'running' && !bodyVisible && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ink/80 text-canvas text-xs px-4 py-2 rounded-full">
              Step back so both shoulders are in view
            </div>
          )}
        </div>

        <div className="px-6 py-4 grid sm:grid-cols-3 gap-4 items-end">
          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-ink/50">Fit — size</span>
            <input
              type="range"
              min={0.7}
              max={1.5}
              step={0.01}
              value={fitUi.size}
              onChange={e => setFit({ size: parseFloat(e.target.value) })}
              className="w-full accent-accent"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-ink/50">Fit — height</span>
            <input
              type="range"
              min={-0.15}
              max={0.15}
              step={0.005}
              value={fitUi.lift}
              onChange={e => setFit({ lift: parseFloat(e.target.value) })}
              className="w-full accent-accent"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-ink/70 pb-1">
            <input
              type="checkbox"
              checked={mirror}
              onChange={e => setMirror(e.target.checked)}
              className="accent-accent"
            />
            Mirror view (text reads reversed)
          </label>
        </div>
        <p className="px-6 pb-5 text-[11px] text-ink/50 leading-relaxed">
          The video is processed on this computer only and is never uploaded.
          The shirt turns with you, but it is a rigid 3D model: it does not drape, and your arms
          will not pass in front of it.
        </p>
      </div>
    </div>
  )
}
