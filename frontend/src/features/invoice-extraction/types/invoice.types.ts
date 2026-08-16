import type { z } from 'zod'
import type { invoiceSchema } from '../schemas/invoice.schema'

export type InvoiceFormData = z.infer<typeof invoiceSchema>

export type InvoiceExtractionResponse = InvoiceFormData
