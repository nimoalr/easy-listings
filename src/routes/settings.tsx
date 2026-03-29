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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/i18n'
import {
  getEbayAccounts,
  getEbayAuthUrl,
  disconnectEbayAccount,
  handleEbayCallback,
} from '@/server/ebay-auth'
import { Input } from '@/components/ui/input'
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
  const [manualCode, setManualCode] = useState('')
  const [exchanging, setExchanging] = useState(false)

  async function handleConnect() {
    setConnecting(true)
    try {
      const { authUrl } = await getEbayAuthUrl({
        data: { marketplace, sandbox },
      })
      window.open(authUrl, '_blank')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect')
      setConnecting(false)
    }
  }

  async function handleManualCodeExchange() {
    if (!manualCode.trim()) return
    setExchanging(true)
    try {
      // Extract code from full URL or use raw code
      let code = manualCode.trim()
      try {
        const url = new URL(code)
        code = url.searchParams.get('code') ?? code
      } catch {
        // Not a URL, use as-is
      }

      const state = JSON.stringify({ marketplace, sandbox })
      await handleEbayCallback({ data: { code, state } })
      toast.success(t('toastEbayConnected'))
      setManualCode('')
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Token exchange failed')
    } finally {
      setExchanging(false)
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
              <Select
                value={marketplace}
                onValueChange={(val) => setMarketplace(val as EbayMarketplaceId)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EBAY_MARKETPLACES).map(([id, info]) => (
                    <SelectItem key={id} value={id}>
                      {info.name} ({info.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {/* Manual code exchange — for when redirect URLs aren't configured */}
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-sm text-muted-foreground">
              After authorizing on eBay, paste the full redirect URL or the code here:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Paste URL or code from eBay..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleManualCodeExchange}
                disabled={exchanging || !manualCode.trim()}
              >
                {exchanging ? t('connecting') : 'Exchange'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
