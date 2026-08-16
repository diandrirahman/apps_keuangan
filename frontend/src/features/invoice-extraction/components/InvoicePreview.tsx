import { useRef } from 'react'
type Props = { file: File; previewUrl: string; onChange: (file: File) => void; onProcess: () => void }
export function InvoicePreview({ file, previewUrl, onChange, onProcess }: Props) {
  const input = useRef<HTMLInputElement>(null)
  return <section className="mx-auto grid max-w-4xl gap-8 rounded-2xl bg-white p-6 shadow-sm lg:grid-cols-2 sm:p-10">
    <div><img src={previewUrl} alt="Preview faktur" className="max-h-112 w-full rounded-xl border border-slate-200 object-contain" /></div>
    <div className="flex flex-col justify-center"><h2 className="text-2xl font-bold">Periksa Foto Faktur</h2><p className="mt-3 leading-7 text-slate-600">Pastikan tulisan terlihat jelas dan seluruh faktur masuk ke dalam foto.</p><p className="mt-3 text-sm text-slate-500">{file.name}</p><div className="mt-8 grid gap-3"><button onClick={onProcess} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white">Proses Faktur</button><button onClick={() => input.current?.click()} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Ganti Foto</button></div><input ref={input} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const next = e.target.files?.[0]; if (next) onChange(next) }} /></div>
  </section>
}
