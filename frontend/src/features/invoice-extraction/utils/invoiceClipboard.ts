import type { InvoiceFormData } from '../types/invoice.types'

export function formatInvoiceForExcel(invoice: InvoiceFormData): string {
  const rows = invoice.items.length > 0 ? invoice.items : [{ name: '', quantity: null, unit: null, unitPrice: null, lineTotal: null }]

  return rows.map((item) => [
    invoice.invoiceDate ?? '',
    invoice.transactionType === 'income' ? 'Uang Masuk' : 'Uang Keluar',
    invoice.supplierName ?? '',
    invoice.invoiceNumber ?? '',
    item.name,
    item.quantity ?? '',
    item.unit ?? '',
    item.unitPrice ?? '',
    item.lineTotal ?? '',
  ].join('\t')).join('\n')
}

export function formatInvoicesForExcel(invoices: InvoiceFormData[]): string {
  return invoices.map(formatInvoiceForExcel).filter(Boolean).join('\n')
}

export function countInvoiceRows(invoices: InvoiceFormData[]): number {
  return invoices.reduce((total, invoice) => total + Math.max(invoice.items.length, 1), 0)
}

export async function copyInvoiceToClipboard(invoice: InvoiceFormData): Promise<void> {
  await navigator.clipboard.writeText(formatInvoiceForExcel(invoice))
}

export async function copyInvoicesToClipboard(invoices: InvoiceFormData[]): Promise<void> {
  await navigator.clipboard.writeText(formatInvoicesForExcel(invoices))
}
