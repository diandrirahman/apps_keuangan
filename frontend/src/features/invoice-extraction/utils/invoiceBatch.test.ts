import { describe, expect, it } from 'vitest'
import type { BatchInvoice } from '../types/invoice.types'
import { MAX_IMAGE_SIZE, countBatchStatuses, requestPacingDelay, validateInvoiceFiles } from './invoiceBatch'

function fakeFile(name: string, options: { type?: string; size?: number; lastModified?: number } = {}): File {
  return {
    name,
    type: options.type ?? 'image/jpeg',
    size: options.size ?? 1_024,
    lastModified: options.lastModified ?? 1,
  } as File
}

describe('validateInvoiceFiles', () => {
  it('menerima maksimal 10 gambar yang valid', () => {
    const files = Array.from({ length: 11 }, (_, index) => fakeFile(`faktur-${index}.jpg`))
    const result = validateInvoiceFiles(files)

    expect(result.accepted).toHaveLength(10)
    expect(result.message).toContain('1 file melewati batas maksimal 10 faktur')
  })

  it('menolak format, ukuran, dan file duplikat', () => {
    const existing = fakeFile('sama.jpg')
    const result = validateInvoiceFiles([
      fakeFile('dokumen.pdf', { type: 'application/pdf' }),
      fakeFile('besar.jpg', { size: MAX_IMAGE_SIZE + 1 }),
      fakeFile('sama.jpg'),
      fakeFile('valid.png', { type: 'image/png' }),
    ], [existing])

    expect(result.accepted.map((file) => file.name)).toEqual(['valid.png'])
    expect(result.message).toContain('format yang tidak didukung')
    expect(result.message).toContain('melebihi 10 MB')
    expect(result.message).toContain('file duplikat dilewati')
  })
})

describe('countBatchStatuses', () => {
  it('merangkum seluruh status antrean', () => {
    const items = ['waiting', 'processing', 'cooldown', 'review', 'reviewed', 'error', 'reviewed']
      .map((status) => ({ status }) as BatchInvoice)

    expect(countBatchStatuses(items)).toEqual({
      waiting: 1,
      processing: 1,
      cooldown: 1,
      review: 1,
      reviewed: 2,
      error: 1,
    })
  })
})

describe('requestPacingDelay', () => {
  it('menjaga jarak enam detik sejak request terakhir', () => {
    expect(requestPacingDelay(10_000, 12_500)).toBe(3_500)
    expect(requestPacingDelay(10_000, 16_000)).toBe(0)
    expect(requestPacingDelay(0, 1_000)).toBe(0)
  })
})
