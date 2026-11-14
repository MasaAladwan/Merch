export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
export const MAX_IMAGE_MB = 10

/**
 * Validates an uploaded image and re-encodes it as a PNG data URL no larger than
 * `maxDim` on its long edge. Re-encoding through a canvas keeps transparency,
 * strips metadata and keeps saved designs small enough for localStorage.
 */
export async function fileToDataUrl(file: File, maxDim = 1024): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Use a PNG, JPG, WebP or SVG image.')
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_IMAGE_MB} MB.`)
  }

  const blobUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(blobUrl)
    const w = img.naturalWidth || 512
    const h = img.naturalHeight || 512
    const k = Math.min(1, maxDim / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * k))
    canvas.height = Math.max(1, Math.round(h * k))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not process the image.')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('That file could not be read as an image.'))
    img.src = url
  })
}
