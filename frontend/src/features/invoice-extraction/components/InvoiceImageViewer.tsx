import { useEffect, useState } from 'react'

type Props = {
  imageUrl: string
  alt: string
  className?: string
  containerClassName?: string
}

const minimumZoom = 0.75
const maximumZoom = 3
const zoomStep = 0.25

export function InvoiceImageViewer({ imageUrl, alt, className = '', containerClassName = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [zoom, setZoom] = useState(1)

  const close = () => {
    setIsOpen(false)
    setZoom(1)
  }

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const changeZoom = (amount: number) => {
    setZoom((current) => Math.min(maximumZoom, Math.max(minimumZoom, Number((current + amount).toFixed(2)))))
  }

  return <>
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className={`group relative block w-full cursor-zoom-in overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${containerClassName}`}
      aria-label={`Perbesar ${alt}`}
    >
      <img src={imageUrl} alt={alt} className={className} />
      <span className="absolute inset-x-3 bottom-3 rounded-lg bg-slate-900/80 px-3 py-2 text-center text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">Klik untuk perbesar</span>
    </button>

    {isOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Foto besar: ${alt}`} onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <section className="relative h-full w-full max-w-6xl">
        <div className="absolute right-1 top-1 z-10 flex flex-wrap items-center justify-end gap-2 px-1 py-2 text-white sm:right-2 sm:top-2 sm:px-2">
            <button type="button" aria-label="Perkecil foto" onClick={() => changeZoom(-zoomStep)} disabled={zoom <= minimumZoom} className="rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40">−</button>
            <button type="button" onClick={() => setZoom(1)} className="min-w-16 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/15">{Math.round(zoom * 100)}%</button>
            <button type="button" aria-label="Perbesar foto" onClick={() => changeZoom(zoomStep)} disabled={zoom >= maximumZoom} className="rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40">+</button>
            <button type="button" aria-label="Tutup tampilan foto" onClick={close} className="rounded-lg border border-white/30 px-3 py-2 text-lg font-semibold leading-none transition-colors hover:bg-white/15">×</button>
        </div>
        <div className={`flex h-full overflow-auto p-4 sm:p-8 ${zoom > 1 ? 'items-start justify-start' : 'items-center justify-center'}`}>
          <img
            src={imageUrl}
            alt={alt}
            className="h-auto w-auto shrink-0 rounded-lg object-contain shadow-xl"
            style={{ height: `${zoom * 80}vh`, maxWidth: `${zoom * 95}vw` }}
          />
        </div>
      </section>
    </div>}
  </>
}
