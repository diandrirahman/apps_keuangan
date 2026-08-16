import { useEffect, useRef, useState } from 'react'

type Props = { onCapture: (file: File) => void; onClose: () => void }

export function InvoiceCamera({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        setError('Kamera tidak dapat diakses. Periksa izin kamera pada browser Anda.')
      }
    }
    void startCamera()
    return () => streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], `faktur-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
    <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Ambil Foto Faktur</h2><button onClick={onClose} className="rounded-lg px-3 py-1 text-slate-600">Tutup</button></div>
      {error ? <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : <video ref={videoRef} autoPlay playsInline className="mt-5 aspect-3/4 w-full rounded-xl bg-slate-900 object-cover" />}
      <div className="mt-5 grid grid-cols-2 gap-3"><button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">Batal</button><button disabled={Boolean(error)} onClick={capture} className="rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white disabled:opacity-50">Ambil Foto</button></div>
    </section>
  </div>
}
