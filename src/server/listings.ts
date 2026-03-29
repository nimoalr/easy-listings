import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { listings, listingImages, ebayListingData } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { readImageAsDataUrl } from './serve-image'

export const getListings = createServerFn({ method: 'GET' }).handler(
  async () => {
    const allListings = await db
      .select()
      .from(listings)
      .orderBy(desc(listings.createdAt))

    const allImages = await db
      .select()
      .from(listingImages)
      .orderBy(listingImages.order)

    const allEbayData = await db
      .select({
        listingId: ebayListingData.listingId,
        publishStatus: ebayListingData.publishStatus,
      })
      .from(ebayListingData)

    return allListings.map((listing) => {
      const images = allImages.filter((img) => img.listingId === listing.id)
      const firstImage = images[0]
      return {
        ...listing,
        images,
        thumbnailSrc: firstImage ? readImageAsDataUrl(firstImage.filePath) : null,
        ebayStatus: allEbayData.find((e) => e.listingId === listing.id)?.publishStatus ?? null,
      }
    })
  },
)

export const getListingCounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    const allEbayData = await db
      .select({
        listingId: ebayListingData.listingId,
        publishStatus: ebayListingData.publishStatus,
      })
      .from(ebayListingData)

    const allListings = await db.select({ id: listings.id }).from(listings)

    const publishedIds = new Set(
      allEbayData
        .filter((e) => e.publishStatus === 'published')
        .map((e) => e.listingId),
    )

    return {
      drafts: allListings.filter((l) => !publishedIds.has(l.id)).length,
      published: publishedIds.size,
    }
  },
)

export const getListing = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1)

    if (!listing) throw new Error('Listing not found')

    const images = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, id))
      .orderBy(listingImages.order)

    // Pre-load image data URLs server-side
    const imageSrcs: Record<string, string> = {}
    for (const img of images) {
      const src = readImageAsDataUrl(img.filePath)
      if (src) imageSrcs[img.id] = src
    }

    return { ...listing, images, imageSrcs }
  })

export const createListing = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string; description?: string }) => data)
  .handler(async ({ data }) => {
    const [listing] = await db
      .insert(listings)
      .values({
        name: data.name,
        description: data.description ?? '',
      })
      .returning()

    return listing!
  })

export const updateListing = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      name?: string
      description?: string
      aiName?: string | null
      aiDescription?: string | null
      status?: 'draft' | 'processed'
    }) => data,
  )
  .handler(async ({ data }) => {
    const { id, ...updates } = data
    const [listing] = await db
      .update(listings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning()

    return listing!
  })

export const deleteListing = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(listings).where(eq(listings.id, id))
    return { success: true }
  })
