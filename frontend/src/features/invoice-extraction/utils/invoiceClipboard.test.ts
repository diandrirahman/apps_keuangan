import { describe, expect, it } from 'vitest'
import type { InvoiceFormData } from '../types/invoice.types'
import { countInvoiceRows, formatInvoicesForExcel } from './invoiceClipboard'

function invoice(overrides: Partial<InvoiceFormData> = {}): InvoiceFormData {
  return {
    transactionType: 'expense',
    invoiceDate: '2026-08-19',
    supplierName: 'Salsabila',
    supplierAddress: 'Kubu Dalam',
    invoiceNumber: null,
    description: 'Tidak ikut dicopy',
    total: 1_127_000,
    items: [{ name: 'Keripik kentang', quantity: 23, unit: 'bks', unitPrice: 33_000, lineTotal: 759_000 }],
    ...overrides,
  }
}

describe('formatInvoicesForExcel', () => {
  it('menggabungkan faktur dan membuat satu baris per barang', () => {
    const result = formatInvoicesForExcel([
      invoice({ items: [
        { name: 'Barang A', quantity: 2, unit: 'pcs', unitPrice: 10_000, lineTotal: 20_000 },
        { name: 'Barang B', quantity: 1, unit: 'pcs', unitPrice: 5_000, lineTotal: 5_000 },
      ] }),
      invoice({ transactionType: 'income', supplierName: 'Toko Kedua', items: [
        { name: 'Barang C', quantity: 3, unit: null, unitPrice: 2_000, lineTotal: 6_000 },
      ] }),
    ])
    const rows = result.split('\n')

    expect(rows).toHaveLength(3)
    expect(rows[0]).toBe('2026-08-19\tUang Keluar\tSalsabila\t\tBarang A\t2\tpcs\t10000\t20000')
    expect(rows[2]).toContain('\tUang Masuk\tToko Kedua\t')
    expect(result).not.toContain('1127000')
    expect(result).not.toContain('Tidak ikut dicopy')
    expect(result).not.toContain('Kubu Dalam')
  })

  it('menghitung jumlah baris yang akan dicopy', () => {
    expect(countInvoiceRows([invoice(), invoice({ items: [] })])).toBe(2)
  })
})
