import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/i18n'
import { getEbayBusinessPolicies } from '@/server/ebay-listing'

type Policy = { id: string; name: string }

type Props = {
  accountId: string | null
  fulfillmentPolicyId: string | null
  returnPolicyId: string | null
  paymentPolicyId: string | null
  onChange: (updates: {
    fulfillmentPolicyId?: string | null
    returnPolicyId?: string | null
    paymentPolicyId?: string | null
  }) => void
}

export function BusinessPolicySelectors({
  accountId,
  fulfillmentPolicyId,
  returnPolicyId,
  paymentPolicyId,
  onChange,
}: Props) {
  const { t } = useTranslation()
  const [policies, setPolicies] = useState<{
    fulfillment: Policy[]
    returns: Policy[]
    payment: Policy[]
  }>({ fulfillment: [], returns: [], payment: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!accountId) return
    setLoading(true)
    getEbayBusinessPolicies({ data: accountId })
      .then(setPolicies)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accountId])

  if (!accountId) return null

  const selectClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

  const noPolicies =
    policies.fulfillment.length === 0 &&
    policies.returns.length === 0 &&
    policies.payment.length === 0

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading policies...</p>
  }

  if (noPolicies) {
    return (
      <p className="text-sm text-muted-foreground">{t('noPoliciesFound')}</p>
    )
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{t('businessPolicies')}</Label>

      {policies.fulfillment.length > 0 && (
        <div className="grid gap-1">
          <Label className="text-xs">{t('fulfillmentPolicy')}</Label>
          <select
            className={selectClass}
            value={fulfillmentPolicyId ?? ''}
            onChange={(e) =>
              onChange({ fulfillmentPolicyId: e.target.value || null })
            }
          >
            <option value="">—</option>
            {policies.fulfillment.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {policies.returns.length > 0 && (
        <div className="grid gap-1">
          <Label className="text-xs">{t('returnPolicy')}</Label>
          <select
            className={selectClass}
            value={returnPolicyId ?? ''}
            onChange={(e) =>
              onChange({ returnPolicyId: e.target.value || null })
            }
          >
            <option value="">—</option>
            {policies.returns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {policies.payment.length > 0 && (
        <div className="grid gap-1">
          <Label className="text-xs">{t('paymentPolicy')}</Label>
          <select
            className={selectClass}
            value={paymentPolicyId ?? ''}
            onChange={(e) =>
              onChange({ paymentPolicyId: e.target.value || null })
            }
          >
            <option value="">—</option>
            {policies.payment.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
