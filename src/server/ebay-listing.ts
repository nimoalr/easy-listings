import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { ebayListingData, ebayAccounts, listings, listingImages } from '../db/schema'
import { eq } from 'drizzle-orm'
import { getAuthenticatedClient } from './ebay-client'
import { getPublicImageUrls } from './ebay-images'

// --- Save/Get eBay listing data locally ---

export const saveEbayListingData = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      listingId: string
      ebayAccountId?: string | null
      categoryId?: string | null
      categoryName?: string | null
      conditionId?: string | null
      conditionDescription?: string | null
      format?: 'FIXED_PRICE' | 'AUCTION'
      priceCents?: number | null
      currency?: string
      bestOfferEnabled?: boolean
      bestOfferAutoAcceptCents?: number | null
      bestOfferMinAcceptCents?: number | null
      auctionStartPriceCents?: number | null
      auctionReservePriceCents?: number | null
      auctionDurationDays?: number | null
      itemSpecifics?: Array<{ name: string; value: string }> | null
      fulfillmentPolicyId?: string | null
      returnPolicyId?: string | null
      paymentPolicyId?: string | null
    }) => data,
  )
  .handler(async ({ data }) => {
    const { listingId, ...updates } = data

    const existing = await db
      .select()
      .from(ebayListingData)
      .where(eq(ebayListingData.listingId, listingId))
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(ebayListingData)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(ebayListingData.listingId, listingId))
        .returning()
      return updated!
    }

    const [created] = await db
      .insert(ebayListingData)
      .values({ listingId, ...updates })
      .returning()
    return created!
  })

export const getEbayListingData = createServerFn({ method: 'GET' })
  .inputValidator((listingId: string) => listingId)
  .handler(async ({ data: listingId }) => {
    const [result] = await db
      .select()
      .from(ebayListingData)
      .where(eq(ebayListingData.listingId, listingId))
      .limit(1)

    return result ?? null
  })

// --- eBay API operations ---

export const createEbayInventoryItem = createServerFn({ method: 'POST' })
  .inputValidator((listingId: string) => listingId)
  .handler(async ({ data: listingId }) => {
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1)

    if (!listing) throw new Error('Listing not found')

    const [ebayData] = await db
      .select()
      .from(ebayListingData)
      .where(eq(ebayListingData.listingId, listingId))
      .limit(1)

    if (!ebayData?.ebayAccountId) throw new Error('No eBay account selected')

    const [account] = await db
      .select()
      .from(ebayAccounts)
      .where(eq(ebayAccounts.id, ebayData.ebayAccountId))
      .limit(1)

    if (!account) throw new Error('eBay account not found')

    const images = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId))
      .orderBy(listingImages.order)

    const { client } = await getAuthenticatedClient(account)

    const sku = ebayData.ebaySku ?? listingId.replace(/-/g, '').slice(0, 50)
    const imageUrls = getPublicImageUrls(images.map((img) => img.filePath))

    // Build aspects object from item specifics
    const aspects: Record<string, string[]> = {}
    if (ebayData.itemSpecifics) {
      for (const spec of ebayData.itemSpecifics) {
        aspects[spec.name] = [spec.value]
      }
    }

    const title = listing.aiName ?? listing.name
    const description = listing.aiDescription ?? listing.description ?? ''

    await client.sell.inventory.createOrReplaceInventoryItem(sku, {
      availability: {
        shipToLocationAvailability: {
          quantity: 1,
        },
      },
      condition: ebayData.conditionId ?? 'USED_GOOD',
      conditionDescription: ebayData.conditionDescription ?? undefined,
      product: {
        title: title.slice(0, 80),
        description,
        imageUrls,
        aspects: aspects as any,
      },
    })

    // Save SKU and image URLs
    await db
      .update(ebayListingData)
      .set({
        ebaySku: sku,
        ebayImageUrls: imageUrls,
        updatedAt: new Date(),
      })
      .where(eq(ebayListingData.id, ebayData.id))

    return { sku }
  })

export type BuildOfferBodyParams = {
  sku: string
  marketplace: string
  format: 'FIXED_PRICE' | 'AUCTION'
  categoryId: string | null
  description: string
  currency: string
  priceCents: number | null
  bestOfferEnabled: boolean
  bestOfferAutoAcceptCents: number | null
  bestOfferMinAcceptCents: number | null
  auctionStartPriceCents: number | null
  auctionReservePriceCents: number | null
  auctionDurationDays: number | null
  fulfillmentPolicyId: string | null
  paymentPolicyId: string | null
  returnPolicyId: string | null
}

export function buildOfferBody(params: BuildOfferBodyParams): Record<string, any> {
  const body: Record<string, any> = {
    sku: params.sku,
    marketplaceId: params.marketplace,
    format: params.format,
    categoryId: params.categoryId,
    listingDescription: params.description,
    listingPolicies: {
      fulfillmentPolicyId: params.fulfillmentPolicyId,
      paymentPolicyId: params.paymentPolicyId,
      returnPolicyId: params.returnPolicyId,
    },
  }

  if (params.format === 'FIXED_PRICE') {
    body.pricingSummary = {
      price: {
        value: String(((params.priceCents ?? 0) / 100).toFixed(2)),
        currency: params.currency,
      },
    }
    if (params.bestOfferEnabled) {
      body.bestOfferTerms = {
        bestOfferEnabled: true,
        ...(params.bestOfferAutoAcceptCents && {
          autoAcceptPrice: {
            value: String((params.bestOfferAutoAcceptCents / 100).toFixed(2)),
            currency: params.currency,
          },
        }),
        ...(params.bestOfferMinAcceptCents && {
          autoDeclinePrice: {
            value: String((params.bestOfferMinAcceptCents / 100).toFixed(2)),
            currency: params.currency,
          },
        }),
      }
    }
  } else {
    body.pricingSummary = {
      auctionStartPrice: {
        value: String(((params.auctionStartPriceCents ?? 0) / 100).toFixed(2)),
        currency: params.currency,
      },
      ...(params.auctionReservePriceCents && {
        auctionReservePrice: {
          value: String((params.auctionReservePriceCents / 100).toFixed(2)),
          currency: params.currency,
        },
      }),
    }
    if (params.auctionDurationDays) {
      body.listingDuration = `DAYS_${params.auctionDurationDays}`
    }
  }

  return body
}

export const createEbayOffer = createServerFn({ method: 'POST' })
  .inputValidator((listingId: string) => listingId)
  .handler(async ({ data: listingId }) => {
    const [ebayData] = await db
      .select()
      .from(ebayListingData)
      .where(eq(ebayListingData.listingId, listingId))
      .limit(1)

    if (!ebayData?.ebaySku) throw new Error('Inventory item not created yet')
    if (!ebayData.ebayAccountId) throw new Error('No eBay account selected')

    const [account] = await db
      .select()
      .from(ebayAccounts)
      .where(eq(ebayAccounts.id, ebayData.ebayAccountId))
      .limit(1)

    if (!account) throw new Error('eBay account not found')

    const { client } = await getAuthenticatedClient(account)

    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1)

    const offerBody = buildOfferBody({
      sku: ebayData.ebaySku!,
      marketplace: account.marketplace,
      format: ebayData.format,
      categoryId: ebayData.categoryId,
      description: listing?.aiDescription ?? listing?.description ?? '',
      currency: ebayData.currency,
      priceCents: ebayData.priceCents,
      bestOfferEnabled: ebayData.bestOfferEnabled,
      bestOfferAutoAcceptCents: ebayData.bestOfferAutoAcceptCents,
      bestOfferMinAcceptCents: ebayData.bestOfferMinAcceptCents,
      auctionStartPriceCents: ebayData.auctionStartPriceCents,
      auctionReservePriceCents: ebayData.auctionReservePriceCents,
      auctionDurationDays: ebayData.auctionDurationDays,
      fulfillmentPolicyId: ebayData.fulfillmentPolicyId,
      paymentPolicyId: ebayData.paymentPolicyId,
      returnPolicyId: ebayData.returnPolicyId,
    })

    const result = await client.sell.inventory.createOffer(offerBody)
    const offerId = result.offerId

    await db
      .update(ebayListingData)
      .set({
        ebayOfferId: offerId,
        publishStatus: 'draft',
        publishError: null,
        updatedAt: new Date(),
      })
      .where(eq(ebayListingData.id, ebayData.id))

    return { offerId }
  })

export const publishEbayOffer = createServerFn({ method: 'POST' })
  .inputValidator((listingId: string) => listingId)
  .handler(async ({ data: listingId }) => {
    const [ebayData] = await db
      .select()
      .from(ebayListingData)
      .where(eq(ebayListingData.listingId, listingId))
      .limit(1)

    if (!ebayData?.ebayOfferId) throw new Error('No draft offer exists')
    if (!ebayData.ebayAccountId) throw new Error('No eBay account selected')

    const [account] = await db
      .select()
      .from(ebayAccounts)
      .where(eq(ebayAccounts.id, ebayData.ebayAccountId))
      .limit(1)

    if (!account) throw new Error('eBay account not found')

    const { client } = await getAuthenticatedClient(account)

    try {
      const result = await client.sell.inventory.publishOffer(ebayData.ebayOfferId)

      await db
        .update(ebayListingData)
        .set({
          ebayListingId: result.listingId,
          publishStatus: 'published',
          publishError: null,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(ebayListingData.id, ebayData.id))

      return { listingId: result.listingId }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      await db
        .update(ebayListingData)
        .set({
          publishStatus: 'failed',
          publishError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(ebayListingData.id, ebayData.id))

      throw new Error(errorMessage)
    }
  })

export const getEbayBusinessPolicies = createServerFn({ method: 'POST' })
  .inputValidator((accountId: string) => accountId)
  .handler(async ({ data: accountId }) => {
    const [account] = await db
      .select()
      .from(ebayAccounts)
      .where(eq(ebayAccounts.id, accountId))
      .limit(1)

    if (!account) throw new Error('eBay account not found')

    const { client } = await getAuthenticatedClient(account)

    try {
      const [fulfillment, returns, payment] = await Promise.all([
        client.sell.account.getFulfillmentPolicies(account.marketplace).catch(() => ({ fulfillmentPolicies: [] })),
        client.sell.account.getReturnPolicies(account.marketplace).catch(() => ({ returnPolicies: [] })),
        client.sell.account.getPaymentPolicies(account.marketplace).catch(() => ({ paymentPolicies: [] })),
      ])

      return {
        fulfillment: (fulfillment.fulfillmentPolicies ?? []).map((p: any) => ({
          id: p.fulfillmentPolicyId,
          name: p.name,
        })),
        returns: (returns.returnPolicies ?? []).map((p: any) => ({
          id: p.returnPolicyId,
          name: p.name,
        })),
        payment: (payment.paymentPolicies ?? []).map((p: any) => ({
          id: p.paymentPolicyId,
          name: p.name,
        })),
      }
    } catch (err) {
      console.error('Failed to fetch business policies:', err)
      return { fulfillment: [], returns: [], payment: [] }
    }
  })
