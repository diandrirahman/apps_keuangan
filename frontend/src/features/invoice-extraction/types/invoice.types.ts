import type { z } from 'zod'
import type { editableInvoiceSchema, invoiceSchema } from '../schemas/invoice.schema'

export type InvoiceFormInput = z.input<typeof editableInvoiceSchema>
export type InvoiceFormData = z.output<typeof editableInvoiceSchema>
export type InvoiceExtractionResponse = z.infer<typeof invoiceSchema>

export type BatchInvoiceStatus = 'waiting' | 'processing' | 'cooldown' | 'review' | 'reviewed' | 'error'

export type BatchInvoice = {
  id: string
  file: File
  previewUrl: string
  qualityWarning: string | null
  status: BatchInvoiceStatus
  result: InvoiceExtractionResponse | null
  draft: InvoiceFormInput | null
  reviewedInvoice: InvoiceFormData | null
  errorMessage: string | null
}
