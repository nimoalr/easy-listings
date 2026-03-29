import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '../i18n'

describe('formatCurrency', () => {
  it('formats USD cents to dollar string', () => {
    const result = formatCurrency(2999, 'USD', 'en')
    expect(result).toContain('29.99')
  })

  it('formats EUR with French locale', () => {
    const result = formatCurrency(1050, 'EUR', 'fr')
    // French uses comma as decimal separator
    expect(result).toMatch(/10[,.]50/)
  })

  it('formats GBP with pound symbol', () => {
    const result = formatCurrency(500, 'GBP', 'en')
    expect(result).toContain('£')
  })

  it('handles zero cents', () => {
    const result = formatCurrency(0, 'USD', 'en')
    expect(result).toContain('0.00')
  })
})

describe('formatDate', () => {
  it('formats Date object for English locale', () => {
    const result = formatDate(new Date('2024-06-15'), 'en')
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('formats ISO string for Japanese locale', () => {
    const result = formatDate('2024-06-15', 'ja')
    expect(result).toContain('2024')
  })

  it('formats for German locale', () => {
    const result = formatDate(new Date('2024-12-01'), 'de')
    expect(result).toContain('2024')
    expect(result).toContain('Dez')
  })
})
