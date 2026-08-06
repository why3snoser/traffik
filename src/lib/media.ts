export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

// Compress an image file to a reasonable JPEG base64 (keeps the DB light).
export async function compressImage(file: File, maxSize = 1280, quality = 0.8): Promise<string> {
  const original = await readFileAsDataURL(file)
  const img = await loadImage(original)

  let { width, height } = img
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return original
  ctx.drawImage(img, 0, 0, width, height)

  // JPEG cannot keep transparency — fall back to PNG only when needed.
  const hasAlpha = (() => {
    try {
      const pixel = ctx.getImageData(0, 0, 1, 1).data
      return pixel[3] < 255
    } catch {
      return false
    }
  })()
  const type = hasAlpha ? 'image/png' : 'image/jpeg'
  return canvas.toDataURL(type, hasAlpha ? undefined : quality)
}

// Get the duration of a video file (seconds). Rejects for unsupported files.
export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to read video'))
    }
    video.src = url
  })
}

// Re-encode a video file into a small WebM blob (~6s, low bitrate).
export async function compressVideo(file: File, maxSeconds = 7): Promise<{ dataUrl: string; duration: number }> {
  const duration = await videoDuration(file)
  if (duration > 15) throw new Error('VIDEO_TOO_LONG')

  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.src = url
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Failed to load video'))
  })
  await video.play().catch(() => {})

  const target = Math.min(maxSeconds, duration)
  const stream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.()
  if (!stream) {
    video.pause()
    URL.revokeObjectURL(url)
    // No captureStream support — fall back to the raw file.
    const dataUrl = await readFileAsDataURL(file)
    return { dataUrl, duration }
  }

  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : ''
  if (!mime) {
    video.pause()
    URL.revokeObjectURL(url)
    const dataUrl = await readFileAsDataURL(file)
    return { dataUrl, duration }
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 600_000,
  })
  const chunks: Blob[] = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
  const stopped = new Promise<void>(resolve => { recorder.onstop = () => resolve() })

  recorder.start()
  await new Promise<void>(resolve => {
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    video.onseeked = finish
    video.currentTime = target
    setTimeout(finish, 2000)
  })
  await new Promise<void>(resolve => setTimeout(resolve, 400))
  recorder.stop()
  await stopped

  video.pause()
  URL.revokeObjectURL(url)
  stream.getTracks().forEach(t => t.stop())

  const blob = new Blob(chunks, { type: mime })
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
  return { dataUrl, duration: target }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// Render a rotated image to a fresh base64 so the downloaded file keeps the rotation.
export async function bakeRotation(dataUrl: string, degrees: number): Promise<string> {
  if (degrees % 360 === 0) return dataUrl
  const img = await loadImage(dataUrl)
  const rad = ((degrees % 360) * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const width = Math.round(img.width * cos + img.height * sin)
  const height = Math.round(img.width * sin + img.height * cos)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.translate(width / 2, height / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  return canvas.toDataURL('image/jpeg', 0.9)
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, body] = dataUrl.split(',')
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'application/octet-stream'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}
