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
  const normalizedCombinedEvidence = normalizeEvidence(evidence.join(' '))
  const evidenceContainsValue = normalizedCombinedEvidence.includes(normalizedValue)
  const evidenceExistsInTranscript = evidence.every((item) => normalizedTranscript.includes(normalizeEvidence(item)))

  return normalizedValue.length > 0 && evidenceContainsValue && evidenceExistsInTranscript
}

function hasEvidence(evidence: string[], transcription: string[]): boolean {
  if (evidence.length === 0) return false
  const normalizedTranscript = normalizeEvidence(transcription.join(' '))
  return evidence.every((item) => normalizedTranscript.includes(normalizeEvidence(item)))
}

function validateItems(extracted: ReturnType<typeof invoiceAiResponseSchema.parse>, warnings: string[]) {
  return extracted.items.flatMap((item, index) => {
    const nameIsValid =
      item.confidence.name >= MINIMUM_CONFIDENCE &&
      hasTextEvidence(item.name, item.evidence.name, extracted.transcription)

    if (!nameIsValid) {
      warnings.push(`Nama barang pada baris ${index + 1} belum dapat dipastikan.`)
      return []
    }

    const quantityIsValid = item.quantity !== null &&
      item.confidence.quantity >= MINIMUM_CONFIDENCE &&
      hasTextEvidence(String(item.quantity), item.evidence.quantity, extracted.transcription)
    const unitIsValid = item.unit !== null &&
      item.confidence.unit >= MINIMUM_CONFIDENCE &&
      hasTextEvidence(item.unit, item.evidence.unit, extracted.transcription)
    const unitPriceIsValid = item.unitPrice !== null &&
      item.confidence.unitPrice >= MINIMUM_CONFIDENCE &&
      hasTextEvidence(String(item.unitPrice), item.evidence.unitPrice, extracted.transcription)
    const lineTotalIsValid = item.lineTotal !== null &&
      item.confidence.lineTotal >= MINIMUM_CONFIDENCE &&
      hasTextEvidence(String(item.lineTotal), item.evidence.lineTotal, extracted.transcription)

    if (!quantityIsValid || !unitPriceIsValid || !lineTotalIsValid) {
      warnings.push(`Jumlah atau harga barang pada baris ${index + 1} perlu diperiksa kembali.`)
    }

    const quantity = quantityIsValid ? item.quantity : null
    const unitPrice = unitPriceIsValid ? item.unitPrice : null
    const lineTotal = lineTotalIsValid ? item.lineTotal : null
    const calculatedLineTotal = quantity !== null && unitPrice !== null ? quantity * unitPrice : null
    const isCalculationValid = calculatedLineTotal !== null && lineTotal !== null
      ? calculatedLineTotal === lineTotal
      : null

    if (isCalculationValid === false) {
      warnings.push(`Perhitungan barang pada baris ${index + 1} tidak sesuai dengan jumlah tertulis.`)
    }

    return [{
      name: item.name,
      quantity,
      unit: unitIsValid ? item.unit : null,
      unitPrice,
      lineTotal,
      calculatedLineTotal,
      isCalculationValid,
      confidence: item.confidence,
    }]
  })
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
    const items = validateItems(extracted, warnings)
    if (!supplierIsValid) warnings.push('Nama supplier belum dapat dipastikan dari teks faktur.')
    if (extracted.invoiceDate !== null && !invoiceDateIsValid) warnings.push('Tanggal perlu diperiksa kembali.')
    if (!invoiceNumberIsValid) warnings.push('Nomor faktur perlu diperiksa kembali.')
    if (items.length === 0 && !descriptionIsValid) warnings.push('Keterangan barang perlu diperiksa kembali.')
    if (!totalIsValid) warnings.push('Total perlu diperiksa kembali.')

    const itemLineTotals = items.map((item) => item.lineTotal)
    const allItemsHaveLineTotal = items.length > 0 && itemLineTotals.every((value) => value !== null)
    const calculatedItemsTotal = allItemsHaveLineTotal
      ? itemLineTotals.reduce<number>((sum, value) => sum + (value ?? 0), 0)
      : null

    if (calculatedItemsTotal !== null && extracted.total !== null && calculatedItemsTotal !== extracted.total) {
      warnings.push('Jumlah seluruh item berbeda dari total faktur. Periksa kemungkinan diskon, pajak, atau kesalahan hitung.')
    }

    return invoiceSchema.parse({
      documentType: extracted.documentType,
      invoiceDate: invoiceDateIsValid ? extracted.invoiceDate : null,
      supplierName: supplierIsValid ? extracted.supplierName : null,
      supplierAddress: supplierAddressIsValid ? extracted.supplierAddress : null,
      invoiceNumber: invoiceNumberIsValid ? extracted.invoiceNumber : null,
      description: items.length > 0 ? items.map((item) => item.name).join(', ') : descriptionIsValid ? extracted.description : null,
      items,
      total: totalIsValid ? extracted.total : null,
      confidence: {
        invoiceDate: extracted.invoiceDate === null || invoiceDateIsValid ? extracted.confidence.invoiceDate : 0,
        supplierName: supplierIsValid ? extracted.confidence.supplierName : 0,
        supplierAddress: extracted.supplierAddress === null || supplierAddressIsValid ? extracted.confidence.supplierAddress : 0,
        invoiceNumber: invoiceNumberIsValid ? extracted.confidence.invoiceNumber : 0,
        description: items.length > 0 || descriptionIsValid ? extracted.confidence.description : 0,
        total: totalIsValid ? extracted.confidence.total : 0,
      },
      reviewRequired: warnings.length > 0,
      warnings,
    })
  }
}
