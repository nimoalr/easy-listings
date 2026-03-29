import { useState, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/i18n'
import { searchEbayCategories } from '@/server/ebay-taxonomy'

type CategorySuggestion = {
  categoryId: string
  categoryName: string
  ancestors: string[]
}

type Props = {
  accountId: string | null
  categoryId: string | null
  categoryName: string | null
  onSelect: (categoryId: string, categoryName: string) => void
}

export function CategoryPicker({ accountId, categoryId: _categoryId, categoryName, onSelect }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (!value.trim() || !accountId) {
        setSuggestions([])
        setShowDropdown(false)
        return
      }

      debounceRef.current = setTimeout(async () => {
        setSearching(true)
        try {
          const results = await searchEbayCategories({
            data: { accountId, query: value },
          })
          setSuggestions(results)
          setShowDropdown(results.length > 0)
        } catch {
          setSuggestions([])
        } finally {
          setSearching(false)
        }
      }, 300)
    },
    [accountId],
  )

  function handleSelect(suggestion: CategorySuggestion) {
    const fullPath = [...suggestion.ancestors, suggestion.categoryName].join(' > ')
    onSelect(suggestion.categoryId, fullPath)
    setQuery('')
    setShowDropdown(false)
    setSuggestions([])
  }

  return (
    <div className="grid gap-2">
      <Label>{t('ebayCategory')}</Label>
      {categoryName && (
        <p className="text-sm text-muted-foreground">{categoryName}</p>
      )}
      <div className="relative">
        <Input
          placeholder={t('searchCategories')}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          disabled={!accountId}
        />
        {searching && (
          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">...</span>
        )}
        {showDropdown && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
            {suggestions.map((s) => (
              <button
                key={s.categoryId}
                className="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={() => handleSelect(s)}
              >
                <span className="text-muted-foreground">
                  {s.ancestors.join(' > ')}
                  {s.ancestors.length > 0 && ' > '}
                </span>
                <span className="font-medium">{s.categoryName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
