import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { ebayAccounts } from '../db/schema'
import { eq } from 'drizzle-orm'
import { getAuthenticatedClient } from './ebay-client'

export const searchEbayCategories = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { accountId: string; query: string }) => data,
  )
  .handler(async ({ data }) => {
    const [account] = await db
      .select()
      .from(ebayAccounts)
      .where(eq(ebayAccounts.id, data.accountId))
      .limit(1)

    if (!account) throw new Error('eBay account not found')

    const { client } = await getAuthenticatedClient(account)

    try {
      const result = await client.commerce.taxonomy.getCategorySuggestions(
        '0', // category tree ID (0 = eBay US, but tree IDs are marketplace-specific)
        data.query,
      )

      const suggestions =
        result.categorySuggestions?.map((s: any) => ({
          categoryId: s.category?.categoryId ?? '',
          categoryName: s.category?.categoryName ?? '',
          ancestors: (s.categoryTreeNodeAncestors ?? []).map(
            (a: any) => a.categoryName ?? '',
          ),
        })) ?? []

      return suggestions
    } catch (err) {
      console.error('Category search failed:', err)
      return []
    }
  })

export const getCategoryAspects = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { accountId: string; categoryId: string }) => data,
  )
  .handler(async ({ data }) => {
    const [account] = await db
      .select()
      .from(ebayAccounts)
      .where(eq(ebayAccounts.id, data.accountId))
      .limit(1)

    if (!account) throw new Error('eBay account not found')

    const { client } = await getAuthenticatedClient(account)

    try {
      const result = await client.commerce.taxonomy.getItemAspectsForCategory(
        '0',
        data.categoryId,
      )

      const aspects =
        result.aspects?.map((a: any) => ({
          name: a.localizedAspectName ?? '',
          required: a.aspectConstraint?.aspectRequired ?? false,
          mode: a.aspectConstraint?.aspectMode ?? 'FREE_TEXT',
          dataType: a.aspectConstraint?.aspectDataType ?? 'STRING',
          values: (a.aspectValues ?? []).map(
            (v: any) => v.localizedValue ?? '',
          ),
        })) ?? []

      return aspects
    } catch (err) {
      console.error('Category aspects fetch failed:', err)
      return []
    }
  })
