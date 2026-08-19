import { GeminiProvider } from '../../providers/ai/gemini.provider.js'
import { invoiceExtractionPrompt } from './invoice.prompt.js'
import { invoiceAiResponseSchema, invoiceSchema, type InvoiceExtraction } from './invoice.schema.js'

const MINIMUM_SUPPLIER_CONFIDENCE = 0.7

function normalizeEvidence(value: string): string {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]/g, '')
}

function hasTextEvidence(value: string | null, evidence: string[], transcription: string[]): boolean {
  if (!value || evidence.length === 0) return false

  const normalizedValue = normalizeEvidence(value)
  const normalizedTranscript = normalizeEvidence(transcription.join(' '))
  const evidenceContainsValue = evidence.some((item) => normalizeEvidence(item).includes(normalizedValue))
  const evidenceExistsInTranscript = evidence.every((item) => normalizedTranscript.includes(normalizeEvidence(item)))

  return normalizedValue.length > 0 && evidenceContainsValue && evidenceExistsInTranscript
}

export class InvoiceService {
  constructor(private readonly geminiProvider = new GeminiProvider()) {}

  async extractInvoice(image: Express.Multer.File): Promise<InvoiceExtraction> {
    const aiResponse = await this.geminiProvider.extractJson(invoiceExtractionPrompt, image.buffer, image.mimetype)
    const extracted = invoiceAiResponseSchema.parse(aiResponse)

    const supplierHasEvidence = hasTextEvidence(
      extracted.supplierName,
      extracted.supplierEvidence,
      extracted.transcription,
    )

    const invoiceNumberHasEvidence = hasTextEvidence(
      extracted.invoiceNumber,
      extracted.invoiceNumberEvidence,
      extracted.transcription,
    )

    return invoiceSchema.parse({
      invoiceDate: extracted.invoiceDate,
      supplierName:
        supplierHasEvidence && extracted.supplierConfidence >= MINIMUM_SUPPLIER_CONFIDENCE
          ? extracted.supplierName
          : null,
      invoiceNumber: invoiceNumberHasEvidence ? extracted.invoiceNumber : null,
      description: extracted.description,
      total: extracted.total,
    })
  }
}
