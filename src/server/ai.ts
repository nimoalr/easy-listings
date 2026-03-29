import { createServerFn } from '@tanstack/react-start'
import { GoogleGenAI } from '@google/genai'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { EBAY_MARKETPLACES, type EbayMarketplaceId } from './ebay-constants'
import { logApiUsage } from './api-usage'
import { db } from '../db'
import { listings } from '../db/schema'
import { eq } from 'drizzle-orm'

export const LOCALE_LANGUAGES: Record<string, string> = {
  fr: 'French (français)',
  de: 'German (Deutsch)',
  es: 'Spanish (español)',
  it: 'Italian (italiano)',
  ja: 'Japanese (日本語)',
  pt: 'Portuguese (português)',
  nl: 'Dutch (Nederlands)',
  zh: 'Simplified Chinese (简体中文)',
  ko: 'Korean (한국어)',
  pl: 'Polish (polski)',
}

export function getSystemPrompt(locale: string): string {
  const lang = LOCALE_LANGUAGES[locale]
  const languageInstruction = lang
    ? `\n\nIMPORTANT: You MUST write the correctedName and description fields entirely in ${lang}.`
    : ''

  return `You are an expert at identifying items for sale on eBay. Given one or more images of an item along with a user-provided name and description, you must:

1. Identify the item as accurately as possible (brand, model, condition, key features)
2. Correct the item name if the user's name is inaccurate or incomplete
3. Write a compelling eBay listing description that would help sell the item

Respond in JSON format with exactly these fields:
{
  "correctedName": "The accurate, complete name for this item",
  "description": "A well-written eBay listing description (2-3 paragraphs, highlighting key features, condition, and selling points)"
}

Only respond with valid JSON. Do not include markdown code fences.${languageInstruction}`
}

export const analyzeListing = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      listingId: string
      name: string
      description: string
      imagePaths: string[]
      locale: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured. Please add it to your .env file.',
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    const imageParts = data.imagePaths.map((imgPath: string) => {
      const fullPath = path.resolve(process.cwd(), imgPath)
      const buffer = fs.readFileSync(fullPath)
      const ext = path.extname(imgPath).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      }
      return {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeMap[ext] || 'image/jpeg',
        },
      }
    })

    const startTime = Date.now()
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          role: 'user',
          parts: [
            ...imageParts,
            {
              text: `Item name: ${data.name}\nUser description: ${data.description || 'No description provided'}\n\nPlease identify this item and write an eBay listing description.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: getSystemPrompt(data.locale),
        temperature: 0.3,
      },
    })
    const durationMs = Date.now() - startTime

    const usage = response.usageMetadata
    logApiUsage({
      service: 'gemini',
      endpoint: 'analyzeListing',
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      durationMs,
    }).catch(() => {})

    const text = response.text ?? ''
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let result: { correctedName: string; description: string }
    try {
      result = JSON.parse(cleaned) as { correctedName: string; description: string }
    } catch {
      result = {
        correctedName: data.name,
        description: `AI analysis failed to parse. Raw response: ${text}`,
      }
    }

    // Save to DB server-side so results persist even if client navigates away
    await db
      .update(listings)
      .set({
        aiName: result.correctedName,
        aiDescription: result.description,
        status: 'processed',
        updatedAt: new Date(),
      })
      .where(eq(listings.id, data.listingId))

    return result
  })

// --- eBay-enhanced AI analysis ---

export type EbayAIAnalysis = {
  correctedName: string
  description: string
  titleSuggestion: string
  suggestedCategoryKeywords: string[]
  conditionSuggestion: string
  conditionDescription: string
  estimatedPriceCents: number
  currency: string
  formatRecommendation: 'FIXED_PRICE' | 'AUCTION'
  formatReason: string
  itemSpecifics: Array<{ name: string; value: string }>
}

export function getEbaySystemPrompt(locale: string, currency: string): string {
  const lang = LOCALE_LANGUAGES[locale]
  const languageInstruction = lang
    ? `\nIMPORTANT: Write the correctedName, description, titleSuggestion, conditionDescription, and formatReason fields in ${lang}. Keep itemSpecifics names in English (they are eBay field names).`
    : ''

  return `You are an expert eBay seller and item identification specialist. Given images of an item along with a user-provided name and description, provide a comprehensive analysis for creating an eBay listing.

You must:
1. Identify the item accurately (brand, model, condition, key features)
2. Suggest an eBay-optimized title (max 80 characters, front-load keywords)
3. Write a compelling eBay listing description (2-3 paragraphs)
4. Suggest eBay category keywords for searching the category tree
5. Assess the item's condition from the images using one of these exact eBay condition values: NEW, LIKE_NEW, NEW_OTHER, NEW_WITH_DEFECTS, CERTIFIED_REFURBISHED, SELLER_REFURBISHED, USED_EXCELLENT, USED_VERY_GOOD, USED_GOOD, USED_ACCEPTABLE, FOR_PARTS_OR_NOT_WORKING
6. Estimate a fair market price in ${currency} (as cents integer, e.g. 2999 for $29.99)
7. Recommend listing format: FIXED_PRICE for common items, AUCTION for rare/collectible items
8. Extract all identifiable item specifics (Brand, Model, Color, Material, Size, etc.)

Respond with valid JSON matching this exact structure:
{
  "correctedName": "Accurate, complete item name",
  "description": "eBay listing description (2-3 paragraphs, HTML allowed)",
  "titleSuggestion": "eBay-optimized title, max 80 chars, keyword-rich",
  "suggestedCategoryKeywords": ["keyword1", "keyword2", "keyword3"],
  "conditionSuggestion": "USED_GOOD",
  "conditionDescription": "Brief condition notes visible to buyers",
  "estimatedPriceCents": 2999,
  "currency": "${currency}",
  "formatRecommendation": "FIXED_PRICE",
  "formatReason": "Brief explanation of why this format was chosen",
  "itemSpecifics": [{"name": "Brand", "value": "Sony"}, {"name": "Model", "value": "WM-10"}]
}

Only respond with valid JSON. Do not include markdown code fences.${languageInstruction}`
}

export const analyzeListingForEbay = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      listingId: string
      name: string
      description: string
      imagePaths: string[]
      locale: string
      marketplace?: string
    }) => data,
  )
  .handler(async ({ data }): Promise<EbayAIAnalysis> => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured. Please add it to your .env file.',
      )
    }

    const marketplace = (data.marketplace ?? 'EBAY_US') as EbayMarketplaceId
    const currency = EBAY_MARKETPLACES[marketplace]?.currency ?? 'USD'

    const ai = new GoogleGenAI({ apiKey })

    const imageParts = data.imagePaths.map((imgPath: string) => {
      const fullPath = path.resolve(process.cwd(), imgPath)
      const buffer = fs.readFileSync(fullPath)
      const ext = path.extname(imgPath).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      }
      return {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeMap[ext] || 'image/jpeg',
        },
      }
    })

    const startTime = Date.now()
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          role: 'user',
          parts: [
            ...imageParts,
            {
              text: `Item name: ${data.name}\nUser description: ${data.description || 'No description provided'}\nTarget marketplace: ${marketplace}\n\nPlease analyze this item for an eBay listing.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: getEbaySystemPrompt(data.locale, currency),
        temperature: 0.3,
      },
    })
    const durationMs = Date.now() - startTime

    const usage = response.usageMetadata
    logApiUsage({
      service: 'gemini',
      endpoint: 'analyzeListingForEbay',
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      durationMs,
    }).catch(() => {})

    const text = response.text ?? ''
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let result: EbayAIAnalysis
    try {
      result = JSON.parse(cleaned) as EbayAIAnalysis
    } catch {
      result = {
        correctedName: data.name,
        description: 'AI analysis failed to parse.',
        titleSuggestion: data.name.slice(0, 80),
        suggestedCategoryKeywords: [],
        conditionSuggestion: 'USED_GOOD',
        conditionDescription: '',
        estimatedPriceCents: 0,
        currency,
        formatRecommendation: 'FIXED_PRICE',
        formatReason: 'Default',
        itemSpecifics: [],
      }
    }

    // Save to DB server-side so results persist even if client navigates away
    await db
      .update(listings)
      .set({
        aiName: result.titleSuggestion || result.correctedName,
        aiDescription: result.description,
        status: 'processed',
        updatedAt: new Date(),
      })
      .where(eq(listings.id, data.listingId))

    return result
  })
