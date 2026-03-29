import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/i18n'

type Props = {
  format: 'FIXED_PRICE' | 'AUCTION'
  priceCents: number | null
  currency: string
  bestOfferEnabled: boolean
  bestOfferAutoAcceptCents: number | null
  bestOfferMinAcceptCents: number | null
  auctionStartPriceCents: number | null
  auctionReservePriceCents: number | null
  auctionDurationDays: number | null
  onChange: (updates: Partial<Props>) => void
}

export function centsToDisplay(cents: number | null): string {
  if (cents === null || cents === 0) return ''
  return (cents / 100).toFixed(2)
}

export function displayToCents(value: string): number | null {
  const num = parseFloat(value)
  if (isNaN(num)) return null
  return Math.round(num * 100)
}

export function PriceFormatConfig(props: Props) {
  const { t } = useTranslation()
  const { format, onChange } = props

  return (
    <div className="space-y-4">
      {/* Format toggle */}
      <div className="grid gap-2">
        <Label>{t('listingFormat')}</Label>
        <div className="flex gap-1">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              format === 'FIXED_PRICE'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            onClick={() => onChange({ format: 'FIXED_PRICE' })}
          >
            {t('fixedPrice')}
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              format === 'AUCTION'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            onClick={() => onChange({ format: 'AUCTION' })}
          >
            {t('auction')}
          </button>
        </div>
      </div>

      {format === 'FIXED_PRICE' ? (
        <>
          {/* Fixed price */}
          <div className="grid gap-2">
            <Label>{t('price')} ({props.currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={centsToDisplay(props.priceCents)}
              onChange={(e) => onChange({ priceCents: displayToCents(e.target.value) })}
            />
          </div>

          {/* Best Offer */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={props.bestOfferEnabled}
                onChange={(e) => onChange({ bestOfferEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              {t('bestOfferEnabled')}
            </label>

            {props.bestOfferEnabled && (
              <div className="grid gap-3 pl-6 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label className="text-xs">{t('autoAcceptPrice')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={centsToDisplay(props.bestOfferAutoAcceptCents)}
                    onChange={(e) =>
                      onChange({ bestOfferAutoAcceptCents: displayToCents(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">{t('minAcceptPrice')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={centsToDisplay(props.bestOfferMinAcceptCents)}
                    onChange={(e) =>
                      onChange({ bestOfferMinAcceptCents: displayToCents(e.target.value) })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Auction */}
          <div className="grid gap-2">
            <Label>{t('startingPrice')} ({props.currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={centsToDisplay(props.auctionStartPriceCents)}
              onChange={(e) =>
                onChange({ auctionStartPriceCents: displayToCents(e.target.value) })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>{t('reservePrice')} ({props.currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={centsToDisplay(props.auctionReservePriceCents)}
              onChange={(e) =>
                onChange({ auctionReservePriceCents: displayToCents(e.target.value) })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>{t('auctionDuration')}</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={props.auctionDurationDays ?? 7}
              onChange={(e) => onChange({ auctionDurationDays: Number(e.target.value) })}
            >
              {[1, 3, 5, 7, 10].map((d) => (
                <option key={d} value={d}>
                  {t('auctionDays', { count: d })}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  )
}
