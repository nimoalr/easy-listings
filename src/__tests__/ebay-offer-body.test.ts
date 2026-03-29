import { describe, it, expect } from 'vitest'
import { buildOfferBody, type BuildOfferBodyParams } from '../server/ebay-listing'

const baseParams: BuildOfferBodyParams = {
  sku: 'TEST-SKU-123',
  marketplace: 'EBAY_US',
  format: 'FIXED_PRICE',
  categoryId: '12345',
  description: 'Test item description',
  currency: 'USD',
  priceCents: 2999,
  bestOfferEnabled: false,
  bestOfferAutoAcceptCents: null,
  bestOfferMinAcceptCents: null,
  auctionStartPriceCents: null,
  auctionReservePriceCents: null,
  auctionDurationDays: null,
  fulfillmentPolicyId: 'fp-1',
  paymentPolicyId: 'pp-1',
  returnPolicyId: 'rp-1',
}

describe('buildOfferBody', () => {
  describe('FIXED_PRICE format', () => {
    it('converts priceCents to dollar string in pricingSummary', () => {
      const body = buildOfferBody(baseParams)
      expect(body.pricingSummary.price.value).toBe('29.99')
      expect(body.pricingSummary.price.currency).toBe('USD')
    })

    it('uses "0.00" when priceCents is null', () => {
      const body = buildOfferBody({ ...baseParams, priceCents: null })
      expect(body.pricingSummary.price.value).toBe('0.00')
    })

    it('includes bestOfferTerms when bestOfferEnabled is true', () => {
      const body = buildOfferBody({ ...baseParams, bestOfferEnabled: true })
      expect(body.bestOfferTerms).toBeDefined()
      expect(body.bestOfferTerms.bestOfferEnabled).toBe(true)
    })

    it('includes autoAcceptPrice when bestOfferAutoAcceptCents is set', () => {
      const body = buildOfferBody({
        ...baseParams,
        bestOfferEnabled: true,
        bestOfferAutoAcceptCents: 5000,
      })
      expect(body.bestOfferTerms.autoAcceptPrice.value).toBe('50.00')
    })

    it('includes autoDeclinePrice when bestOfferMinAcceptCents is set', () => {
      const body = buildOfferBody({
        ...baseParams,
        bestOfferEnabled: true,
        bestOfferMinAcceptCents: 1500,
      })
      expect(body.bestOfferTerms.autoDeclinePrice.value).toBe('15.00')
    })

    it('omits bestOfferTerms when bestOfferEnabled is false', () => {
      const body = buildOfferBody(baseParams)
      expect(body.bestOfferTerms).toBeUndefined()
    })
  })

  describe('AUCTION format', () => {
    const auctionParams: BuildOfferBodyParams = {
      ...baseParams,
      format: 'AUCTION',
      auctionStartPriceCents: 100,
      auctionDurationDays: 7,
    }

    it('sets auctionStartPrice from auctionStartPriceCents', () => {
      const body = buildOfferBody(auctionParams)
      expect(body.pricingSummary.auctionStartPrice.value).toBe('1.00')
    })

    it('includes auctionReservePrice when provided', () => {
      const body = buildOfferBody({
        ...auctionParams,
        auctionReservePriceCents: 5000,
      })
      expect(body.pricingSummary.auctionReservePrice.value).toBe('50.00')
    })

    it('sets listingDuration from auctionDurationDays', () => {
      const body = buildOfferBody(auctionParams)
      expect(body.listingDuration).toBe('DAYS_7')
    })
  })
})
