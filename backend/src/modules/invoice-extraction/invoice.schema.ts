import { z } from 'zod'

export const invoiceSchema = z.object({
  invoiceDate: z.string().date().nullable(),
  supplierName: z.string().trim().min(1).nullable(),
  invoiceNumber: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1).nullable(),
  total: z.number().nonnegative().nullable(),
})

const evidenceSchema = z.array(z.string().trim().min(1)).default([])

export const invoiceAiResponseSchema = invoiceSchema.extend({
  transcription: z.array(z.string().trim().min(1)).min(1),
  invoiceDateEvidence: evidenceSchema,
  supplierAddress: z.string().trim().min(1).nullable().optional().default(null),
  supplierEvidence: evidenceSchema,
  supplierConfidence: z.coerce.number().min(0).max(1),
  invoiceNumberEvidence: evidenceSchema,
  descriptionEvidence: evidenceSchema,
  totalEvidence: evidenceSchema,
})

export type InvoiceExtraction = z.infer<typeof invoiceSchema>
export type InvoiceAiResponse = z.infer<typeof invoiceAiResponseSchema>
