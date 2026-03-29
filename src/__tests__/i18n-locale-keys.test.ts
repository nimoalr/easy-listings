import { describe, it, expect } from 'vitest'
import en from '../i18n/en'
import fr from '../i18n/fr'
import de from '../i18n/de'
import es from '../i18n/es'
import it_ from '../i18n/it'
import ja from '../i18n/ja'
import pt from '../i18n/pt'
import nl from '../i18n/nl'
import zh from '../i18n/zh'
import ko from '../i18n/ko'
import pl from '../i18n/pl'

const enKeys = Object.keys(en).sort()

const locales: Record<string, Record<string, string>> = {
  fr, de, es, it: it_, ja, pt, nl, zh, ko, pl,
}

describe('locale key completeness', () => {
  it.each(Object.keys(locales))(
    'locale "%s" has exactly the same keys as English',
    (locale) => {
      const localeKeys = Object.keys(locales[locale]).sort()
      expect(localeKeys).toEqual(enKeys)
    },
  )
})
