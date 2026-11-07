import { useEffect } from 'react'
import { X, ZoomIn } from 'lucide-react'

interface ImageModalProps {
  url: string | null
  alt?: string
  onClose: () => void
}

export function ImageModal({ url, alt = 'Foto', onClose }: ImageModalProps) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'auto'
    }
  }, [onClose])

  if (!url) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
        title="Fechar (ESC)"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 text-white text-sm">
          <ZoomIn className="w-4 h-4" />
          <span>Clique fora ou ESC para fechar</span>
        </div>
      </div>

      <div
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
          draggable={false}
        />
      </div>

      {alt && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg">
          {alt}
        </div>
      )}
    </div>
  )
}