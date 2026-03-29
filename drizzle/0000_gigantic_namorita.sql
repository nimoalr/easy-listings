CREATE TYPE "public"."ebay_listing_format" AS ENUM('FIXED_PRICE', 'AUCTION');--> statement-breakpoint
CREATE TYPE "public"."ebay_publish_status" AS ENUM('not_listed', 'draft', 'published', 'ended', 'failed');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'processed');--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service" varchar(50) NOT NULL,
	"endpoint" varchar(100) NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"listing_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ebay_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(100) NOT NULL,
	"marketplace" varchar(20) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"ebay_user_id" varchar(255),
	"is_sandbox" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ebay_listing_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"ebay_account_id" uuid,
	"ebay_sku" varchar(50),
	"ebay_offer_id" varchar(50),
	"ebay_listing_id" varchar(50),
	"category_id" varchar(50),
	"category_name" varchar(255),
	"condition_id" varchar(20),
	"condition_description" text,
	"format" "ebay_listing_format" DEFAULT 'FIXED_PRICE' NOT NULL,
	"price_cents" integer,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"best_offer_enabled" boolean DEFAULT false NOT NULL,
	"best_offer_auto_accept_cents" integer,
	"best_offer_min_accept_cents" integer,
	"auction_start_price_cents" integer,
	"auction_reserve_price_cents" integer,
	"auction_duration_days" integer,
	"item_specifics" jsonb,
	"fulfillment_policy_id" varchar(50),
	"return_policy_id" varchar(50),
	"payment_policy_id" varchar(50),
	"ebay_image_urls" jsonb,
	"publish_status" "ebay_publish_status" DEFAULT 'not_listed' NOT NULL,
	"publish_error" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ebay_listing_data_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"file_path" varchar(512) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"ai_name" varchar(255),
	"ai_description" text,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ebay_listing_data" ADD CONSTRAINT "ebay_listing_data_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ebay_listing_data" ADD CONSTRAINT "ebay_listing_data_ebay_account_id_ebay_accounts_id_fk" FOREIGN KEY ("ebay_account_id") REFERENCES "public"."ebay_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;