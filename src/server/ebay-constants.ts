export const EBAY_MARKETPLACES = {
  EBAY_US: { name: 'United States', currency: 'USD', siteId: 0 },
  EBAY_GB: { name: 'United Kingdom', currency: 'GBP', siteId: 3 },
  EBAY_FR: { name: 'France', currency: 'EUR', siteId: 71 },
  EBAY_DE: { name: 'Germany', currency: 'EUR', siteId: 77 },
  EBAY_CA: { name: 'Canada', currency: 'CAD', siteId: 2 },
  EBAY_AU: { name: 'Australia', currency: 'AUD', siteId: 15 },
} as const

export type EbayMarketplaceId = keyof typeof EBAY_MARKETPLACES
