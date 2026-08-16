import type { InvoiceFormData } from '../types/invoice.types'

export function formatInvoiceForExcel(invoice: InvoiceFormData): string {
  return [invoice.invoiceDate ?? '', invoice.supplierName ?? '', invoice.invoiceNumber ?? '', invoice.description ?? '', invoice.total ?? ''].join('\t')
}

export async function copyInvoiceToClipboard(invoice: InvoiceFormData): Promise<void> {
  await navigator.clipboard.writeText(formatInvoiceForExcel(invoice))
}
