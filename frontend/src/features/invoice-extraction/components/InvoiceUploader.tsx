import { useRef } from 'react'

type Props = { onSelect: (files: File[]) => void; onOpenCamera: () => void; error: string | null }

export function InvoiceUploader({ onSelect, onOpenCamera, error }: Props) {
  const galleryInput = useRef<HTMLInputElement>(null)
  const select = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) onSelect(files)
    event.target.value = ''
  }

  return <section className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
    <h2 className="text-2xl font-bold text-slate-900">Ubah Faktur Menjadi Data Excel</h2>
    <p className="mt-3 leading-7 text-slate-600">Foto atau pilih hingga 10 gambar faktur. Satu gambar harus berisi satu faktur.</p>
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <button onClick={onOpenCamera} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition-colors duration-200 hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Ambil Foto</button>
      <button onClick={() => galleryInput.current?.click()} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition-colors duration-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Pilih Gambar</button>
    </div>
    <input ref={galleryInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={select} />
    <p className="mt-5 text-sm text-slate-500">Format: JPG, JPEG, PNG, WEBP · Maks. 10 MB per gambar</p>
    {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
  </section>
}
