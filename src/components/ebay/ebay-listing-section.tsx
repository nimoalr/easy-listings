import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from '@/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryPicker } from './category-picker'
import { ConditionSelector } from './condition-selector'
import { PriceFormatConfig } from './price-format-config'
import { ItemSpecificsEditor } from './item-specifics-editor'
import { BusinessPolicySelectors } from './business-policy-selectors'
import { PublishControls } from './publish-controls'
import { saveEbayListingData, getEbayListingData } from '@/server/ebay-listing'
import { EBAY_MARKETPLACES, type EbayMarketplaceId } from '@/server/ebay-constants'
import { Sparkles, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { EbayAIAnalysis } from '@/server/ai'

type EbayAccount = {
  id: string
  label: string
  marketplace: string
  isSandbox: boolean
}

type Props = {
  listingId: string
  accounts: EbayAccount[]
  aiAnalysis: EbayAIAnalysis | null
}

type EbayData = {
  ebayAccountId: string | null
  categoryId: string | null
  categoryName: string | null
  conditionId: string | null
  conditionDescription: string | null
  format: 'FIXED_PRICE' | 'AUCTION'
  priceCents: number | null
  currency: string
  bestOfferEnabled: boolean
  bestOfferAutoAcceptCents: number | null
  bestOfferMinAcceptCents: number | null
  auctionStartPriceCents: number | null
  auctionReservePriceCents: number | null
  auctionDurationDays: number | null
  itemSpecifics: Array<{ name: string; value: string }>
  fulfillmentPolicyId: string | null
  returnPolicyId: string | null
  paymentPolicyId: string | null
  publishStatus: string
  ebayListingId: string | null
  publishError: string | null
}

const DEFAULT_EBAY_DATA: EbayData = {
  ebayAccountId: null,
  categoryId: null,
  categoryName: null,
  conditionId: null,
  conditionDescription: null,
  format: 'FIXED_PRICE',
  priceCents: null,
  currency: 'USD',
  bestOfferEnabled: false,
  bestOfferAutoAcceptCents: null,
  bestOfferMinAcceptCents: null,
  auctionStartPriceCents: null,
  auctionReservePriceCents: null,
  auctionDurationDays: 7,
  itemSpecifics: [],
  fulfillmentPolicyId: null,
  returnPolicyId: null,
  paymentPolicyId: null,
  publishStatus: 'not_listed',
  ebayListingId: null,
  publishError: null,
}

export function EbayListingSection({ listingId, accounts, aiAnalysis }: Props) {
  const { t } = useTranslation()
  const [data, setData] = useState<EbayData>(DEFAULT_EBAY_DATA)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load existing eBay data
  useEffect(() => {
    getEbayListingData({ data: listingId })
      .then((existing) => {
        if (existing) {
          setData({
            ebayAccountId: existing.ebayAccountId,
            categoryId: existing.categoryId,
            categoryName: existing.categoryName,
            conditionId: existing.conditionId,
            conditionDescription: existing.conditionDescription,
            format: existing.format,
            priceCents: existing.priceCents,
            currency: existing.currency,
            bestOfferEnabled: existing.bestOfferEnabled,
            bestOfferAutoAcceptCents: existing.bestOfferAutoAcceptCents,
            bestOfferMinAcceptCents: existing.bestOfferMinAcceptCents,
            auctionStartPriceCents: existing.auctionStartPriceCents,
            auctionReservePriceCents: existing.auctionReservePriceCents,
            auctionDurationDays: existing.auctionDurationDays,
            itemSpecifics: (existing.itemSpecifics as any) ?? [],
            fulfillmentPolicyId: existing.fulfillmentPolicyId,
            returnPolicyId: existing.returnPolicyId,
            paymentPolicyId: existing.paymentPolicyId,
            publishStatus: existing.publishStatus,
            ebayListingId: existing.ebayListingId,
            publishError: existing.publishError,
          })
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [listingId])

  const update = useCallback((updates: Partial<EbayData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  // Apply AI analysis to eBay fields
  function applyAIAnalysis() {
    if (!aiAnalysis) return
    update({
      conditionId: aiAnalysis.conditionSuggestion,
      conditionDescription: aiAnalysis.conditionDescription,
      format: aiAnalysis.formatRecommendation,
      priceCents: aiAnalysis.estimatedPriceCents,
      currency: aiAnalysis.currency,
      itemSpecifics: aiAnalysis.itemSpecifics,
      auctionStartPriceCents:
        aiAnalysis.formatRecommendation === 'AUCTION'
          ? aiAnalysis.estimatedPriceCents
          : null,
    })
    toast.success(t('toastEbayFieldsApplied'))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveEbayListingData({
        data: {
          listingId,
          ebayAccountId: data.ebayAccountId,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          conditionId: data.conditionId,
          conditionDescription: data.conditionDescription,
          format: data.format,
          priceCents: data.priceCents,
          currency: data.currency,
          bestOfferEnabled: data.bestOfferEnabled,
          bestOfferAutoAcceptCents: data.bestOfferAutoAcceptCents,
          bestOfferMinAcceptCents: data.bestOfferMinAcceptCents,
          auctionStartPriceCents: data.auctionStartPriceCents,
          auctionReservePriceCents: data.auctionReservePriceCents,
          auctionDurationDays: data.auctionDurationDays,
          itemSpecifics: data.itemSpecifics,
          fulfillmentPolicyId: data.fulfillmentPolicyId,
          returnPolicyId: data.returnPolicyId,
          paymentPolicyId: data.paymentPolicyId,
        },
      })
      toast.success(t('toastListingSaved'))
    } catch {
      toast.error(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const selectedAccount = accounts.find((a) => a.id === data.ebayAccountId)
  const marketplace = (selectedAccount?.marketplace ?? 'EBAY_US') as EbayMarketplaceId
  const currency = EBAY_MARKETPLACES[marketplace]?.currency ?? 'USD'

  // Sync currency when account changes
  useEffect(() => {
    if (data.currency !== currency) {
      update({ currency })
    }
  }, [currency, data.currency, update])

  const debugMode = import.meta.env.DEV && accounts.length === 0

  if (!loaded) return null
  if (accounts.length === 0 && !import.meta.env.DEV) return null

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {t('ebayListing')}
            {debugMode && (
              <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                DEV MODE
              </Badge>
            )}
          </span>
          {data.publishStatus !== 'not_listed' && (
            <Badge
              variant={
                data.publishStatus === 'published' ? 'default' : 'secondary'
              }
            >
              {data.publishStatus}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account selector */}
        <div className="grid gap-2">
          <Label>{t('ebayAccount')}</Label>
          <Select
            value={data.ebayAccountId ?? ''}
            onValueChange={(val) => update({ ebayAccountId: val || null })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('selectAccount')} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AI Apply button */}
        {aiAnalysis && (
          <Button variant="secondary" onClick={applyAIAnalysis}>
            <Sparkles className="mr-2 h-4 w-4" />
            {t('applyEbayFields')}
          </Button>
        )}

        <Separator />

        {/* Two-column grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Category, Condition, Pricing */}
          <div className="space-y-4">
            <CategoryPicker
              accountId={data.ebayAccountId}
              categoryId={data.categoryId}
              categoryName={data.categoryName}
              onSelect={(catId, catName) =>
                update({ categoryId: catId, categoryName: catName })
              }
            />

            <Separator />

            <ConditionSelector
              conditionId={data.conditionId}
              conditionDescription={data.conditionDescription}
              onChange={(conditionId, conditionDescription) =>
                update({ conditionId, conditionDescription })
              }
            />

            <Separator />

            <PriceFormatConfig
              format={data.format}
              priceCents={data.priceCents}
              currency={data.currency}
              bestOfferEnabled={data.bestOfferEnabled}
              bestOfferAutoAcceptCents={data.bestOfferAutoAcceptCents}
              bestOfferMinAcceptCents={data.bestOfferMinAcceptCents}
              auctionStartPriceCents={data.auctionStartPriceCents}
              auctionReservePriceCents={data.auctionReservePriceCents}
              auctionDurationDays={data.auctionDurationDays}
              onChange={(updates) => update(updates as Partial<EbayData>)}
            />
          </div>

          {/* Right: Item Specifics, Business Policies */}
          <div className="space-y-4">
            <ItemSpecificsEditor
              specifics={data.itemSpecifics}
              onChange={(itemSpecifics) => update({ itemSpecifics })}
            />

            <Separator />

            <BusinessPolicySelectors
              accountId={data.ebayAccountId}
              fulfillmentPolicyId={data.fulfillmentPolicyId}
              returnPolicyId={data.returnPolicyId}
              paymentPolicyId={data.paymentPolicyId}
              onChange={(updates) => update(updates as Partial<EbayData>)}
            />
          </div>
        </div>

        <Separator />

        {/* Save + Publish */}
        <div className="flex items-center justify-between">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? t('saving') : t('saveDraft')}
          </Button>

          {data.ebayAccountId && (
            <PublishControls
              listingId={listingId}
              publishStatus={data.publishStatus}
              ebayListingId={data.ebayListingId}
              publishError={data.publishError}
              isSandbox={selectedAccount?.isSandbox ?? true}
              onStatusChange={(status, ebayListingId, error) =>
                update({
                  publishStatus: status,
                  ebayListingId: ebayListingId ?? data.ebayListingId,
                  publishError: error ?? null,
                })
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
