import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

/**
 * Bakes the customized garment (base mesh + decal meshes) into a GLB so it can be
 * handed to <model-viewer> for AR.
 *
 * glTF has no polygonOffset, so each decal is pushed slightly along its normals to
 * stop it z-fighting with the garment in AR viewers.
 */
export async function exportMeshToGlb(mesh: THREE.Mesh, scale: number): Promise<Blob> {
  const root = mesh.clone(true)
  root.position.set(0, 0, 0)
  root.scale.setScalar(scale)

  const cloned: THREE.BufferGeometry[] = []
  root.traverse(obj => {
    const child = obj as THREE.Mesh
    if (child === root || !child.isMesh) return
    // DecalGeometry.clone() re-runs its constructor without arguments and throws.
    const g = new THREE.BufferGeometry().copy(child.geometry)
    const pos = g.attributes.position
    const nor = g.attributes.normal
    if (nor) {
      for (let i = 0; i < pos.count; i++) {
        pos.setXYZ(
          i,
          pos.getX(i) + nor.getX(i) * 0.004,
          pos.getY(i) + nor.getY(i) * 0.004,
          pos.getZ(i) + nor.getZ(i) * 0.004,
        )
      }
    }
    child.geometry = g
    cloned.push(g)
  })

  try {
    const buffer = (await new GLTFExporter().parseAsync(root, { binary: true })) as ArrayBuffer
    return new Blob([buffer], { type: 'model/gltf-binary' })
  } finally {
    cloned.forEach(g => g.dispose())
  }
}
