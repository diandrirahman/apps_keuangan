import { z } from 'zod'

export const invoiceFieldsSchema = z.object({
  invoiceDate: z.string().nullable(),
  supplierName: z.string().trim().nullable(),
  supplierAddress: z.string().trim().nullable(),
  invoiceNumber: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
  total: z.coerce.number().nonnegative('Total harus berupa angka positif').nullable(),
})

export const invoiceSchema = invoiceFieldsSchema.extend({
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
  total: z.union([z.coerce.number().nonnegative('Total harus berupa angka positif'), z.literal('')]),
})
