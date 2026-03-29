import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { ebayAccounts } from '../db/schema'
import { eq } from 'drizzle-orm'
import { createEbayClient, type EbayMarketplaceId, EBAY_MARKETPLACES } from './ebay-client'

export const getEbayAuthUrl = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { marketplace: EbayMarketplaceId; sandbox: boolean }) => data,
  )
  .handler(async ({ data }) => {
    const client = createEbayClient({
      sandbox: data.sandbox,
      marketplace: data.marketplace,
    })

    const state = JSON.stringify({
      marketplace: data.marketplace,
      sandbox: data.sandbox,
    })

    const authUrl = client.OAuth2.generateAuthUrl(state)
    return { authUrl }
  })

export const handleEbayCallback = createServerFn({ method: 'POST' })
  .inputValidator((data: { code: string; state: string }) => data)
  .handler(async ({ data }) => {
    const { marketplace, sandbox } = JSON.parse(data.state) as {
      marketplace: EbayMarketplaceId
      sandbox: boolean
    }

    const client = createEbayClient({ sandbox, marketplace })
    const token = await client.OAuth2.getToken(data.code)

    const accessToken = token.access_token
    const refreshToken = token.refresh_token
    const expiresIn = token.expires_in ?? 7200
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

    const marketplaceName = EBAY_MARKETPLACES[marketplace]?.name ?? marketplace
    const label = `${marketplaceName}${sandbox ? ' (Sandbox)' : ''}`

    const [account] = await db
      .insert(ebayAccounts)
      .values({
        label,
        marketplace,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        isSandbox: sandbox,
      })
      .returning()

    return account!
  })

export const getEbayAccounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    const accounts = await db
      .select({
        id: ebayAccounts.id,
        label: ebayAccounts.label,
        marketplace: ebayAccounts.marketplace,
        ebayUserId: ebayAccounts.ebayUserId,
        isSandbox: ebayAccounts.isSandbox,
        tokenExpiresAt: ebayAccounts.tokenExpiresAt,
        createdAt: ebayAccounts.createdAt,
      })
      .from(ebayAccounts)
      .orderBy(ebayAccounts.createdAt)

    return accounts
  },
)

export const disconnectEbayAccount = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(ebayAccounts).where(eq(ebayAccounts.id, id))
    return { success: true }
  })
