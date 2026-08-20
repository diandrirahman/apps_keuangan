import { useState } from 'react'
import { InvoiceBatchSelection } from '../features/invoice-extraction/components/InvoiceBatchSelection'
import { InvoiceBatchWorkspace } from '../features/invoice-extraction/components/InvoiceBatchWorkspace'
import { InvoiceCamera } from '../features/invoice-extraction/components/InvoiceCamera'
import { InvoiceErrorState } from '../features/invoice-extraction/components/InvoiceErrorState'
import { InvoicePreview } from '../features/invoice-extraction/components/InvoicePreview'
import { InvoiceProcessing } from '../features/invoice-extraction/components/InvoiceProcessing'
import { InvoiceResultForm } from '../features/invoice-extraction/components/InvoiceResultForm'
import { InvoiceUploader } from '../features/invoice-extraction/components/InvoiceUploader'
import { useInvoiceBatch } from '../features/invoice-extraction/hooks/useInvoiceBatch'

export function App() {
  const batch = useInvoiceBatch()
  const [cameraOpen, setCameraOpen] = useState(false)
  const singleItem = !batch.isBatchMode ? batch.items[0] : null

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest text-teal-700">PROTOTYPE</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Faktur ke Excel</h1>
        </header>

        {batch.items.length === 0 && <InvoiceUploader onSelect={batch.addFiles} onOpenCamera={() => setCameraOpen(true)} error={batch.fileMessage} />}

        {singleItem && singleItem.status === 'waiting' && <InvoicePreview
          file={singleItem.file}
          previewUrl={singleItem.previewUrl}
          qualityWarning={singleItem.qualityWarning}
          message={batch.fileMessage}
          onChange={(file) => batch.replaceFile(singleItem.id, file)}
          onAdd={batch.addFiles}
          onOpenCamera={() => setCameraOpen(true)}
          onProcess={batch.processAll}
        />}

        {batch.isBatchMode && !batch.hasStarted && <InvoiceBatchSelection
          items={batch.items}
          activeId={batch.activeId}
          message={batch.fileMessage}
          onSelect={batch.selectItem}
          onAdd={batch.addFiles}
          onOpenCamera={() => setCameraOpen(true)}
          onReplace={batch.replaceFile}
          onRemove={batch.removeItem}
          onProcess={batch.processAll}
        />}

        {singleItem && (singleItem.status === 'processing' || singleItem.status === 'cooldown') && <InvoiceProcessing cooldownSeconds={batch.cooldownSeconds} />}

        {singleItem && singleItem.status === 'error' && <InvoiceErrorState
          message={singleItem.errorMessage ?? ''}
          onRetry={() => batch.retryItem(singleItem.id)}
          onChange={batch.reset}
        />}

        {singleItem?.result && (singleItem.status === 'review' || singleItem.status === 'reviewed') && <InvoiceResultForm
          initialValues={singleItem.result}
          defaultValues={singleItem.draft}
          onReset={batch.reset}
        />}

        {batch.isBatchMode && batch.hasStarted && <InvoiceBatchWorkspace
          items={batch.items}
          activeItem={batch.activeItem}
          counts={batch.counts}
          isProcessing={batch.isProcessing}
          cooldownSeconds={batch.cooldownSeconds}
          canCopyAll={batch.canCopyAll}
          reviewedInvoices={batch.reviewedInvoices}
          onSelect={batch.selectItem}
          onRetry={batch.retryItem}
          onRemove={batch.removeItem}
          onSaveDraft={batch.saveDraft}
          onMarkReviewed={batch.markReviewed}
          onReset={batch.reset}
        />}
      </div>

      {cameraOpen && <InvoiceCamera
        onCapture={(file) => {
          setCameraOpen(false)
          batch.addFiles([file])
        }}
        onClose={() => setCameraOpen(false)}
      />}
    </main>
  )
}
