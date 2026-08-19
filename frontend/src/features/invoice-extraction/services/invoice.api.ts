import { invoiceSchema } from '../schemas/invoice.schema'
import type { InvoiceExtractionResponse } from '../types/invoice.types'

export async function extractInvoice(imageFile: File): Promise<InvoiceExtractionResponse> {
  const body = new FormData()
  body.append('image', imageFile)
  const response = await fetch('/api/invoices/extract', { method: 'POST', body })
  const payload: unknown = await response.json()
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : 'Faktur belum berhasil diproses. Pastikan gambar terlihat jelas lalu coba kembali.'
    throw new Error(message)
  }
  return invoiceSchema.parse(payload)
}
