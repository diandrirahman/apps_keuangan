import { z } from 'zod'

export const invoiceItemFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Nama barang harus diisi'),
  quantity: z.coerce.number().nonnegative('Jumlah harus berupa angka positif').nullable(),
  unit: z.string().trim().nullable(),
  unitPrice: z.coerce.number().nonnegative('Harga satuan harus berupa angka positif').nullable(),
  lineTotal: z.coerce.number().nonnegative('Jumlah item harus berupa angka positif').nullable(),
})

const invoiceItemSchema = invoiceItemFieldsSchema.extend({
  calculatedLineTotal: z.number().nonnegative().nullable(),
  isCalculationValid: z.boolean().nullable(),
  confidence: z.object({
    name: z.number().min(0).max(1),
    quantity: z.number().min(0).max(1),
    unit: z.number().min(0).max(1),
    unitPrice: z.number().min(0).max(1),
    lineTotal: z.number().min(0).max(1),
  }),
})

export const invoiceFieldsSchema = z.object({
  invoiceDate: z.string().nullable(),
  supplierName: z.string().trim().nullable(),
  supplierAddress: z.string().trim().nullable(),
  invoiceNumber: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
  items: z.array(invoiceItemFieldsSchema),
  total: z.coerce.number().nonnegative('Total harus berupa angka positif').nullable(),
})

export const invoiceSchema = invoiceFieldsSchema.extend({
  items: z.array(invoiceItemSchema),
  documentType: z.enum(['handwritten_invoice', 'printed_invoice', 'thermal_receipt', 'unknown']),
  confidence: z.object({
    invoiceDate: z.number().min(0).max(1),
    supplierName: z.number().min(0).max(1),
    supplierAddress: z.number().min(0).max(1),
    invoiceNumber: z.number().min(0).max(1),
    description: z.number().min(0).max(1),
    total: z.number().min(0).max(1),
  }),
  reviewRequired: z.boolean(),
  warnings: z.array(z.string()),
})

export const editableInvoiceSchema = invoiceFieldsSchema.extend({
  invoiceDate: z.string().nullable(),
  supplierName: z.string().trim().nullable(),
  invoiceNumber: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
  items: z.array(invoiceItemFieldsSchema),
  total: z.union([z.coerce.number().nonnegative('Total harus berupa angka positif'), z.literal('')]),
})
