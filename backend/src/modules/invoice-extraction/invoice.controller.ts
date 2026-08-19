import type { Request, Response } from 'express'
import { InvoiceService, MultipleInvoicesError } from './invoice.service.js'

export class InvoiceController {
  constructor(private readonly invoiceService = new InvoiceService()) {}

  extract = async (request: Request, response: Response): Promise<void> => {
    if (!request.file) { response.status(400).json({ message: 'Pilih gambar faktur terlebih dahulu.' }); return }
    try {
      const invoice = await this.invoiceService.extractInvoice(request.file)
      response.json(invoice)
    } catch (error) {
      console.error('Invoice extraction failed', error)
      if (error instanceof MultipleInvoicesError) {
        response.status(422).json({ message: error.message })
        return
      }
      response.status(502).json({ message: 'Faktur belum berhasil diproses. Silakan coba kembali.' })
    }
  }
}
