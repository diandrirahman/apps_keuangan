import type { InvoiceFormData } from '../types/invoice.types'

export function formatInvoiceForExcel(invoice: InvoiceFormData): string {
  const rows = invoice.items.length > 0 ? invoice.items : [{ name: '', quantity: null, unit: null, unitPrice: null, lineTotal: null }]

  return rows.map((item) => [
    invoice.invoiceDate ?? '',
    invoice.supplierName ?? '',
    invoice.invoiceNumber ?? '',
    item.name,
    item.quantity ?? '',
    item.unit ?? '',
    item.unitPrice ?? '',
    item.lineTotal ?? '',
    invoice.total ?? '',
  ].join('\t')).join('\n')
}

export async function copyInvoiceToClipboard(invoice: InvoiceFormData): Promise<void> {
  await navigator.clipboard.writeText(formatInvoiceForExcel(invoice))
}
