import type { BatchInvoice } from '../types/invoice.types'

export const MAX_BATCH_FILES = 10
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024
export const MINIMUM_REQUEST_INTERVAL_MS = 6_000
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type FileValidationResult = {
  accepted: File[]
  message: string | null
}

function fileIdentity(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export function requestPacingDelay(lastRequestStartedAt: number, currentTime: number): number {
  if (lastRequestStartedAt <= 0) return 0
  return Math.max(0, MINIMUM_REQUEST_INTERVAL_MS - (currentTime - lastRequestStartedAt))
}

export function validateInvoiceFiles(selectedFiles: File[], existingFiles: File[] = []): FileValidationResult {
  const existingIdentities = new Set(existingFiles.map(fileIdentity))
  const acceptedIdentities = new Set<string>()
  const accepted: File[] = []
  let unsupportedCount = 0
  let oversizedCount = 0
  let duplicateCount = 0
  let overLimitCount = 0

  for (const file of selectedFiles) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      unsupportedCount += 1
      continue
    }
    if (file.size > MAX_IMAGE_SIZE) {
      oversizedCount += 1
      continue
    }

    const identity = fileIdentity(file)
    if (existingIdentities.has(identity) || acceptedIdentities.has(identity)) {
      duplicateCount += 1
      continue
    }
    if (existingFiles.length + accepted.length >= MAX_BATCH_FILES) {
      overLimitCount += 1
      continue
    }

    accepted.push(file)
    acceptedIdentities.add(identity)
  }

  const issues = [
    unsupportedCount > 0 ? `${unsupportedCount} file memiliki format yang tidak didukung` : null,
    oversizedCount > 0 ? `${oversizedCount} file melebihi 10 MB` : null,
    duplicateCount > 0 ? `${duplicateCount} file duplikat dilewati` : null,
    overLimitCount > 0 ? `${overLimitCount} file melewati batas maksimal 10 faktur` : null,
  ].filter((issue): issue is string => issue !== null)

  return {
    accepted,
    message: issues.length > 0 ? `${issues.join(', ')}.` : null,
  }
}

export function countBatchStatuses(items: BatchInvoice[]) {
  return {
    waiting: items.filter((item) => item.status === 'waiting').length,
    processing: items.filter((item) => item.status === 'processing').length,
    cooldown: items.filter((item) => item.status === 'cooldown').length,
    review: items.filter((item) => item.status === 'review').length,
    reviewed: items.filter((item) => item.status === 'reviewed').length,
    error: items.filter((item) => item.status === 'error').length,
  }
}
