import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../../config/env.js'
import type { InvoiceImageView } from '../../modules/invoice-extraction/invoice-image-preprocessor.js'

export type AiFailureKind = 'configuration' | 'rate_limit' | 'timeout' | 'upstream' | 'invalid_response' | 'unknown'

export class AiExtractionError extends Error {
  public readonly retryAfterSeconds: number | null

  constructor(
    message: string,
    public readonly kind: AiFailureKind,
    public readonly attempts: number,
    options?: ErrorOptions & { retryAfterSeconds?: number },
  ) {
    super(message, options)
    this.name = 'AiExtractionError'
    this.retryAfterSeconds = options?.retryAfterSeconds ?? null
  }
}

const MINIMUM_REQUEST_INTERVAL_MS = 6_000
const DEFAULT_RATE_LIMIT_DELAY_SECONDS = 30
let lastRequestStartedAt = 0
let requestSchedule: Promise<void> = Promise.resolve()

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function classifyError(error: unknown): AiFailureKind {
  const message = errorMessage(error).toLowerCase()
  if (error instanceof SyntaxError || (error instanceof Error && error.name === 'ZodError') || message.includes('json') || message.includes('validation')) return 'invalid_response'
  if (message.includes('429') || message.includes('quota') || message.includes('rate limit')) return 'rate_limit'
  if (message.includes('timeout') || message.includes('timed out') || message.includes('deadline')) return 'timeout'
  if (/\b(500|502|503|504)\b/.test(message) || message.includes('fetch failed')) return 'upstream'
  return 'unknown'
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function waitForProviderRequestSlot(): Promise<void> {
  const scheduledRequest = requestSchedule.then(async () => {
    const remainingDelay = Math.max(0, MINIMUM_REQUEST_INTERVAL_MS - (Date.now() - lastRequestStartedAt))
    if (remainingDelay > 0) await delay(remainingDelay)
    lastRequestStartedAt = Date.now()
  })
  requestSchedule = scheduledRequest.catch(() => undefined)
  return scheduledRequest
}

function retryAfterSeconds(error: unknown): number {
  const message = errorMessage(error)
  const retryDelayMatch = message.match(/retry(?:Delay)?[^\d]*([\d.]+)\s*s/i)
  if (!retryDelayMatch) return DEFAULT_RATE_LIMIT_DELAY_SECONDS
  return Math.min(60, Math.max(5, Math.ceil(Number(retryDelayMatch[1]))))
}

function shouldRetryInProvider(kind: AiFailureKind): boolean {
  return ['timeout', 'upstream', 'invalid_response'].includes(kind)
}

function retryDelayMilliseconds(kind: AiFailureKind, attempt: number): number {
  const baseDelay = kind === 'invalid_response' ? 1_000 : 2_000
  const exponentialDelay = baseDelay * (2 ** (attempt - 1))
  const jitter = Math.floor(Math.random() * 500)
  return exponentialDelay + jitter
}

export class GeminiProvider {
  async extractJson<T>(
    prompt: string,
    images: InvoiceImageView[],
    validate: (value: unknown) => T,
  ): Promise<T> {
    if (!env.GEMINI_API_KEY) {
      throw new AiExtractionError('AI belum dikonfigurasi', 'configuration', 0)
    }

    const client = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const model = client.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    const parts = [
      prompt,
      'Semua gambar berikut adalah tampilan atau crop dari SATU dokumen yang sama. Jangan menghitung setiap tampilan sebagai dokumen terpisah.',
      ...images.flatMap((image) => [
        `\n${image.label}:`,
        { inlineData: { data: image.buffer.toString('base64'), mimeType: image.mimeType } },
      ]),
    ]

    const maximumAttempts = 2
    let lastError: unknown

    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        await waitForProviderRequestSlot()
        const response = await model.generateContent(parts)
        const text = response.response.text().replace(/^```json\s*|\s*```$/g, '').trim()
        return validate(JSON.parse(text) as unknown)
      } catch (error) {
        lastError = error
        const kind = classifyError(error)
        console.warn('Gemini invoice extraction attempt failed', {
          attempt,
          kind,
          message: errorMessage(error),
        })

        if (kind === 'rate_limit') {
          throw new AiExtractionError(
            'Gemini sedang mencapai batas request per menit.',
            kind,
            attempt,
            { cause: error, retryAfterSeconds: retryAfterSeconds(error) },
          )
        }

        if (!shouldRetryInProvider(kind) || attempt >= maximumAttempts) {
          throw new AiExtractionError(
            `Gemini gagal menghasilkan data faktur yang valid setelah ${attempt} percobaan.`,
            kind,
            attempt,
            { cause: error },
          )
        }

        await delay(retryDelayMilliseconds(kind, attempt))
      }
    }

    const kind = classifyError(lastError)
    throw new AiExtractionError(
      `Gemini gagal menghasilkan data faktur yang valid setelah ${maximumAttempts} percobaan.`,
      kind,
      maximumAttempts,
      { cause: lastError },
    )
  }
}
