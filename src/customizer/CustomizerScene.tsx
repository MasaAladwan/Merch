import { Suspense, useEffect, useMemo, useState, type RefObject } from 'react'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Decal, useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useDesignStore } from '../lib/store'
import type { Decal as DecalType, Product, Zone } from '../lib/types'

export type View = 'front' | 'back' | 'left' | 'right'
/** A new object per request, so asking for the current view again still re-snaps the camera. */
export type ViewRequest = { id: View }

/** The garment is normalized so its largest dimension is this many scene units. */
export const MODEL_SIZE = 1.6

const CAMERA_DISTANCE = 4
const VIEW_POSITION: Record<View, [number, number, number]> = {
  front: [0, 0, CAMERA_DISTANCE],
  back: [0, 0, -CAMERA_DISTANCE],
  left: [-CAMERA_DISTANCE, 0, 0],
  right: [CAMERA_DISTANCE, 0, 0],
}
// Pointer travel (px) above which a click is treated as a camera drag.
const DRAG_THRESHOLD = 4

function CameraRig({ view }: { view: ViewRequest }) {
  const camera = useThree(s => s.camera)
  const controls = useThree(s => s.controls) as { update?: () => void } | null
  const invalidate = useThree(s => s.invalidate)
  useEffect(() => {
    camera.position.set(...VIEW_POSITION[view.id])
    camera.lookAt(0, 0, 0)
    controls?.update?.()
    invalidate()
  }, [view, camera, controls, invalidate])
  return null
}

function useImageTexture(url: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    let cancelled = false
    let loaded: THREE.Texture | null = null
    new THREE.TextureLoader().load(url, t => {
      if (cancelled) return t.dispose()
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      // The decal projector's V axis points down the garment; without this the art is upside down.
      t.flipY = false
      loaded = t
      setTex(t)
    })
    return () => {
      cancelled = true
      loaded?.dispose()
      setTex(null)
    }
  }, [url])
  return tex
}

/**
 * Takes the largest mesh of the GLB, bakes its node transform into a copy of the
 * geometry, then centres and scales it to MODEL_SIZE. Decal coordinates are stored
 * in this normalized space, so they are independent of how the source file is scaled.
 */
function useGarment(url: string) {
  const { scene } = useGLTF(url)
  const garment = useMemo(() => {
    scene.updateMatrixWorld(true)
    const meshes: THREE.Mesh[] = []
    scene.traverse(o => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh)
    })
    if (meshes.length === 0) return null

    const size = new THREE.Vector3()
    const extent = (m: THREE.Mesh) => new THREE.Box3().setFromObject(m).getSize(size).length()
    const body = meshes.reduce((a, b) => (extent(b) > extent(a) ? b : a))

    const geometry = body.geometry.clone().applyMatrix4(body.matrixWorld)
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    const center = box.getCenter(new THREE.Vector3())
    box.getSize(size)
    const k = MODEL_SIZE / Math.max(size.x, size.y, size.z)
    geometry.translate(-center.x, -center.y, -center.z).scale(k, k, k)
    if (!geometry.attributes.normal) geometry.computeVertexNormals()

    const source = Array.isArray(body.material) ? body.material[0] : body.material
    const map = (source as THREE.MeshStandardMaterial).map ?? null
    return { geometry, map }
  }, [scene])

  useEffect(() => () => garment?.geometry.dispose(), [garment])
  return garment
}

function zoneFromNormal(n: THREE.Vector3 | undefined): Zone {
  if (!n) return 'front'
  if (Math.abs(n.x) > Math.abs(n.z)) return 'sleeve'
  return n.z >= 0 ? 'front' : 'back'
}

function DecalMesh({ decal, armed }: { decal: DecalType; armed: boolean }) {
  const tex = useImageTexture(decal.imageUrl)
  const selected = useDesignStore(s => s.selectedDecalId === decal.id)
  const selectDecal = useDesignStore(s => s.selectDecal)
  if (!tex) return null

  // `scale` is the long edge of the print; the short edge follows the artwork's aspect ratio.
  const image = tex.image as { width: number; height: number }
  const aspect = image.width / image.height
  const s = decal.scale
  const size: [number, number, number] = aspect >= 1 ? [s, s / aspect, s] : [s * aspect, s, s]

  return (
    // A numeric rotation makes drei orient the projector along the surface normal
    // at `position`, so the print wraps the garment instead of floating in front of it.
    <Decal
      position={decal.position}
      // drei accepts a number here at runtime; its prop type wrongly intersects with mesh.rotation.
      rotation={decal.rotation as unknown as THREE.Euler}
      scale={size}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        // Let the click reach the garment when placing new art or moving this decal.
        if (e.delta > DRAG_THRESHOLD || armed || selected) return
        e.stopPropagation()
        selectDecal(decal.id)
      }}
    >
      <meshStandardMaterial
        map={tex}
        transparent
        polygonOffset
        polygonOffsetFactor={-10}
        roughness={0.8}
      />
    </Decal>
  )
}

interface GarmentProps {
  product: Product
  meshRef: RefObject<THREE.Mesh>
  pendingImageUrl: string | null
  showOriginal: boolean
  onPlaced: () => void
}

function Garment({ product, meshRef, pendingImageUrl, showOriginal, onPlaced }: GarmentProps) {
  const garment = useGarment(product.modelUrl)
  const colorHex = useDesignStore(s => s.colorHex)
  const decals = useDesignStore(s => s.decals)
  const selectedId = useDesignStore(s => s.selectedDecalId)
  const addDecal = useDesignStore(s => s.addDecal)
  const updateDecal = useDesignStore(s => s.updateDecal)

  if (!garment) return null

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (e.delta > DRAG_THRESHOLD || showOriginal) return
    e.stopPropagation()
    const p = e.eventObject.worldToLocal(e.point.clone())
    const position: [number, number, number] = [p.x, p.y, p.z]
    const zone = zoneFromNormal(e.face?.normal)

    if (pendingImageUrl) {
      addDecal({ imageUrl: pendingImageUrl, zone, position, rotation: 0, scale: 0.35 })
      onPlaced()
    } else if (selectedId) {
      updateDecal(selectedId, { position, zone })
    }
  }

  return (
    <mesh ref={meshRef} geometry={garment.geometry} onClick={handleClick}>
      <meshStandardMaterial
        color={showOriginal ? product.colors[0].hex : colorHex}
        map={garment.map}
        roughness={0.78}
        metalness={0.02}
      />
      {!showOriginal &&
        decals.map(d => <DecalMesh key={d.id} decal={d} armed={pendingImageUrl !== null} />)}
    </mesh>
  )
}

interface Props extends GarmentProps {
  view: ViewRequest
}

export default function CustomizerScene({ view, ...garmentProps }: Props) {
  return (
    <Canvas
      // Render only when something changes; the scene has no continuous animation.
      frameloop="demand"
      camera={{ position: VIEW_POSITION.front, fov: 32 }}
      dpr={[1, 1.75]}
      // Needed so the canvas can be read back for thumbnails and PNG export.
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <hemisphereLight args={['#ffffff', '#8f897e', 0.75]} />
      <directionalLight position={[2.5, 3, 4]} intensity={1.15} />
      <directionalLight position={[-3, 2, -4]} intensity={1.15} />
      <Suspense fallback={null}>
        <Garment {...garmentProps} />
        <ContactShadows position={[0, -0.95, 0]} opacity={0.3} scale={5} blur={2.6} far={2} frames={1} />
      </Suspense>
      <CameraRig view={view} />
      <OrbitControls enablePan={false} minDistance={1.6} maxDistance={6} makeDefault />
    </Canvas>
  )
}
