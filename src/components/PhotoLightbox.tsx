import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, RotateCw, Download, X, Trash2 } from 'lucide-react'
import { useT } from '@/i18n'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock'
import { downloadDataUrl, bakeRotation } from '@/lib/media'

interface PhotoLightboxProps {
  photos: string[]
  index: number
  onClose: () => void
  onDelete: (index: number) => void
}

export default function PhotoLightbox({ photos, index, onClose, onDelete }: PhotoLightboxProps) {
  const t = useT()
  const [current, setCurrent] = useState(index)
  const [rotation, setRotation] = useState(0)

  const photo = photos[current]

  const prev = () => { setRotation(0); setCurrent(c => (c - 1 + photos.length) % photos.length) }
  const next = () => { setRotation(0); setCurrent(c => (c + 1) % photos.length) }

  const handleDownload = async () => {
    const baked = await bakeRotation(photo, rotation)
    downloadDataUrl(baked, `photo-${current + 1}.jpg`)
  }

  const handleDelete = () => {
    onDelete(current)
    setRotation(0)
    if (photos.length <= 1) {
      onClose()
    } else {
      setCurrent(c => (c === photos.length - 1 ? c - 1 : c))
    }
  }

  /* The page behind a full-screen overlay must not scroll. The lock is the
     shared refcounted one, so this composes if a lightbox opens over a sheet.
     Empty deps on purpose: the component mounts and unmounts with the overlay,
     and re-running this per render would restore the scroll position mid-view. */
  useEffect(() => {
    lockBodyScroll()
    return unlockBodyScroll
  }, [])

  /* Escape gets the user out — on desktop the X was otherwise the only exit. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* Rendered into <body>: any ancestor with a live `transform` (a card hover, a
     mid-flight entrance animation) would otherwise become the containing block
     and re-anchor this `fixed` overlay to that element instead of the viewport. */
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-fade-in"
      onClick={onClose}
    >
      {/* Top bar. The inset is applied with `max()` and an `env()` fallback
          rather than the `.safe-top` class — that class *replaces* padding-top,
          so on a phone with no notch it would zero out the `py-3`. */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
      >
        <span className="text-sm text-text-muted">{current + 1} / {photos.length}</span>
        <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-text-muted hover:text-text">
          <X size={18} />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-4" onClick={e => e.stopPropagation()}>
        <img
          src={photo}
          alt=""
          className="max-w-full max-h-full object-contain rounded-xl"
          style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.2s ease' }}
        />
      </div>

      {/* Controls */}
      <div
        className="flex flex-wrap items-center justify-center gap-3 px-4 py-5"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
        onClick={e => e.stopPropagation()}
      >
        {photos.length > 1 && (
          <button onClick={prev} className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-text-muted hover:text-text">
            <ChevronLeft size={20} />
          </button>
        )}
        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-text-muted hover:text-text"
          title={t('photo_rotate')}
        >
          <RotateCw size={18} />
        </button>
        <button
          onClick={handleDownload}
          className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-white shadow-glow-sm"
          title={t('photo_download')}
        >
          <Download size={18} />
        </button>
        <button
          onClick={handleDelete}
          className="w-11 h-11 rounded-xl bg-danger/15 flex items-center justify-center text-danger"
          title={t('photo_delete')}
        >
          <Trash2 size={18} />
        </button>
        {photos.length > 1 && (
          <button onClick={next} className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-text-muted hover:text-text">
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
