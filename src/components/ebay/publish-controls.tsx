import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/i18n'
import {
  createEbayInventoryItem,
  createEbayOffer,
  publishEbayOffer,
} from '@/server/ebay-listing'
import { ExternalLink, Upload, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  listingId: string
  publishStatus: string
  ebayListingId: string | null
  publishError: string | null
  isSandbox: boolean
  onStatusChange: (status: string, ebayListingId?: string | null, error?: string | null) => void
}

export function PublishControls({
  listingId,
  publishStatus,
  ebayListingId,
  publishError,
  isSandbox,
  onStatusChange,
}: Props) {
  const { t } = useTranslation()
  const [working, setWorking] = useState(false)

  async function handleCreateDraft() {
    setWorking(true)
    try {
      await createEbayInventoryItem({ data: listingId })
      await createEbayOffer({ data: listingId })
      onStatusChange('draft')
      toast.success(t('toastDraftCreated'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      onStatusChange('failed', null, msg)
      toast.error(t('toastPublishFailed', { error: msg }))
    } finally {
      setWorking(false)
    }
  }

  async function handlePublish() {
    setWorking(true)
    try {
      const result = await publishEbayOffer({ data: listingId })
      onStatusChange('published', result.listingId)
      toast.success(t('toastPublished'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      onStatusChange('failed', null, msg)
      toast.error(t('toastPublishFailed', { error: msg }))
    } finally {
      setWorking(false)
    }
  }

  const statusBadgeVariant =
    publishStatus === 'published'
      ? ('default' as const)
      : publishStatus === 'failed'
        ? ('destructive' as const)
        : ('secondary' as const)

  const statusLabel: Record<string, string> = {
    not_listed: t('notListed'),
    draft: t('ebayDraft'),
    published: t('published'),
    ended: t('ended'),
    failed: t('publishFailed'),
  }

  const ebayBaseUrl = isSandbox
    ? 'https://sandbox.ebay.com/itm/'
    : 'https://www.ebay.com/itm/'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t('publishStatus')}:</span>
        <Badge variant={statusBadgeVariant}>
          {statusLabel[publishStatus] ?? publishStatus}
        </Badge>
      </div>

      {publishError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{publishError}</p>
        </div>
      )}

      <div className="flex gap-2">
        {publishStatus === 'not_listed' && (
          <Button onClick={handleCreateDraft} disabled={working}>
            {working ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {t('createDraftOnEbay')}
          </Button>
        )}

        {publishStatus === 'draft' && (
          <Button onClick={handlePublish} disabled={working}>
            {working ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {t('publishToEbay')}
          </Button>
        )}

        {publishStatus === 'failed' && (
          <Button onClick={handleCreateDraft} disabled={working} variant="outline">
            {working ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {t('retryPublish')}
          </Button>
        )}

        {publishStatus === 'published' && ebayListingId && (
          <a
            href={`${ebayBaseUrl}${ebayListingId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('viewOnEbay')}
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
