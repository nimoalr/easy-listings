import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/i18n'
import { Plus, X } from 'lucide-react'

type ItemSpecific = { name: string; value: string }

type AspectInfo = {
  name: string
  required: boolean
  values: string[]
}

type Props = {
  specifics: ItemSpecific[]
  requiredAspects?: AspectInfo[]
  onChange: (specifics: ItemSpecific[]) => void
}

export function ItemSpecificsEditor({ specifics, requiredAspects = [], onChange }: Props) {
  const { t } = useTranslation()

  const requiredNames = new Set(requiredAspects.filter((a) => a.required).map((a) => a.name))

  function updateSpecific(index: number, field: 'name' | 'value', val: string) {
    const updated = [...specifics]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  function removeSpecific(index: number) {
    onChange(specifics.filter((_, i) => i !== index))
  }

  function addSpecific() {
    onChange([...specifics, { name: '', value: '' }])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{t('itemSpecifics')}</Label>
        <Button variant="ghost" size="sm" onClick={addSpecific}>
          <Plus className="mr-1 h-3 w-3" />
          {t('addSpecific')}
        </Button>
      </div>

      {specifics.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No item specifics yet. Click "Add" or run AI analysis.
        </p>
      ) : (
        <div className="space-y-2">
          {specifics.map((spec, i) => {
            const isRequired = requiredNames.has(spec.name)
            const aspect = requiredAspects.find((a) => a.name === spec.name)
            const hasAllowedValues = aspect && aspect.values.length > 0

            return (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder={t('aspectName')}
                  value={spec.name}
                  onChange={(e) => updateSpecific(i, 'name', e.target.value)}
                />
                {hasAllowedValues ? (
                  <select
                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={spec.value}
                    onChange={(e) => updateSpecific(i, 'value', e.target.value)}
                  >
                    <option value="">—</option>
                    {aspect.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    className="flex-1"
                    placeholder={t('aspectValue')}
                    value={spec.value}
                    onChange={(e) => updateSpecific(i, 'value', e.target.value)}
                  />
                )}
                {isRequired && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {t('required')}
                  </Badge>
                )}
                {!isRequired && (
                  <button
                    onClick={() => removeSpecific(i)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
