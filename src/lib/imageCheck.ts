import { photoRules } from './config'

export type CheckResult = { ok: true } | { ok: false; message: string }

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Quick checks on the file itself, before we try to open it as an image. */
export function checkFile(file: { name: string; type: string; size: number }): CheckResult {
  const name = file.name.toLowerCase()
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  if (ext === '.heic' || ext === '.heif' || file.type.includes('heic') || file.type.includes('heif')) {
    return { ok: false, message: 'This is an iPhone HEIC photo, which browsers can’t open reliably. Save it as a JPEG first (on iPhone: share the photo, choose "Save to Files" with "Most Compatible" format), or set Camera > Formats to "Most Compatible".' }
  }
  const typeOk = photoRules.acceptedTypes.includes(file.type)
  const extOk = photoRules.acceptedExtensions.includes(ext)
  if (!typeOk && !(file.type === '' && extOk)) {
    return { ok: false, message: `“${file.name}” isn’t a supported photo. Please choose a JPG, JPEG, PNG or WebP file.` }
  }
  if (file.size === 0) return { ok: false, message: 'This file is empty. Please choose another photo.' }
  if (file.size > photoRules.maxBytes) {
    return { ok: false, message: `This photo is ${formatBytes(file.size)}. The limit is ${formatBytes(photoRules.maxBytes)}. Try a smaller version, or take a screenshot of it.` }
  }
  return { ok: true }
}

/** Opens the image to confirm it really is a readable picture, and measures it. */
export function readDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      if (!img.naturalWidth || !img.naturalHeight) reject(new Error('empty'))
      else resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')) }
    img.src = url
  })
}

export function isSmall(width: number, height: number): boolean {
  return Math.min(width, height) < photoRules.smallEdge
}
