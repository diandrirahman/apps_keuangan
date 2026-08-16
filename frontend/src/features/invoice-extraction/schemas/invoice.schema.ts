import { z } from 'zod'

export const invoiceSchema = z.object({
  invoiceDate: z.string().nullable(),
  supplierName: z.string().trim().nullable(),
  invoiceNumber: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
  total: z.coerce.number().nonnegative('Total harus berupa angka positif').nullable(),
})

export const editableInvoiceSchema = invoiceSchema.extend({
  invoiceDate: z.string().nullable(),
  supplierName: z.string().trim().nullable(),
  invoiceNumber: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
  total: z.union([z.coerce.number().nonnegative('Total harus berupa angka positif'), z.literal('')]),
})
