import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { AiExtractionError } from '../../providers/ai/gemini.provider.js'
import { InvoiceService, MultipleInvoicesError } from './invoice.service.js'

export class InvoiceController {
  constructor(private readonly invoiceService = new InvoiceService()) {}

  extract = async (request: Request, response: Response): Promise<void> => {
    if (!request.file) { response.status(400).json({ message: 'Pilih gambar faktur terlebih dahulu.' }); return }
    try {
      const invoice = await this.invoiceService.extractInvoice(request.file)
      response.json(invoice)
    } catch (error) {
      if (error instanceof MultipleInvoicesError) {
        response.status(422).json({ message: error.message })
        return
      }

      const referenceId = randomUUID()
      console.error('Invoice extraction failed', {
        referenceId,
        errorName: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        kind: error instanceof AiExtractionError ? error.kind : 'processing',
        attempts: error instanceof AiExtractionError ? error.attempts : undefined,
        retryAfterSeconds: error instanceof AiExtractionError ? error.retryAfterSeconds : undefined,
      })

      if (error instanceof AiExtractionError && error.kind === 'rate_limit') {
        const retryAfterSeconds = error.retryAfterSeconds ?? 30
        response.setHeader('Retry-After', String(retryAfterSeconds))
        response.status(429).json({
          code: 'RATE_LIMIT',
          message: 'Batas request AI sementara tercapai. Proses akan dilanjutkan otomatis.',
          retryAfterSeconds,
          referenceId,
        })
        return
      }

      const temporarilyUnavailable = error instanceof AiExtractionError &&
        ['timeout', 'upstream'].includes(error.kind)
      response.status(temporarilyUnavailable ? 503 : 502).json({
        message: temporarilyUnavailable
          ? 'Layanan AI sedang sibuk. Silakan coba kembali beberapa saat lagi.'
          : 'Faktur belum berhasil diproses. Silakan coba kembali.',
        referenceId,
      })
    }
  }
}
