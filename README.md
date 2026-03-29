# Easy Listings

Take photos of stuff you want to sell, and AI writes the eBay listing for you.

Upload images, hit "Analyze with AI", and get a complete listing — title, description, condition, price estimate, item specifics — all generated from your photos. Then publish straight to eBay.

## What it does

- **AI-powered listing creation** — Gemini 2.5 Pro analyzes your item photos and writes everything
- **eBay integration** — Connect your account, configure pricing/shipping, publish directly
- **11 languages** — EN, FR, DE, ES, IT, JA, PT, NL, ZH, KO, PL (AI generates content in your language)
- **Draft workflow** — Prep listings at your pace, publish when ready

## Stack

TanStack Start, React 19, PostgreSQL, Drizzle ORM, Gemini AI, Tailwind CSS, shadcn/ui

## Setup

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm dev
```

Copy `.env.example` to `.env` and add your Gemini API key. eBay keys are optional until you want to publish.

## License

Source-available. Personal use and self-hosting allowed. Commercial use requires a license — see [LICENSE](LICENSE).
