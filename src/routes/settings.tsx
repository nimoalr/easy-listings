import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/i18n'
import {
  getEbayAccounts,
  getEbayAuthUrl,
  disconnectEbayAccount,
} from '@/server/ebay-auth'
import { EBAY_MARKETPLACES, type EbayMarketplaceId } from '@/server/ebay-constants'
import { ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/settings')({
  loader: () => getEbayAccounts(),
  component: SettingsPage,
})

function SettingsPage() {
  const accounts = Route.useLoaderData()
  const { t } = useTranslation()
  const [marketplace, setMarketplace] = useState<EbayMarketplaceId>('EBAY_US')
  const isDev = import.meta.env.DEV
  const [sandbox, setSandbox] = useState(isDev)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  async function handleConnect() {
    setConnecting(true)
    try {
      const { authUrl } = await getEbayAuthUrl({
        data: { marketplace, sandbox },
      })
      window.location.href = authUrl
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect')
      setConnecting(false)
    }
  }

  async function handleDisconnect(id: string) {
    setDisconnecting(id)
    try {
      await disconnectEbayAccount({ data: id })
      toast.success(t('toastEbayDisconnected'))
      window.location.reload()
    } catch {
      toast.error('Failed to disconnect')
      setDisconnecting(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('settings')}</h1>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>{t('ebayAccounts')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                {t('noAccountsConnected')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('noAccountsHint')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{account.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.ebayUserId ?? account.marketplace}
                      </p>
                    </div>
                    <Badge variant="secondary">{account.marketplace.replace('EBAY_', '')}</Badge>
                    {account.isSandbox && (
                      <Badge variant="outline">{t('sandboxBadge')}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnecting === account.id}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('disconnectEbay')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect New Account */}
      <Card>
        <CardHeader>
          <CardTitle>{t('connectNewAccount')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t('marketplace')}</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value as EbayMarketplaceId)}
              >
                {Object.entries(EBAY_MARKETPLACES).map(([id, info]) => (
                  <option key={id} value={id}>
                    {info.name} ({info.currency})
                  </option>
                ))}
              </select>
            </div>
            {isDev && (
              <div className="grid gap-2">
                <Label>{t('sandboxMode')}</Label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sandbox}
                    onChange={(e) => setSandbox(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {t('sandboxBadge')}
                </label>
              </div>
            )}
          </div>
          <Button onClick={handleConnect} disabled={connecting}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {connecting ? t('connecting') : t('connectEbay')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
