import { useRef } from 'react'
import { InvoiceImageViewer } from './InvoiceImageViewer'

type Props = {
  file: File
  previewUrl: string
  qualityWarning: string | null
  message: string | null
  onChange: (file: File) => void
  onAdd: (files: File[]) => void
  onOpenCamera: () => void
  onProcess: () => void
}

export function InvoicePreview({ file, previewUrl, qualityWarning, message, onChange, onAdd, onOpenCamera, onProcess }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const addInput = useRef<HTMLInputElement>(null)

  return <section className="mx-auto grid max-w-4xl gap-8 rounded-2xl bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-2">
    <div><InvoiceImageViewer imageUrl={previewUrl} alt="Preview faktur" containerClassName="rounded-xl border border-slate-200" className="max-h-112 w-full object-contain" /></div>
    <div className="flex flex-col justify-center">
      <h2 className="text-2xl font-bold">Periksa Foto Faktur</h2>
      <p className="mt-3 leading-7 text-slate-600">Pastikan tulisan terlihat jelas dan seluruh faktur masuk ke dalam foto.</p>
      {qualityWarning && <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-800">{qualityWarning}</p>}
      {message && <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
      <p className="mt-3 truncate text-sm text-slate-500">{file.name}</p>
      <div className="mt-8 grid gap-3">
        <button onClick={onProcess} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition-colors duration-200 hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Proses Faktur</button>
        <button onClick={() => input.current?.click()} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition-colors duration-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Ganti Foto</button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => addInput.current?.click()} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800">Tambah Gambar</button>
          <button onClick={onOpenCamera} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800">Tambah via Kamera</button>
        </div>
      </div>
      <input ref={input} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const next = event.target.files?.[0]; if (next) onChange(next); event.target.value = '' }} />
      <input ref={addInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { const next = Array.from(event.target.files ?? []); if (next.length > 0) onAdd(next); event.target.value = '' }} />
    </div>
  </section>
}
