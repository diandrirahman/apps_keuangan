import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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
  const { register, control, handleSubmit, formState: { errors } } = useForm<InvoiceFormInput, unknown, InvoiceFormOutput>({
    resolver: zodResolver(editableInvoiceSchema),
    defaultValues: {
      invoiceDate: initialValues.invoiceDate,
      supplierName: initialValues.supplierName,
      supplierAddress: initialValues.supplierAddress,
      invoiceNumber: initialValues.invoiceNumber,
      description: initialValues.description,
      items: initialValues.items.map(({ name, quantity, unit, unitPrice, lineTotal }) => ({ name, quantity, unit, unitPrice, lineTotal })),
      total: initialValues.total ?? '',
    },
  })
  const { fields: itemFields, append, remove } = useFieldArray({ control, name: 'items' })

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

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900">Rincian Barang</h3>
              <p className="mt-1 text-sm text-slate-500">Satu baris akan dibuat untuk setiap barang saat disalin ke Excel.</p>
            </div>
            <button
              type="button"
              onClick={() => append({ name: '', quantity: null, unit: null, unitPrice: null, lineTotal: null })}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Tambah Barang
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {itemFields.map((field, index) => {
              const extractedItem = initialValues.items[index]
              return (
                <div key={field.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-12">
                    <label className="sm:col-span-4">
                      <span className="text-xs font-semibold text-slate-600">Nama barang</span>
                      <input {...register(`items.${index}.name`)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="text-xs font-semibold text-slate-600">Jumlah</span>
                      <input type="number" step="any" {...register(`items.${index}.quantity`)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="sm:col-span-1">
                      <span className="text-xs font-semibold text-slate-600">Satuan</span>
                      <input {...register(`items.${index}.unit`)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="text-xs font-semibold text-slate-600">Harga satuan</span>
                      <input type="number" {...register(`items.${index}.unitPrice`)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="text-xs font-semibold text-slate-600">Jumlah item</span>
                      <input type="number" {...register(`items.${index}.lineTotal`)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                    </label>
                    <button type="button" onClick={() => remove(index)} className="self-end rounded-lg px-2 py-2 text-sm font-semibold text-red-600 sm:col-span-1">Hapus</button>
                  </div>
                  {extractedItem?.isCalculationValid === false && (
                    <p className="mt-2 text-sm font-medium text-amber-700">
                      Perhitungan AI: {extractedItem.quantity ?? 0} × {extractedItem.unitPrice ?? 0} = {extractedItem.calculatedLineTotal ?? 0}, berbeda dari jumlah tertulis.
                    </p>
                  )}
                  {errors.items?.[index] && <p className="mt-2 text-sm text-red-600">Periksa kembali data barang ini.</p>}
                </div>
              )
            })}
            {itemFields.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">Belum ada barang yang terbaca.</p>}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:col-span-2 sm:flex-row">
          <button className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white">Copy untuk Excel</button>
          <button type="button" onClick={onReset} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Proses Faktur Lain</button>
        </div>
        {copied && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 sm:col-span-2">✓ Data berhasil dicopy</p>}
      </form>
    </section>
  )
}
