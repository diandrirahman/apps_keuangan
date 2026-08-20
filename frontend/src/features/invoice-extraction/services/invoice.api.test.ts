import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractInvoice, InvoiceApiError } from './invoice.api'

afterEach(() => vi.unstubAllGlobals())

describe('extractInvoice rate limit response', () => {
  it('meneruskan waktu cooldown dari backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'RATE_LIMIT',
      message: 'Batas request AI sementara tercapai.',
      retryAfterSeconds: 24,
      referenceId: 'rate-limit-test',
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '24' },
    })))

    const request = extractInvoice(new File(['invoice'], 'invoice.jpg', { type: 'image/jpeg' }))

    const expectedError: Partial<InvoiceApiError> = {
      name: 'InvoiceApiError',
      status: 429,
      code: 'RATE_LIMIT',
      retryAfterSeconds: 24,
      referenceId: 'rate-limit-test',
    }
    await expect(request).rejects.toMatchObject(expectedError)
  })

  it('membatasi cooldown maksimal 60 detik', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'RATE_LIMIT',
      message: 'Rate limited.',
      retryAfterSeconds: 120,
    }), { status: 429 })))

    await expect(extractInvoice(new File(['invoice'], 'invoice.jpg', { type: 'image/jpeg' })))
      .rejects.toMatchObject({ retryAfterSeconds: 60 })
  })
})
