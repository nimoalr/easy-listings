import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'

// --- Enums ---

export const listingStatusEnum = pgEnum('listing_status', ['draft', 'processed'])

export const ebayListingFormatEnum = pgEnum('ebay_listing_format', [
  'FIXED_PRICE',
  'AUCTION',
])

export const ebayPublishStatusEnum = pgEnum('ebay_publish_status', [
  'not_listed',
  'draft',
  'published',
  'ended',
  'failed',
])

// --- Core tables ---

export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default(''),
  aiName: varchar('ai_name', { length: 255 }),
  aiDescription: text('ai_description'),
  status: listingStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const listingImages = pgTable('listing_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  listingId: uuid('listing_id')
    .references(() => listings.id, { onDelete: 'cascade' })
    .notNull(),
  filePath: varchar('file_path', { length: 512 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- API usage tracking ---

export const apiUsageLogs = pgTable('api_usage_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  service: varchar('service', { length: 50 }).notNull(),
  endpoint: varchar('endpoint', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }),
  inputTokens: integer('input_tokens').default(0).notNull(),
  outputTokens: integer('output_tokens').default(0).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  costCents: integer('cost_cents').default(0).notNull(),
  durationMs: integer('duration_ms').default(0).notNull(),
  listingId: uuid('listing_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- eBay tables ---

export const ebayAccounts = pgTable('ebay_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: varchar('label', { length: 100 }).notNull(),
  marketplace: varchar('marketplace', { length: 20 }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  ebayUserId: varchar('ebay_user_id', { length: 255 }),
  isSandbox: boolean('is_sandbox').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const ebayListingData = pgTable('ebay_listing_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  listingId: uuid('listing_id')
    .references(() => listings.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  ebayAccountId: uuid('ebay_account_id')
    .references(() => ebayAccounts.id, { onDelete: 'set null' }),
  ebaySku: varchar('ebay_sku', { length: 50 }),
  ebayOfferId: varchar('ebay_offer_id', { length: 50 }),
  ebayListingId: varchar('ebay_listing_id', { length: 50 }),
  categoryId: varchar('category_id', { length: 50 }),
  categoryName: varchar('category_name', { length: 255 }),
  conditionId: varchar('condition_id', { length: 20 }),
  conditionDescription: text('condition_description'),
  format: ebayListingFormatEnum('format').default('FIXED_PRICE').notNull(),
  priceCents: integer('price_cents'),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  bestOfferEnabled: boolean('best_offer_enabled').default(false).notNull(),
  bestOfferAutoAcceptCents: integer('best_offer_auto_accept_cents'),
  bestOfferMinAcceptCents: integer('best_offer_min_accept_cents'),
  auctionStartPriceCents: integer('auction_start_price_cents'),
  auctionReservePriceCents: integer('auction_reserve_price_cents'),
  auctionDurationDays: integer('auction_duration_days'),
  itemSpecifics: jsonb('item_specifics').$type<Array<{ name: string; value: string }>>(),
  fulfillmentPolicyId: varchar('fulfillment_policy_id', { length: 50 }),
  returnPolicyId: varchar('return_policy_id', { length: 50 }),
  paymentPolicyId: varchar('payment_policy_id', { length: 50 }),
  ebayImageUrls: jsonb('ebay_image_urls').$type<string[]>(),
  publishStatus: ebayPublishStatusEnum('publish_status').default('not_listed').notNull(),
  publishError: text('publish_error'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
