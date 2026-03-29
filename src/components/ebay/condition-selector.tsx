import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
        <Select
          value={conditionId ?? ''}
          onValueChange={(val) => onChange(val, conditionDescription ?? '')}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
