import { useRef } from 'react'
import type { BatchInvoice } from '../types/invoice.types'

type Props = {
  items: BatchInvoice[]
  activeId: string | null
  message: string | null
  onSelect: (id: string) => void
  onAdd: (files: File[]) => void
  onOpenCamera: () => void
  onReplace: (id: string, file: File) => void
  onRemove: (id: string) => void
  onProcess: () => void
}

export function InvoiceBatchSelection({ items, activeId, message, onSelect, onAdd, onOpenCamera, onReplace, onRemove, onProcess }: Props) {
  const addInput = useRef<HTMLInputElement>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const activeItem = items.find((item) => item.id === activeId) ?? items[0]

  return <section className="mx-auto max-w-6xl rounded-2xl bg-white p-5 shadow-sm sm:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold">Periksa Antrean Faktur</h2>
        <p className="mt-2 text-slate-600">Pastikan setiap gambar hanya berisi satu faktur dan tulisannya terlihat jelas.</p>
      </div>
      <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">{items.length} dari 10 faktur</span>
    </div>

    {message && <p className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}

    <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-3 lg:overflow-visible">
        {items.map((item, index) => <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={`min-w-44 rounded-xl border p-2 text-left transition lg:w-full ${item.id === activeItem.id ? 'border-teal-700 bg-teal-50' : 'border-slate-200'}`}
        >
          <img src={item.previewUrl} alt={`Faktur ${index + 1}`} className="h-24 w-full rounded-lg bg-slate-100 object-cover" />
          <p className="mt-2 truncate text-sm font-semibold text-slate-800">Faktur {index + 1}</p>
          <p className="truncate text-xs text-slate-500">{item.file.name}</p>
        </button>)}
      </div>

      <div className="min-w-0">
        <img src={activeItem.previewUrl} alt="Preview faktur aktif" className="max-h-112 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain" />
        {activeItem.qualityWarning && <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{activeItem.qualityWarning}</p>}
        <p className="mt-3 truncate text-sm text-slate-500">{activeItem.file.name}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => replaceInput.current?.click()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Ganti Foto</button>
          <button type="button" onClick={() => onRemove(activeItem.id)} className="rounded-lg px-4 py-2 text-sm font-semibold text-red-600">Hapus</button>
        </div>
      </div>
    </div>

    <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => addInput.current?.click()} disabled={items.length >= 10} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Tambah Gambar</button>
        <button type="button" onClick={onOpenCamera} disabled={items.length >= 10} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Tambah via Kamera</button>
      </div>
      <button type="button" onClick={onProcess} className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white">Proses Semua Faktur</button>
    </div>
    <input ref={addInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []); if (files.length > 0) onAdd(files); event.target.value = '' }} />
    <input ref={replaceInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onReplace(activeItem.id, file); event.target.value = '' }} />
  </section>
}
