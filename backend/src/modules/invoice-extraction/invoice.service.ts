import { GeminiProvider } from '../../providers/ai/gemini.provider.js'
import { prepareInvoiceImages } from './invoice-image-preprocessor.js'
import { invoiceExtractionPrompt } from './invoice.prompt.js'
import { invoiceAiResponseSchema, invoiceSchema, type InvoiceExtraction } from './invoice.schema.js'

const MINIMUM_CONFIDENCE = 0.7
const UNIT_REVIEW_GUIDANCE: Record<string, string> = {
  dz: 'kemungkinan berarti dozen/lusin (12 buah)',
  doz: 'kemungkinan berarti dozen/lusin (12 buah)',
  dozen: 'berarti dozen/lusin (12 buah)',
}

export class MultipleInvoicesError extends Error {
  constructor() {
    super('Terdapat lebih dari satu faktur dalam gambar. Ambil atau potong gambar agar hanya berisi satu faktur.')
    this.name = 'MultipleInvoicesError'
  }
}

function normalizeEvidence(value: string): string {
  return value
    .replaceAll('¼', '1/4')
    .replaceAll('½', '1/2')
    .replaceAll('¾', '3/4')
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

function hasNumericEvidence(value: number | null, evidence: string[], transcription: string[]): boolean {
  if (value === null || evidence.length === 0 || !hasEvidence(evidence, transcription)) return false
  if (hasTextEvidence(String(value), evidence, transcription)) return true

  const whole = Math.trunc(value)
  const fractionalPart = value - whole
  const evidenceText = evidence.join(' ').toLocaleLowerCase('id-ID')
  const unicodeFractions: Array<[number, string]> = [
    [0.25, '¼'],
    [0.5, '½'],
    [0.75, '¾'],
  ]

  for (const [fraction, symbol] of unicodeFractions) {
    if (Math.abs(fractionalPart - fraction) < 0.000_001) {
      const numerator = fraction === 0.25 ? 1 : fraction === 0.5 ? 1 : 3
      const denominator = fraction === 0.25 ? 4 : fraction === 0.5 ? 2 : 4
      const mixedFractionPattern = new RegExp(`(^|\\D)${whole}\\s*(?:${numerator}\\s*\\/\\s*${denominator}|${symbol})(?=\\D|$)`)
      return mixedFractionPattern.test(evidenceText)
    }
  }

  return false
}

function validateItems(
  extracted: ReturnType<typeof invoiceAiResponseSchema.parse>,
  warnings: string[],
  sourceQualityConcern: boolean,
) {
  return extracted.items.flatMap((item, index) => {
    const nameHasEvidence = hasTextEvidence(item.name, item.evidence.name, extracted.transcription)
    const nameIsValid =
      item.confidence.name >= MINIMUM_CONFIDENCE &&
      nameHasEvidence

    const normalizedName = normalizeEvidence(item.name)
    const usableReadings = item.nameReadings
      .map((reading) => reading.value)
      .filter((value): value is string => value !== null)
      .map(normalizeEvidence)
      .filter(Boolean)
    const readingsAgree = usableReadings.length >= 2 &&
      usableReadings.every((reading) => reading === normalizedName)
    const distinctNameAlternatives = item.nameAlternatives.filter(
      (alternative) => normalizeEvidence(alternative) !== normalizedName,
    )
    const reviewNotes: string[] = []

    if (!nameIsValid) reviewNotes.push('Nama barang belum memiliki bukti teks yang cukup kuat.')
    if (item.nameLegibility !== 'clear') reviewNotes.push('Tulisan nama barang dinilai tidak cukup jelas oleh AI.')
    if (distinctNameAlternatives.length > 0) reviewNotes.push(`Kandidat pembacaan lain: ${distinctNameAlternatives.join(', ')}.`)
    if (!readingsAgree) {
      reviewNotes.push('Pembacaan nama barang dari tampilan penuh dan crop tabel belum konsisten.')
    }
    if (sourceQualityConcern && item.nameLegibility !== 'clear') {
      reviewNotes.push('Nama barang berasal dari tulisan tangan pada gambar beresolusi rendah.')
    }

    const needsNameReview = reviewNotes.length > 0
    if (needsNameReview) warnings.push(`Nama barang pada baris ${index + 1} perlu diperiksa kembali.`)

    const effectiveNameConfidence = needsNameReview
      ? Math.min(item.confidence.name, item.nameLegibility === 'unreadable' ? 0.39 : 0.69)
      : item.confidence.name

    const quantityIsValid = item.quantity !== null &&
      item.confidence.quantity >= MINIMUM_CONFIDENCE &&
      hasNumericEvidence(item.quantity, item.evidence.quantity, extracted.transcription)
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
      reviewNotes.push('Jumlah, harga satuan, atau jumlah item belum terbaca dengan cukup yakin.')
    }

    const quantity = quantityIsValid ? item.quantity : null
    const unitPrice = unitPriceIsValid ? item.unitPrice : null
    const lineTotal = lineTotalIsValid ? item.lineTotal : null
    const unit = unitIsValid ? item.unit : null
    const calculatedLineTotal = quantity !== null && unitPrice !== null ? quantity * unitPrice : null
    const isCalculationValid = calculatedLineTotal !== null && lineTotal !== null
      ? calculatedLineTotal === lineTotal
      : null

    if (isCalculationValid === false) {
      warnings.push(`Perhitungan barang pada baris ${index + 1} tidak sesuai dengan jumlah tertulis.`)
    }

    if (unit) {
      const unitGuidance = UNIT_REVIEW_GUIDANCE[unit.trim().toLocaleLowerCase('id-ID')]
      if (unitGuidance) {
        warnings.push(`Satuan "${unit}" pada baris ${index + 1} ${unitGuidance}. Pastikan satuan ini sesuai dengan faktur.`)
        reviewNotes.push(`Satuan "${unit}" ${unitGuidance}; pastikan satuan ini benar.`)
      }
    }

    return [{
      name: item.name,
      quantity,
      unit,
      unitPrice,
      lineTotal,
      calculatedLineTotal,
      isCalculationValid,
      confidence: { ...item.confidence, name: effectiveNameConfidence },
      needsReview: reviewNotes.length > 0 || isCalculationValid === false,
      reviewNotes,
      nameAlternatives: distinctNameAlternatives,
    }]
  })
}

export class InvoiceService {
  constructor(private readonly geminiProvider = new GeminiProvider()) {}

  async extractInvoice(image: Express.Multer.File): Promise<InvoiceExtraction> {
    const prepared = await prepareInvoiceImages(image.buffer)
    const qualityContext = prepared.qualityNotes.length > 0
      ? `\nCatatan kualitas gambar: ${prepared.qualityNotes.join(' ')}`
      : ''
    const extracted = await this.geminiProvider.extractJson(
      `${invoiceExtractionPrompt}${qualityContext}`,
      prepared.views,
      (value) => invoiceAiResponseSchema.parse(value),
    )

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
    const items = validateItems(extracted, warnings, prepared.qualityNotes.length > 0)
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

    const consolidatedWarnings = warnings.length > 0
      ? ['Beberapa data belum dapat dipastikan. Periksa kembali kolom yang ditandai sebelum menyalin ke Excel.']
      : []

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
      reviewRequired: consolidatedWarnings.length > 0,
      warnings: consolidatedWarnings,
    })
  }
}
