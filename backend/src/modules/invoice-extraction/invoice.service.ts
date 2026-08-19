import { GeminiProvider } from '../../providers/ai/gemini.provider.js'
import { invoiceExtractionPrompt } from './invoice.prompt.js'
import { invoiceAiResponseSchema, invoiceSchema, type InvoiceExtraction } from './invoice.schema.js'

const MINIMUM_CONFIDENCE = 0.7

export class MultipleInvoicesError extends Error {
  constructor() {
    super('Terdapat lebih dari satu faktur dalam gambar. Ambil atau potong gambar agar hanya berisi satu faktur.')
    this.name = 'MultipleInvoicesError'
  }
}

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

function hasEvidence(evidence: string[], transcription: string[]): boolean {
  if (evidence.length === 0) return false
  const normalizedTranscript = normalizeEvidence(transcription.join(' '))
  return evidence.every((item) => normalizedTranscript.includes(normalizeEvidence(item)))
}

export class InvoiceService {
  constructor(private readonly geminiProvider = new GeminiProvider()) {}

  async extractInvoice(image: Express.Multer.File): Promise<InvoiceExtraction> {
    const aiResponse = await this.geminiProvider.extractJson(invoiceExtractionPrompt, image.buffer, image.mimetype)
    const extracted = invoiceAiResponseSchema.parse(aiResponse)

    if (extracted.documentCount > 1) throw new MultipleInvoicesError()

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

    const supplierAddressHasEvidence = hasTextEvidence(
      extracted.supplierAddress,
      extracted.supplierAddressEvidence,
      extracted.transcription,
    )

    const invoiceDateIsValid =
      extracted.invoiceDate !== null &&
      extracted.confidence.invoiceDate >= MINIMUM_CONFIDENCE &&
      hasEvidence(extracted.invoiceDateEvidence, extracted.transcription)

    const descriptionIsValid =
      extracted.description !== null &&
      extracted.confidence.description >= MINIMUM_CONFIDENCE &&
      hasEvidence(extracted.descriptionEvidence, extracted.transcription)

    const totalIsValid =
      extracted.total !== null &&
      extracted.confidence.total >= MINIMUM_CONFIDENCE &&
      hasTextEvidence(String(extracted.total), extracted.totalEvidence, extracted.transcription)

    const supplierIsValid =
      supplierHasEvidence && extracted.confidence.supplierName >= MINIMUM_CONFIDENCE

    const supplierAddressIsValid =
      supplierAddressHasEvidence && extracted.confidence.supplierAddress >= MINIMUM_CONFIDENCE

    const invoiceNumberIsValid =
      extracted.invoiceNumber === null ||
      (invoiceNumberHasEvidence && extracted.confidence.invoiceNumber >= MINIMUM_CONFIDENCE)

    const warnings: string[] = []
    if (!supplierIsValid) warnings.push('Nama supplier belum dapat dipastikan dari teks faktur.')
    if (extracted.invoiceDate !== null && !invoiceDateIsValid) warnings.push('Tanggal perlu diperiksa kembali.')
    if (!invoiceNumberIsValid) warnings.push('Nomor faktur perlu diperiksa kembali.')
    if (!descriptionIsValid) warnings.push('Keterangan barang perlu diperiksa kembali.')
    if (!totalIsValid) warnings.push('Total perlu diperiksa kembali.')

    return invoiceSchema.parse({
      documentType: extracted.documentType,
      invoiceDate: invoiceDateIsValid ? extracted.invoiceDate : null,
      supplierName: supplierIsValid ? extracted.supplierName : null,
      supplierAddress: supplierAddressIsValid ? extracted.supplierAddress : null,
      invoiceNumber: invoiceNumberIsValid ? extracted.invoiceNumber : null,
      description: descriptionIsValid ? extracted.description : null,
      total: totalIsValid ? extracted.total : null,
      confidence: extracted.confidence,
      reviewRequired: warnings.length > 0,
      warnings,
    })
  }
}
