import { createFileRoute, redirect } from '@tanstack/react-router'
import { handleEbayCallback } from '@/server/ebay-auth'

export const Route = createFileRoute('/auth/ebay/callback')({
  loaderDeps: ({ search }) => ({
    code: (search as Record<string, string>).code,
    state: (search as Record<string, string>).state,
  }),
  loader: async ({ deps }) => {
    if (deps.code && deps.state) {
      await handleEbayCallback({ data: { code: deps.code, state: deps.state } })
    }
    throw redirect({ to: '/settings' })
  },
  component: () => (
    <div className="flex items-center justify-center py-16">
      <p className="text-muted-foreground">Connecting to eBay...</p>
    </div>
  ),
})
