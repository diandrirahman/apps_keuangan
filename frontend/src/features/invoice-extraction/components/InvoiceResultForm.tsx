import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { editableInvoiceSchema } from '../schemas/invoice.schema'
import type { InvoiceExtractionResponse } from '../types/invoice.types'
import { copyInvoiceToClipboard } from '../utils/invoiceClipboard'

type Props = { initialValues: InvoiceExtractionResponse; onReset: () => void }
type InvoiceFormInput = z.input<typeof editableInvoiceSchema>
type InvoiceFormOutput = z.output<typeof editableInvoiceSchema>
type ConfidenceKey = keyof InvoiceExtractionResponse['confidence']

const fields = [
  ['invoiceDate', 'Tanggal', 'date'],
  ['supplierName', 'Nama Supplier', 'text'],
  ['supplierAddress', 'Alamat Toko', 'text'],
  ['invoiceNumber', 'Nomor Faktur', 'text'],
  ['description', 'Keterangan', 'text'],
  ['total', 'Total', 'number'],
] as const

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'Sangat yakin'
  if (confidence >= 0.7) return 'Cukup yakin'
  return 'Perlu diperiksa'
}

export function InvoiceResultForm({ initialValues, onReset }: Props) {
  const [copied, setCopied] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<InvoiceFormInput, unknown, InvoiceFormOutput>({
    resolver: zodResolver(editableInvoiceSchema),
    defaultValues: {
      invoiceDate: initialValues.invoiceDate,
      supplierName: initialValues.supplierName,
      supplierAddress: initialValues.supplierAddress,
      invoiceNumber: initialValues.invoiceNumber,
      description: initialValues.description,
      total: initialValues.total ?? '',
    },
  })

  const copy = handleSubmit(async (values) => {
    await copyInvoiceToClipboard({ ...values, total: values.total === '' ? null : Number(values.total) })
    setCopied(true)
  })

  return (
    <section className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
      <h2 className="text-2xl font-bold">Hasil Pembacaan Faktur</h2>
      <p className="mt-2 text-slate-600">Periksa dan edit data sebelum menyalinnya ke Excel.</p>

      {initialValues.reviewRequired && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <p className="font-semibold">Beberapa data perlu diperiksa</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {initialValues.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={copy} className="mt-8 grid gap-5 sm:grid-cols-2">
        {fields.map(([name, label, type]) => {
          const confidence = initialValues.confidence[name as ConfidenceKey]
          return (
            <label key={name} className={name === 'description' ? 'sm:col-span-2' : ''}>
              <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                <span>{label}</span>
                <span className={confidence < 0.7 ? 'text-amber-700' : 'text-slate-500'}>
                  {confidenceLabel(confidence)} · {Math.round(confidence * 100)}%
                </span>
              </span>
              <input
                type={type}
                {...register(name)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
              />
              {name === 'supplierAddress' && <span className="mt-1 block text-xs text-slate-500">Alamat membantu verifikasi toko dan tidak disalin ke Excel.</span>}
              {errors[name] && <span className="mt-1 block text-sm text-red-600">{errors[name]?.message as string}</span>}
            </label>
          )
        })}

        <div className="mt-3 flex flex-col gap-3 sm:col-span-2 sm:flex-row">
          <button className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white">Copy untuk Excel</button>
          <button type="button" onClick={onReset} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Proses Faktur Lain</button>
        </div>
        {copied && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 sm:col-span-2">✓ Data berhasil dicopy</p>}
      </form>
    </section>
  )
}
