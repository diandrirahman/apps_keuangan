import { useState } from 'react'
import type { BatchInvoice, InvoiceFormData, InvoiceFormInput } from '../types/invoice.types'
import { copyInvoicesToClipboard, countInvoiceRows } from '../utils/invoiceClipboard'
import { InvoiceResultForm } from './InvoiceResultForm'

type StatusCounts = {
  waiting: number
  processing: number
  cooldown: number
  review: number
  reviewed: number
  error: number
}

type Props = {
  items: BatchInvoice[]
  activeItem: BatchInvoice | null
  counts: StatusCounts
  isProcessing: boolean
  cooldownSeconds: number
  canCopyAll: boolean
  reviewedInvoices: InvoiceFormData[]
  onSelect: (id: string) => void
  onRetry: (id: string) => void
  onRemove: (id: string) => void
  onSaveDraft: (id: string, values: InvoiceFormInput) => void
  onMarkReviewed: (id: string, values: InvoiceFormData) => void
  onReset: () => void
}

const statusPresentation = {
  waiting: { label: 'Menunggu', className: 'bg-slate-100 text-slate-600' },
  processing: { label: 'Sedang diproses', className: 'bg-blue-50 text-blue-700' },
  cooldown: { label: 'Menunggu kuota AI', className: 'bg-violet-50 text-violet-700' },
  review: { label: 'Perlu diperiksa', className: 'bg-amber-50 text-amber-700' },
  reviewed: { label: 'Sudah diperiksa', className: 'bg-emerald-50 text-emerald-700' },
  error: { label: 'Gagal', className: 'bg-red-50 text-red-700' },
} as const

export function InvoiceBatchWorkspace({ items, activeItem, counts, isProcessing, cooldownSeconds, canCopyAll, reviewedInvoices, onSelect, onRetry, onRemove, onSaveDraft, onMarkReviewed, onReset }: Props) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const completedCount = counts.review + counts.reviewed + counts.error
  const processingOrdinal = Math.min(completedCount + counts.processing + counts.cooldown, items.length)

  const copyAll = async () => {
    if (!canCopyAll) return
    await copyInvoicesToClipboard(reviewedInvoices)
    setCopyMessage(`${reviewedInvoices.length} faktur dengan ${countInvoiceRows(reviewedInvoices)} baris barang berhasil dicopy.`)
  }

  return <section className="mx-auto max-w-7xl">
    <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Antrean Faktur</h2>
          <p className="mt-1 text-sm text-slate-600">
            {isProcessing
              ? cooldownSeconds > 0
                ? `Menunggu kuota AI · dilanjutkan dalam ${cooldownSeconds} detik`
                : `Memproses ${processingOrdinal} dari ${items.length} faktur`
              : `${counts.reviewed} sudah diperiksa · ${counts.review} perlu diperiksa · ${counts.error} gagal`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={copyAll} disabled={!canCopyAll} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Copy Semua untuk Excel</button>
          <button type="button" onClick={onReset} disabled={isProcessing} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-50">Mulai Antrean Baru</button>
        </div>
      </div>
      {!canCopyAll && !isProcessing && <p className="mt-3 text-sm text-slate-500">Periksa seluruh hasil dan selesaikan faktur yang gagal sebelum menyalin data.</p>}
      {copyMessage && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">✓ {copyMessage}</p>}
    </div>

    <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <nav aria-label="Daftar faktur" className="flex gap-3 overflow-x-auto rounded-2xl bg-white p-3 shadow-sm lg:block lg:space-y-2 lg:overflow-visible">
        {items.map((item, index) => {
          const presentation = statusPresentation[item.status]
          return <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`min-w-52 rounded-xl border p-3 text-left transition lg:w-full ${activeItem?.id === item.id ? 'border-teal-700 bg-teal-50' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-start gap-3">
              <img src={item.previewUrl} alt="" className="h-14 w-12 rounded-md bg-slate-100 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">Faktur {index + 1}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{item.file.name}</p>
                <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${presentation.className}`}>{presentation.label}</span>
              </div>
            </div>
          </button>
        })}
      </nav>

      <div className="min-w-0">
        {isProcessing && <div className="rounded-2xl bg-white p-8 text-center shadow-sm sm:p-12">
          <div className={`mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-teal-700 ${cooldownSeconds > 0 ? '' : 'animate-spin'}`} />
          <h3 className="mt-6 text-2xl font-bold">{cooldownSeconds > 0 ? 'Menunggu kuota AI...' : 'Membaca faktur...'}</h3>
          <p className="mt-3 text-slate-600">
            {cooldownSeconds > 0
              ? `Batas request per menit sedang penuh. Proses dilanjutkan otomatis dalam ${cooldownSeconds} detik.`
              : 'Faktur diproses satu per satu agar hasil tetap stabil.'}
          </p>
        </div>}

        {!isProcessing && activeItem?.status === 'error' && <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-10">
          <img src={activeItem.previewUrl} alt="Faktur yang gagal diproses" className="mx-auto max-h-72 rounded-xl border border-slate-200 object-contain" />
          <h3 className="mt-6 text-xl font-bold">Faktur belum berhasil diproses</h3>
          <p className="mt-2 text-slate-600">{activeItem.errorMessage}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => onRetry(activeItem.id)} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white">Coba Lagi</button>
            <button type="button" onClick={() => onRemove(activeItem.id)} className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600">Hapus dari Antrean</button>
          </div>
        </div>}

        {!isProcessing && activeItem?.result && (activeItem.status === 'review' || activeItem.status === 'reviewed') && <div className="space-y-5">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <img src={activeItem.previewUrl} alt="Faktur yang sedang diperiksa" className="mx-auto max-h-72 rounded-xl object-contain" />
          </div>
          <InvoiceResultForm
            key={activeItem.id}
            initialValues={activeItem.result}
            defaultValues={activeItem.draft}
            mode="batch"
            onDraftChange={(values) => onSaveDraft(activeItem.id, values)}
            onSave={(values) => onMarkReviewed(activeItem.id, values)}
          />
        </div>}
      </div>
    </div>
  </section>
}
