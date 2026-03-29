import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/i18n'

const CONDITIONS = [
  { id: 'NEW', label: 'New' },
  { id: 'LIKE_NEW', label: 'Like New' },
  { id: 'NEW_OTHER', label: 'New (Other)' },
  { id: 'NEW_WITH_DEFECTS', label: 'New with Defects' },
  { id: 'CERTIFIED_REFURBISHED', label: 'Certified Refurbished' },
  { id: 'SELLER_REFURBISHED', label: 'Seller Refurbished' },
  { id: 'USED_EXCELLENT', label: 'Used - Excellent' },
  { id: 'USED_VERY_GOOD', label: 'Used - Very Good' },
  { id: 'USED_GOOD', label: 'Used - Good' },
  { id: 'USED_ACCEPTABLE', label: 'Used - Acceptable' },
  { id: 'FOR_PARTS_OR_NOT_WORKING', label: 'For Parts or Not Working' },
] as const

type Props = {
  conditionId: string | null
  conditionDescription: string | null
  onChange: (conditionId: string, conditionDescription: string) => void
}

export function ConditionSelector({ conditionId, conditionDescription, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <Label>{t('ebayCondition')}</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={conditionId ?? ''}
          onChange={(e) => onChange(e.target.value, conditionDescription ?? '')}
        >
          <option value="">—</option>
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label>{t('conditionDescription')}</Label>
        <Textarea
          placeholder={t('conditionDescriptionPlaceholder')}
          value={conditionDescription ?? ''}
          onChange={(e) => onChange(conditionId ?? '', e.target.value)}
          rows={2}
        />
      </div>
    </div>
  )
}
