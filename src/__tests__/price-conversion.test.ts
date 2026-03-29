import { describe, it, expect } from 'vitest'
import { centsToDisplay, displayToCents } from '../components/ebay/price-format-config'

describe('centsToDisplay', () => {
  it('returns empty string for null', () => {
    expect(centsToDisplay(null)).toBe('')
  })

  it('returns empty string for zero', () => {
    expect(centsToDisplay(0)).toBe('')
  })

  it('converts whole dollar amounts', () => {
    expect(centsToDisplay(1000)).toBe('10.00')
  })

  it('converts fractional cents correctly', () => {
    expect(centsToDisplay(999)).toBe('9.99')
  })

  it('handles single cent', () => {
    expect(centsToDisplay(1)).toBe('0.01')
  })
})

describe('displayToCents', () => {
  it('returns null for empty string', () => {
    expect(displayToCents('')).toBe(null)
  })

  it('returns null for non-numeric input', () => {
    expect(displayToCents('abc')).toBe(null)
  })

  it('converts decimal string to cents with rounding', () => {
    expect(displayToCents('19.99')).toBe(1999)
    expect(displayToCents('0.005')).toBe(1)
  })
})
