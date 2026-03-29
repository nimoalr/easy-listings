import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createElement, type ReactNode } from 'react'
import en from './en'
import fr from './fr'
import de from './de'
import es from './es'
import it from './it'
import ja from './ja'
import pt from './pt'
import nl from './nl'
import zh from './zh'
import ko from './ko'
import pl from './pl'

export type Locale = 'en' | 'fr' | 'de' | 'es' | 'it' | 'ja' | 'pt' | 'nl' | 'zh' | 'ko' | 'pl'
export type TranslationKey = keyof typeof en

export const SUPPORTED_LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
]

const VALID_LOCALES = new Set<string>(SUPPORTED_LOCALES.map((l) => l.value))

const dictionaries: Record<Locale, Record<string, string>> = { en, fr, de, es, it, ja, pt, nl, zh, ko, pl }

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' for SSR hydration consistency,
  // then sync from localStorage on mount
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem('locale')
    if (stored && VALID_LOCALES.has(stored) && stored !== 'en') {
      setLocaleState(stored as Locale)
      document.documentElement.lang = stored
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const dict = dictionaries[locale]
      const fallback = dictionaries.en

      // Pluralization: if vars includes 'count', try _one / _other suffixes
      let resolvedKey = key
      if (vars && 'count' in vars) {
        const pluralSuffix = vars.count === 1 ? '_one' : '_other'
        const pluralKey = `${key}${pluralSuffix}`
        if (pluralKey in dict) {
          resolvedKey = pluralKey as TranslationKey
        }
      }

      let value: string = dict[resolvedKey as string] ?? fallback[resolvedKey as string] ?? (resolvedKey as string)
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replaceAll(`{{${k}}}`, String(v))
        }
      }
      return value
    },
    [locale],
  )

  return createElement(I18nContext.Provider, { value: { locale, setLocale, t } }, children)
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}

/** Format a currency amount (in cents) for display */
export function formatCurrency(cents: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

/** Format a date for display */
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}
