import type { OutputSize } from './aiPricing'

/** Picks the output shape closest to the photo, so the room isn't squashed. */
export function chooseOutputSize(width: number, height: number): OutputSize {
  const r = width / height
  if (r > 1.15) return '1536x1024'
  if (r < 0.87) return '1024x1536'
  return '1024x1024'
}

/**
 * Makes a smaller JPEG copy for sending (long edge 1536 px), so uploads are
 * quick and fit the server limit. The original photo is never changed.
 */
export async function prepareForUpload(photo: Blob, maxEdge = 1536): Promise<Blob> {
  const url = URL.createObjectURL(photo)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('unreadable'))
      i.src = url
    })
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) throw new Error('encode')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}
