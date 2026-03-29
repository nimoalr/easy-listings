# Easy Listings

eBay listing creation tool powered by AI image analysis.

## Tech Stack
- **Framework**: TanStack Start + React 19
- **UI**: shadcn/ui components (radix-ui primitives, via MCP server)
- **Database**: PostgreSQL (Docker Compose) + Drizzle ORM
- **AI**: Google GenAI SDK (model configured via `GEMINI_MODEL` env var)
- **Styling**: Tailwind CSS v4

## Development

```bash
docker compose up -d          # Start PostgreSQL
pnpm db:migrate               # Run migrations
pnpm dev                      # Start dev server on :3000
```

## Project Tracking
- Always use Linear with the **"easy-listings"** team for tracking projects, milestones, and issues
- Create Linear issues for any non-trivial work before starting implementation

## Testing
- Always run `pnpm test` after completing any task to ensure nothing is broken
- Tests live in `src/__tests__/` — add tests for any new pure functions or business logic
- Use Vitest with zero-mock approach: extract pure functions from server handlers to make them testable without mocking DB/API

## TanStack Start — Critical Rules

### Server Functions & Imports
- Server functions (`createServerFn`) can be imported from **route files** — the build replaces handlers with RPC stubs on the client
- **NEVER import server functions directly in component files** (`src/components/`). In dev mode, Node.js modules (pg, fs, etc.) leak into the client bundle and crash React hydration — all `useEffect` hooks and event handlers silently stop working
- Instead, call server functions in **route loaders** and pass data down as props or via context
- For data needed by layout components (e.g. sidebar counts), load it in `__root.tsx`'s loader and pass as props
- Pure data files (constants, types) are safe to import anywhere — just don't chain into Node.js modules

### Import Protection (vite.config.ts)
- `importProtection` in the TanStack Start plugin config denies Node.js modules on the client
- We deny `**/db/**` (files), `pg`, `node:fs`, `node:path`, `ebay-api` (specifiers) in the client environment
- In dev mode, denied imports are replaced with mock Proxies (behavior: `'mock'`). Warnings appear in the console but are safe — they confirm the protection is working
- In production, the compiler removes server-only code entirely — no warnings needed
- `log: 'once'` deduplicates repeated violation warnings

### File Organization (from TanStack docs)
```
src/server/
├── listings.ts           # Server function wrappers (createServerFn) — safe to import in routes
├── serve-image.ts        # Server functions + pure helpers (readImageAsDataUrl)
├── ebay-constants.ts     # Pure data (no Node.js modules) — safe to import anywhere
└── ebay-client.ts        # eBay API client (Node.js only, imported by other server files)
```

### Loaders Are Isomorphic
- Route loaders run on BOTH server and client — use `createServerFn()` for server-only operations inside loaders
- Never access `process.env` directly in loaders — use server functions

### Hydration
- Avoid `"use client"` directives — TanStack Start doesn't use React Server Components
- Components that need browser APIs (localStorage, matchMedia) must use `useEffect` for initialization, with SSR-safe defaults in `useState`
- Any hydration mismatch silently breaks all `useEffect` hooks and event handlers on the page

### Image Loading Pattern
- Load image data URLs server-side in route loaders (via `readImageAsDataUrl` pure function), not client-side via `useEffect`
- The `ListingThumbnail` component accepts a `src` prop — the route loader provides the data URL
- For dynamic image loading (e.g. after upload), use `getImageDataUrls` server function from route event handlers

## Conventions
- Use shadcn/ui components for all UI elements — add new ones via the shadcn MCP server or `pnpm dlx shadcn@latest add <component>`
- shadcn is configured with `radix-ui` primitives (not `@base-ui/react`) — all components use radix
- Server functions go in `src/server/` using `createServerFn` from TanStack Start
- Database schema lives in `src/db/schema.ts`; run `pnpm db:generate` after schema changes, then `pnpm db:migrate` to apply
- Images are stored on the local filesystem in `uploads/`
- Import alias: `@/` and `#/` both map to `src/`
- i18n: 11 languages supported, translation files in `src/i18n/`, pluralization via `_one`/`_other` key suffixes
