import { invoiceSchema } from '../schemas/invoice.schema'
import type { InvoiceExtractionResponse } from '../types/invoice.types'

export class InvoiceApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null,
    public readonly retryAfterSeconds: number | null,
    public readonly referenceId: string | null,
  ) {
    super(message)
    this.name = 'InvoiceApiError'
  }
}

function payloadField(payload: unknown, field: string): unknown {
  return typeof payload === 'object' && payload !== null && field in payload
    ? (payload as Record<string, unknown>)[field]
    : null
}

function readRetryAfterSeconds(response: Response, payload: unknown): number | null {
  const payloadDelay = payloadField(payload, 'retryAfterSeconds')
  const headerDelay = response.headers.get('Retry-After')
  const parsedDelay = typeof payloadDelay === 'number' ? payloadDelay : Number(headerDelay)
  return Number.isFinite(parsedDelay) && parsedDelay > 0 ? Math.min(60, Math.max(5, Math.ceil(parsedDelay))) : null
}

export async function extractInvoice(imageFile: File): Promise<InvoiceExtractionResponse> {
  const body = new FormData()
  body.append('image', imageFile)
  const response = await fetch('/api/invoices/extract', { method: 'POST', body })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const rawMessage = payloadField(payload, 'message')
    const rawReferenceId = payloadField(payload, 'referenceId')
    const rawCode = payloadField(payload, 'code')
    const message = typeof rawMessage === 'string'
      ? rawMessage
      : 'Faktur belum berhasil diproses. Pastikan gambar terlihat jelas lalu coba kembali.'
    const referenceId = typeof rawReferenceId === 'string' ? rawReferenceId : null
    const code = typeof rawCode === 'string' ? rawCode : null
    const displayMessage = referenceId ? `${message} Kode laporan: ${referenceId}` : message
    throw new InvoiceApiError(displayMessage, response.status, code, readRetryAfterSeconds(response, payload), referenceId)
  }
  return invoiceSchema.parse(payload)
}
