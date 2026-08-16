import { z } from 'zod'

export const invoiceSchema = z.object({
  invoiceDate: z.string().date().nullable(),
  supplierName: z.string().trim().min(1).nullable(),
  invoiceNumber: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1).nullable(),
  total: z.number().nonnegative().nullable(),
})

export type InvoiceExtraction = z.infer<typeof invoiceSchema>
