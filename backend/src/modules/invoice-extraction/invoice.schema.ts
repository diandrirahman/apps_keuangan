import { z } from 'zod'

const documentTypeSchema = z.enum(['handwritten_invoice', 'printed_invoice', 'thermal_receipt', 'unknown'])
const confidenceValueSchema = z.coerce.number().min(0).max(1)

export const invoiceFieldsSchema = z.object({
  invoiceDate: z.string().date().nullable(),
  supplierName: z.string().trim().min(1).nullable(),
  supplierAddress: z.string().trim().min(1).nullable(),
  invoiceNumber: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1).nullable(),
  total: z.number().nonnegative().nullable(),
})

export const invoiceSchema = invoiceFieldsSchema.extend({
  documentType: documentTypeSchema,
  confidence: z.object({
    invoiceDate: confidenceValueSchema,
    supplierName: confidenceValueSchema,
    supplierAddress: confidenceValueSchema,
    invoiceNumber: confidenceValueSchema,
    description: confidenceValueSchema,
    total: confidenceValueSchema,
  }),
  reviewRequired: z.boolean(),
  warnings: z.array(z.string()),
})

const evidenceSchema = z.array(z.string().trim().min(1)).default([])

export const invoiceAiResponseSchema = invoiceFieldsSchema.extend({
  documentCount: z.coerce.number().int().nonnegative(),
  documentType: documentTypeSchema,
  transcription: z.array(z.string().trim().min(1)).min(1),
  invoiceDateEvidence: evidenceSchema,
  supplierEvidence: evidenceSchema,
  supplierAddressEvidence: evidenceSchema,
  invoiceNumberEvidence: evidenceSchema,
  descriptionEvidence: evidenceSchema,
  totalEvidence: evidenceSchema,
  confidence: z.object({
    invoiceDate: confidenceValueSchema,
    supplierName: confidenceValueSchema,
    supplierAddress: confidenceValueSchema,
    invoiceNumber: confidenceValueSchema,
    description: confidenceValueSchema,
    total: confidenceValueSchema,
  }),
})

export type InvoiceExtraction = z.infer<typeof invoiceSchema>
export type InvoiceAiResponse = z.infer<typeof invoiceAiResponseSchema>
