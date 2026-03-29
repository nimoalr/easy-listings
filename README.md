# Easy Listings

Take photos of stuff you want to sell, and AI writes the eBay listing for you.

Upload images, hit "Analyze with AI", and get a complete listing — title, description, condition, price estimate, item specifics — all generated from your photos. Then publish straight to eBay.

## What it does

- **AI-powered listing creation** — Gemini analyzes your item photos and writes everything
- **eBay integration** — Connect your account, configure pricing/shipping, publish directly
- **11 languages** — EN, FR, DE, ES, IT, JA, PT, NL, ZH, KO, PL (AI generates content in your language)
- **Draft workflow** — Prep listings at your pace, publish when ready

## Stack

TanStack Start, React 19, PostgreSQL, Drizzle ORM, Google Gemini, Tailwind CSS, shadcn/ui

## Setup

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | Google AI API key ([get one here](https://aistudio.google.com/apikey)) |
| `GEMINI_MODEL` | Yes | Gemini model to use (e.g. `gemini-3.1-pro-preview`) |
| `EBAY_CLIENT_ID` | No | eBay developer App ID — needed to publish listings |
| `EBAY_CLIENT_SECRET` | No | eBay developer Cert ID — needed to publish listings |
| `EBAY_REDIRECT_URI` | No | OAuth callback URL (default: `http://localhost:3000/auth/ebay/callback`) |
| `EBAY_SANDBOX` | No | `true` for eBay sandbox, `false` for production |
| `APP_URL` | No | Public URL for image hosting (default: `http://localhost:3000`) |

## License

Source-available. Personal use and self-hosting allowed. Commercial use requires a license — see [LICENSE](LICENSE).
