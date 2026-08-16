import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { editableInvoiceSchema } from '../schemas/invoice.schema'
import type { InvoiceFormData } from '../types/invoice.types'
import { copyInvoiceToClipboard } from '../utils/invoiceClipboard'

type Props = { initialValues: InvoiceFormData; onReset: () => void }
type InvoiceFormInput = z.input<typeof editableInvoiceSchema>
type InvoiceFormOutput = z.output<typeof editableInvoiceSchema>
const fields = [['invoiceDate', 'Tanggal', 'date'], ['supplierName', 'Nama Supplier', 'text'], ['invoiceNumber', 'Nomor Faktur', 'text'], ['description', 'Keterangan', 'text'], ['total', 'Total', 'number']] as const
export function InvoiceResultForm({ initialValues, onReset }: Props) {
  const [copied, setCopied] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<InvoiceFormInput, unknown, InvoiceFormOutput>({ resolver: zodResolver(editableInvoiceSchema), defaultValues: { ...initialValues, total: initialValues.total ?? '' } })
  const copy = handleSubmit(async (values) => { await copyInvoiceToClipboard({ ...values, total: values.total === '' ? null : Number(values.total) }); setCopied(true) })
  return <section className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm sm:p-10"><h2 className="text-2xl font-bold">Hasil Pembacaan Faktur</h2><p className="mt-2 text-slate-600">Periksa dan edit data sebelum menyalinnya ke Excel.</p><form onSubmit={copy} className="mt-8 grid gap-5 sm:grid-cols-2">{fields.map(([name, label, type]) => <label key={name} className={name === 'description' ? 'sm:col-span-2' : ''}><span className="text-sm font-semibold text-slate-700">{label}</span><input type={type} {...register(name)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700" />{errors[name] && <span className="mt-1 block text-sm text-red-600">{errors[name]?.message as string}</span>}</label>)}<div className="mt-3 flex flex-col gap-3 sm:col-span-2 sm:flex-row"><button className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white">Copy untuk Excel</button><button type="button" onClick={onReset} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Proses Faktur Lain</button></div>{copied && <p className="sm:col-span-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">✓ Data berhasil dicopy</p>}</form></section>
}
