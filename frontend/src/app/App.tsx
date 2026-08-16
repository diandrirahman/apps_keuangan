import { InvoiceErrorState } from '../features/invoice-extraction/components/InvoiceErrorState'
import { InvoicePreview } from '../features/invoice-extraction/components/InvoicePreview'
import { InvoiceProcessing } from '../features/invoice-extraction/components/InvoiceProcessing'
import { InvoiceResultForm } from '../features/invoice-extraction/components/InvoiceResultForm'
import { InvoiceUploader } from '../features/invoice-extraction/components/InvoiceUploader'
import { useInvoiceExtraction } from '../features/invoice-extraction/hooks/useInvoiceExtraction'

export function App() {
  const invoice = useInvoiceExtraction()
  const [cameraOpen, setCameraOpen] = useState(false)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest text-teal-700">PROTOTYPE</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Faktur ke Excel</h1>
        </header>
        {invoice.status === 'idle' && <InvoiceUploader onSelect={invoice.selectFile} onOpenCamera={() => setCameraOpen(true)} error={invoice.fileError} />}
        {invoice.status === 'preview' && invoice.previewUrl && invoice.file && <InvoicePreview file={invoice.file} previewUrl={invoice.previewUrl} onChange={invoice.selectFile} onProcess={invoice.processInvoice} />}
        {invoice.status === 'processing' && <InvoiceProcessing />}
        {invoice.status === 'success' && invoice.result && <InvoiceResultForm initialValues={invoice.result} onReset={invoice.reset} />}
        {invoice.status === 'error' && <InvoiceErrorState message={invoice.errorMessage} onRetry={invoice.retry} onChange={invoice.reset} />}
      </div>
      {cameraOpen && <InvoiceCamera onCapture={(file) => { setCameraOpen(false); invoice.selectFile(file) }} onClose={() => setCameraOpen(false)} />}
    </main>
  )
}
import { useState } from 'react'
import { InvoiceCamera } from '../features/invoice-extraction/components/InvoiceCamera'
