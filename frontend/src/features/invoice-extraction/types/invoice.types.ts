import type { z } from 'zod'
import type { invoiceFieldsSchema, invoiceSchema } from '../schemas/invoice.schema'

export type InvoiceFormData = z.infer<typeof invoiceFieldsSchema>

export type InvoiceExtractionResponse = z.infer<typeof invoiceSchema>
