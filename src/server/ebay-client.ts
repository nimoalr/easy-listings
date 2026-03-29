import eBayApi from 'ebay-api'
import { db } from '../db'
import { ebayAccounts } from '../db/schema'
import { eq } from 'drizzle-orm'
import { EBAY_MARKETPLACES, type EbayMarketplaceId } from './ebay-constants'

export { EBAY_MARKETPLACES, type EbayMarketplaceId } from './ebay-constants'

const OAUTH_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
]

export function createEbayClient(options?: {
  sandbox?: boolean
  marketplace?: EbayMarketplaceId
  accessToken?: string
  refreshToken?: string
}) {
  const sandbox = options?.sandbox ?? process.env.EBAY_SANDBOX === 'true'
  const marketplace = options?.marketplace ?? 'EBAY_US'
  const siteId = EBAY_MARKETPLACES[marketplace]?.siteId ?? 0

  const client = new eBayApi({
    appId: process.env.EBAY_CLIENT_ID ?? '',
    certId: process.env.EBAY_CLIENT_SECRET ?? '',
    sandbox,
    siteId,
    ruName: process.env.EBAY_REDIRECT_URI!,
    scope: OAUTH_SCOPES,
  })

  if (options?.accessToken) {
    client.OAuth2.setCredentials({
      access_token: options.accessToken,
      refresh_token: options.refreshToken ?? '',
      expires_in: 7200,
      token_type: 'User Access Token',
    })
  }

  return client
}

type EbayAccount = typeof ebayAccounts.$inferSelect

export async function getAuthenticatedClient(account: EbayAccount) {
  const client = createEbayClient({
    sandbox: account.isSandbox,
    marketplace: account.marketplace as EbayMarketplaceId,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
  })

  // Refresh if token expires within 5 minutes
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000)
  let newToken: { accessToken: string; expiresAt: Date } | null = null

  if (account.tokenExpiresAt < fiveMinFromNow) {
    const token = await client.OAuth2.refreshToken()
    const accessToken = token.access_token
    const expiresAt = new Date(Date.now() + (token.expires_in ?? 7200) * 1000)

    await db
      .update(ebayAccounts)
      .set({
        accessToken,
        tokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(ebayAccounts.id, account.id))

    newToken = { accessToken, expiresAt }
  }

  return { client, newToken }
}
