import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { I18nProvider } from '@/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { getListingCounts } from '@/server/listings'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Easy Listings' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  loader: () => getListingCounts(),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  const counts = Route.useLoaderData()

  return (
    <I18nProvider>
      <ThemeProvider defaultTheme="system">
      <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar counts={counts} />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 px-4 py-6">
            <div className="mx-auto max-w-5xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      </TooltipProvider>
      </ThemeProvider>
      <Toaster />
    </I18nProvider>
  )
}
