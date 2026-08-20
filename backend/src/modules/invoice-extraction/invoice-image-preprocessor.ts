import sharp from 'sharp'

export type InvoiceImageView = {
  label: string
  buffer: Buffer
  mimeType: 'image/jpeg'
}

export type PreparedInvoiceImages = {
  views: InvoiceImageView[]
  sourceWidth: number
  sourceHeight: number
  qualityNotes: string[]
}

const TARGET_WIDTH = 1_200
const MAX_WIDTH = 1_600

function resizeWidth(width: number): number {
  if (width < TARGET_WIDTH) return TARGET_WIDTH
  return Math.min(width, MAX_WIDTH)
}

export async function prepareInvoiceImages(input: Buffer): Promise<PreparedInvoiceImages> {
  // Apply EXIF orientation once, then use the normalized buffer for every view.
  const normalized = await sharp(input).rotate().toBuffer()
  const metadata = await sharp(normalized).metadata()
  const sourceWidth = metadata.width ?? 0
  const sourceHeight = metadata.height ?? 0

  if (sourceWidth === 0 || sourceHeight === 0) {
    throw new Error('Dimensi gambar faktur tidak dapat dibaca.')
  }

  const width = resizeWidth(sourceWidth)
  const commonPipeline = () => sharp(normalized)
    .resize({ width, withoutEnlargement: false, kernel: sharp.kernel.lanczos3 })

  const color = await commonPipeline()
    .normalize()
    .sharpen({ sigma: 0.9 })
    .jpeg({ quality: 86, chromaSubsampling: '4:4:4' })
    .toBuffer()

  const monochrome = await commonPipeline()
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.2 })
    .jpeg({ quality: 90 })
    .toBuffer()

  const enhancedMetadata = await sharp(color).metadata()
  const enhancedWidth = enhancedMetadata.width ?? width
  const enhancedHeight = enhancedMetadata.height ?? Math.round(sourceHeight * (width / sourceWidth))
  const tableTop = Math.max(0, Math.round(enhancedHeight * 0.22))
  const tableHeight = Math.max(1, Math.min(enhancedHeight - tableTop, Math.round(enhancedHeight * 0.7)))

  const table = await sharp(monochrome)
    .extract({ left: 0, top: tableTop, width: enhancedWidth, height: tableHeight })
    .jpeg({ quality: 88 })
    .toBuffer()

  const qualityNotes: string[] = []
  if (sourceWidth < 1_000 || sourceHeight < 1_000) {
    qualityNotes.push(`Resolusi sumber rendah (${sourceWidth}x${sourceHeight}); gunakan crop untuk memeriksa tulisan kecil.`)
  }

  return {
    sourceWidth,
    sourceHeight,
    qualityNotes,
    views: [
      { label: 'Tampilan penuh berwarna yang telah ditingkatkan', buffer: color, mimeType: 'image/jpeg' },
      { label: 'Crop tabel untuk nama barang, kuantitas, harga, dan jumlah', buffer: table, mimeType: 'image/jpeg' },
    ],
  }
}
