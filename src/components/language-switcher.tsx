import { useState, useRef, useEffect } from 'react'
import { useTranslation, SUPPORTED_LOCALES } from '@/i18n'
import { Globe, ChevronDown, Check } from 'lucide-react'

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = SUPPORTED_LOCALES.find((l) => l.value === locale)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span>{current?.flag}</span>
        <span className="hidden sm:inline">{current?.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l.value}
              onClick={() => {
                setLocale(l.value)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                locale === l.value ? 'bg-accent/50 font-medium' : ''
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {locale === l.value && (
                <Check className="h-4 w-4 text-foreground" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
