import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { InvoiceProcessing } from './InvoiceProcessing'

describe('InvoiceProcessing', () => {
  it('menampilkan countdown saat menunggu kuota AI', () => {
    const markup = renderToStaticMarkup(<InvoiceProcessing cooldownSeconds={18} />)

    expect(markup).toContain('Menunggu kuota AI...')
    expect(markup).toContain('dalam 18 detik')
    expect(markup).not.toContain('animate-spin')
  })

  it('menampilkan state pemrosesan biasa tanpa cooldown', () => {
    const markup = renderToStaticMarkup(<InvoiceProcessing />)

    expect(markup).toContain('Membaca faktur...')
    expect(markup).toContain('animate-spin')
  })
})
