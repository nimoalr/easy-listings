import { describe, it, expect } from 'vitest'
import {
  getSystemPrompt,
  getEbaySystemPrompt,
  LOCALE_LANGUAGES,
} from '../server/ai'

describe('getSystemPrompt', () => {
  it('returns prompt without language instruction for English', () => {
    const prompt = getSystemPrompt('en')
    expect(prompt).not.toContain('IMPORTANT')
    expect(prompt).toContain('correctedName')
  })

  it('includes language instruction for French', () => {
    const prompt = getSystemPrompt('fr')
    expect(prompt).toContain('IMPORTANT')
    expect(prompt).toContain('French')
  })

  it.each(Object.keys(LOCALE_LANGUAGES))(
    'includes language instruction for locale "%s"',
    (locale) => {
      const prompt = getSystemPrompt(locale)
      expect(prompt).toContain('IMPORTANT')
    },
  )
})

describe('getEbaySystemPrompt', () => {
  it('includes the currency code in the prompt', () => {
    const prompt = getEbaySystemPrompt('en', 'GBP')
    expect(prompt).toContain('GBP')
  })

  it('includes JSON structure specification', () => {
    const prompt = getEbaySystemPrompt('en', 'USD')
    expect(prompt).toContain('correctedName')
    expect(prompt).toContain('estimatedPriceCents')
    expect(prompt).toContain('itemSpecifics')
  })

  it('omits language instruction for English locale', () => {
    const prompt = getEbaySystemPrompt('en', 'USD')
    expect(prompt).not.toContain('IMPORTANT')
  })

  it('includes language instruction for non-English locale', () => {
    const prompt = getEbaySystemPrompt('de', 'EUR')
    expect(prompt).toContain('IMPORTANT')
    expect(prompt).toContain('German')
  })
})
