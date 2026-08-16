import { GeminiProvider } from '../../providers/ai/gemini.provider.js'
import { invoiceExtractionPrompt } from './invoice.prompt.js'
import { invoiceSchema, type InvoiceExtraction } from './invoice.schema.js'

export class InvoiceService {
  constructor(private readonly geminiProvider = new GeminiProvider()) {}

  async extractInvoice(image: Express.Multer.File): Promise<InvoiceExtraction> {
    const aiResponse = await this.geminiProvider.extractJson(invoiceExtractionPrompt, image.buffer, image.mimetype)
    return invoiceSchema.parse(aiResponse)
  }
}
