import { useEffect, useState } from 'react'
import { extractInvoice } from '../services/invoice.api'
import type { InvoiceExtractionResponse } from '../types/invoice.types'

type ExtractionStatus = 'idle' | 'preview' | 'processing' | 'success' | 'error'
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']

export function useInvoiceExtraction() {
  const [status, setStatus] = useState<ExtractionStatus>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<InvoiceExtractionResponse | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const selectFile = (selectedFile: File) => {
    if (!acceptedTypes.includes(selectedFile.type)) { setFileError('Gunakan gambar JPG, JPEG, PNG, atau WEBP.'); return }
    if (selectedFile.size > 10 * 1024 * 1024) { setFileError('Ukuran gambar maksimal 10 MB.'); return }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFileError(null); setFile(selectedFile); setPreviewUrl(URL.createObjectURL(selectedFile)); setStatus('preview')
  }

  const processInvoice = async () => {
    if (!file) return
    setStatus('processing')
    try { setResult(await extractInvoice(file)); setStatus('success') }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Faktur belum berhasil diproses.'); setStatus('error') }
  }

  const reset = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setStatus('idle'); setFile(null); setPreviewUrl(null); setResult(null); setFileError(null); setErrorMessage('') }
  return { status, file, previewUrl, result, fileError, errorMessage, selectFile, processInvoice, retry: processInvoice, reset }
}
