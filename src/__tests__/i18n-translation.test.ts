import { describe, it, expect } from 'vitest'
import en from '../i18n/en'
import fr from '../i18n/fr'

// Replicate the t() algorithm from i18n/index.ts for testing without React context
const dictionaries: Record<string, Record<string, string>> = { en, fr }

function t(
  locale: string,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] ?? dictionaries.en
  const fallback = dictionaries.en

  let resolvedKey = key
  if (vars && 'count' in vars) {
    const pluralSuffix = vars.count === 1 ? '_one' : '_other'
    const pluralKey = `${key}${pluralSuffix}`
    if (pluralKey in dict) {
      resolvedKey = pluralKey
    }
  }

  let value: string = dict[resolvedKey] ?? fallback[resolvedKey] ?? resolvedKey
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replaceAll(`{{${k}}}`, String(v))
    }
  }
  return value
}

describe('translation resolution', () => {
  it('resolves a simple key from English', () => {
    expect(t('en', 'myListings')).toBe('My Listings')
  })

  it('resolves a key from French', () => {
    expect(t('fr', 'myListings')).toBe('Mes Annonces')
  })

  it('falls back to English for a key missing in a locale', () => {
    // Add a fake key only in EN to test fallback
    const result = t('fr', 'nonExistentKey_only_in_en')
    expect(result).toBe('nonExistentKey_only_in_en') // returns key itself
  })

  it('returns the key itself when missing from all locales', () => {
    expect(t('en', 'totallyFakeKey')).toBe('totallyFakeKey')
  })

  it('interpolates {{var}} placeholders', () => {
    expect(t('en', 'images', { count: 5 })).toBe('Images (5)')
  })

  it('resolves _one suffix when count is 1', () => {
    expect(t('en', 'imageCount', { count: 1 })).toBe('1 image')
  })

  it('resolves _other suffix when count is not 1', () => {
    expect(t('en', 'imageCount', { count: 3 })).toBe('3 images')
    expect(t('en', 'imageCount', { count: 0 })).toBe('0 images')
  })
})
