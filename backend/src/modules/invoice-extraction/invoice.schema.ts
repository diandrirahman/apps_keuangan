import { z } from 'zod'

const documentTypeSchema = z.enum(['handwritten_invoice', 'printed_invoice', 'thermal_receipt', 'unknown'])
const confidenceValueSchema = z.coerce.number().min(0).max(1)

const invoiceItemFieldsSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.number().nonnegative().nullable(),
  unit: z.string().trim().min(1).nullable(),
  unitPrice: z.number().nonnegative().nullable(),
  lineTotal: z.number().nonnegative().nullable(),
})

const invoiceItemConfidenceSchema = z.object({
  name: confidenceValueSchema,
  quantity: confidenceValueSchema,
  unit: confidenceValueSchema,
  unitPrice: confidenceValueSchema,
  lineTotal: confidenceValueSchema,
})

export const invoiceItemSchema = invoiceItemFieldsSchema.extend({
  calculatedLineTotal: z.number().nonnegative().nullable(),
  isCalculationValid: z.boolean().nullable(),
  confidence: invoiceItemConfidenceSchema,
  needsReview: z.boolean(),
  reviewNotes: z.array(z.string()),
  nameAlternatives: z.array(z.string()),
})

export const invoiceFieldsSchema = z.object({
  invoiceDate: z.string().date().nullable(),
  supplierName: z.string().trim().min(1).nullable(),
  supplierAddress: z.string().trim().min(1).nullable(),
  invoiceNumber: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1).nullable(),
  items: z.array(invoiceItemSchema),
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

const invoiceAiItemSchema = invoiceItemFieldsSchema.extend({
  nameLegibility: z.enum(['clear', 'uncertain', 'unreadable']).default('uncertain'),
  nameAlternatives: evidenceSchema,
  nameReadings: z.array(z.object({
    source: z.enum(['full', 'table_crop', 'other']),
    value: z.string().trim().min(1).nullable(),
  })).default([]),
  evidence: z.object({
    name: evidenceSchema,
    quantity: evidenceSchema,
    unit: evidenceSchema,
    unitPrice: evidenceSchema,
    lineTotal: evidenceSchema,
  }),
  confidence: invoiceItemConfidenceSchema,
})

export const invoiceAiResponseSchema = invoiceFieldsSchema.extend({
  documentCount: z.coerce.number().int().nonnegative(),
  documentType: documentTypeSchema,
  transcription: z.array(z.string().trim().min(1)).min(1),
  invoiceDateEvidence: evidenceSchema,
  supplierEvidence: evidenceSchema,
  supplierAddressEvidence: evidenceSchema,
  invoiceNumberEvidence: evidenceSchema,
  descriptionEvidence: evidenceSchema,
  items: z.array(invoiceAiItemSchema),
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
