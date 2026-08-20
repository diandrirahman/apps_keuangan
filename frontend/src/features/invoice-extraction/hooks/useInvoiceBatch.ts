import { useEffect, useMemo, useRef, useState } from 'react'
import { extractInvoice, InvoiceApiError } from '../services/invoice.api'
import type { BatchInvoice, InvoiceFormData, InvoiceFormInput } from '../types/invoice.types'
import { countBatchStatuses, requestPacingDelay, validateInvoiceFiles } from '../utils/invoiceBatch'

const DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS = 30

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function createLocalId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function createDraft(result: NonNullable<BatchInvoice['result']>): InvoiceFormInput {
  return {
    transactionType: 'expense',
    invoiceDate: result.invoiceDate,
    supplierName: result.supplierName,
    supplierAddress: result.supplierAddress,
    invoiceNumber: result.invoiceNumber,
    description: result.description,
    items: result.items.map(({ name, quantity, unit, unitPrice, lineTotal }) => ({
      name,
      quantity,
      unit,
      unitPrice,
      lineTotal,
    })),
    total: result.total ?? '',
  }
}

function getQualityWarning(previewUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve(image.naturalWidth < 1_000 || image.naturalHeight < 1_000
        ? `Resolusi foto ${image.naturalWidth}×${image.naturalHeight} tergolong rendah. Gunakan foto yang lebih dekat dan tajam bila hasil kurang tepat.`
        : null)
    }
    image.onerror = () => resolve(null)
    image.src = previewUrl
  })
}

function makeBatchInvoice(file: File): BatchInvoice {
  return {
    id: createLocalId(),
    file,
    previewUrl: URL.createObjectURL(file),
    qualityWarning: null,
    status: 'waiting',
    result: null,
    draft: null,
    reviewedInvoice: null,
    errorMessage: null,
  }
}

export function useInvoiceBatch() {
  const [items, setItems] = useState<BatchInvoice[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [fileMessage, setFileMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const processingRef = useRef(false)
  const lastRequestStartedAtRef = useRef(0)
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => () => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
  }, [])

  const updateQualityWarning = async (item: BatchInvoice) => {
    const qualityWarning = await getQualityWarning(item.previewUrl)
    setItems((current) => current.map((entry) => entry.id === item.id && entry.previewUrl === item.previewUrl
      ? { ...entry, qualityWarning }
      : entry))
  }

  const addFiles = (selectedFiles: File[]) => {
    if (isProcessing) return
    const validation = validateInvoiceFiles(selectedFiles, items.map((item) => item.file))
    const nextItems = validation.accepted.map(makeBatchInvoice)
    if (nextItems.length > 0) {
      if (items.length + nextItems.length > 1) setIsBatchMode(true)
      setItems((current) => [...current, ...nextItems])
      setActiveId((current) => current ?? nextItems[0].id)
      nextItems.forEach((item) => void updateQualityWarning(item))
    }
    setFileMessage(validation.message)
  }

  const replaceFile = (id: string, selectedFile: File) => {
    if (isProcessing) return
    const currentItem = items.find((item) => item.id === id)
    if (!currentItem) return
    const otherFiles = items.filter((item) => item.id !== id).map((item) => item.file)
    const validation = validateInvoiceFiles([selectedFile], otherFiles)
    if (validation.accepted.length === 0) {
      setFileMessage(validation.message)
      return
    }

    const replacement = makeBatchInvoice(validation.accepted[0])
    replacement.id = id
    URL.revokeObjectURL(currentItem.previewUrl)
    setItems((current) => current.map((item) => item.id === id ? replacement : item))
    setFileMessage(validation.message)
    void updateQualityWarning(replacement)
  }

  const removeItem = (id: string) => {
    if (isProcessing) return
    const removed = items.find((item) => item.id === id)
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    const remaining = items.filter((item) => item.id !== id)
    setItems(remaining)
    if (remaining.length === 0) setIsBatchMode(false)
    else if (!items.some((item) => item.status !== 'waiting')) setIsBatchMode(remaining.length > 1)
    if (activeId === id) setActiveId(remaining[0]?.id ?? null)
    setFileMessage(null)
  }

  const waitForRequestPacing = async () => {
    const remainingDelay = requestPacingDelay(lastRequestStartedAtRef.current, Date.now())
    if (remainingDelay > 0) await delay(remainingDelay)
    lastRequestStartedAtRef.current = Date.now()
  }

  const waitForRateLimitCooldown = async (seconds: number) => {
    for (let remaining = seconds; remaining > 0; remaining -= 1) {
      setCooldownSeconds(remaining)
      await delay(1_000)
    }
    setCooldownSeconds(0)
  }

  const processItem = async (item: BatchInvoice, allowAutomaticRateLimitRetry = true): Promise<void> => {
    setItems((current) => current.map((entry) => entry.id === item.id
      ? { ...entry, status: 'processing', errorMessage: null }
      : entry))
    await waitForRequestPacing()
    try {
      const result = await extractInvoice(item.file)
      setItems((current) => current.map((entry) => entry.id === item.id
        ? { ...entry, status: 'review', result, draft: createDraft(result), reviewedInvoice: null, errorMessage: null }
        : entry))
    } catch (error) {
      const rateLimitError = error instanceof InvoiceApiError && (error.status === 429 || error.code === 'RATE_LIMIT')
      if (rateLimitError && allowAutomaticRateLimitRetry) {
        const retryAfterSeconds = error.retryAfterSeconds ?? DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS
        setItems((current) => current.map((entry) => entry.id === item.id
          ? { ...entry, status: 'cooldown', errorMessage: null }
          : entry))
        await waitForRateLimitCooldown(retryAfterSeconds)
        await processItem(item, false)
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Faktur belum berhasil diproses.'
      setItems((current) => current.map((entry) => entry.id === item.id
        ? {
            ...entry,
            status: 'error',
            errorMessage: rateLimitError
              ? `${errorMessage} Batas masih penuh setelah percobaan otomatis; tunggu sebentar lalu pilih Coba Lagi.`
              : errorMessage,
          }
        : entry))
    }
  }

  const processAll = async () => {
    if (processingRef.current) return
    const pendingItems = items.filter((item) => item.status === 'waiting')
    if (pendingItems.length === 0) return
    processingRef.current = true
    setIsProcessing(true)
    for (const item of pendingItems) await processItem(item)
    processingRef.current = false
    setIsProcessing(false)
    const firstResultId = itemsRef.current.find((item) => item.status === 'review' || item.status === 'error')?.id
    if (firstResultId) setActiveId(firstResultId)
  }

  const retryItem = async (id: string) => {
    if (processingRef.current) return
    const item = items.find((entry) => entry.id === id)
    if (!item) return
    processingRef.current = true
    setIsProcessing(true)
    await processItem(item)
    processingRef.current = false
    setIsProcessing(false)
  }

  const saveDraft = (id: string, draft: InvoiceFormInput) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, draft } : item))
  }

  const markReviewed = (id: string, invoice: InvoiceFormData) => {
    const updated = items.map((item) => item.id === id
      ? { ...item, status: 'reviewed' as const, draft: invoice, reviewedInvoice: invoice }
      : item)
    const currentIndex = updated.findIndex((item) => item.id === id)
    const nextReviewId = updated.slice(currentIndex + 1).find((item) => item.status === 'review' || item.status === 'error')?.id
      ?? updated.find((item) => item.status === 'review' || item.status === 'error')?.id
      ?? id
    setItems(updated)
    setActiveId(nextReviewId)
  }

  const reset = () => {
    if (isProcessing) return
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setItems([])
    setActiveId(null)
    setFileMessage(null)
    setIsBatchMode(false)
    setCooldownSeconds(0)
    lastRequestStartedAtRef.current = 0
  }

  const counts = useMemo(() => countBatchStatuses(items), [items])
  const activeItem = items.find((item) => item.id === activeId) ?? items[0] ?? null
  const hasStarted = items.some((item) => item.status !== 'waiting')
  const reviewedInvoices = items.flatMap((item) => item.reviewedInvoice ? [item.reviewedInvoice] : [])
  const canCopyAll = items.length > 0 && !isProcessing && items.every((item) => item.status === 'reviewed')

  return {
    items,
    activeItem,
    activeId,
    counts,
    fileMessage,
    isProcessing,
    isBatchMode,
    cooldownSeconds,
    hasStarted,
    canCopyAll,
    reviewedInvoices,
    addFiles,
    replaceFile,
    removeItem,
    processAll,
    retryItem,
    saveDraft,
    markReviewed,
    selectItem: setActiveId,
    reset,
  }
}
