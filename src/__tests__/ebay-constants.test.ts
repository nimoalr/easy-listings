import { describe, it, expect } from 'vitest'
import { EBAY_MARKETPLACES } from '../server/ebay-constants'

describe('EBAY_MARKETPLACES', () => {
  const entries = Object.entries(EBAY_MARKETPLACES)

  it('every marketplace has a non-empty name', () => {
    for (const [id, info] of entries) {
      expect(info.name, `${id} should have a name`).toBeTruthy()
      expect(typeof info.name).toBe('string')
    }
  })

  it('every marketplace has a valid 3-letter currency code', () => {
    for (const [id, info] of entries) {
      expect(info.currency, `${id} currency`).toMatch(/^[A-Z]{3}$/)
    }
  })

  it('every marketplace has a numeric siteId', () => {
    for (const [id, info] of entries) {
      expect(typeof info.siteId, `${id} siteId`).toBe('number')
    }
  })
})
