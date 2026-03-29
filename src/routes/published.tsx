import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getListings } from '@/server/listings'
import { Package } from 'lucide-react'
import { ListingThumbnail } from '@/components/listing-thumbnail'
import { useTranslation } from '@/i18n'

export const Route = createFileRoute('/published')({
  loader: async () => {
    const all = await getListings()
    return all.filter((l) => l.ebayStatus === 'published')
  },
  component: PublishedPage,
})

function PublishedPage() {
  const listings = Route.useLoaderData()
  const { t, locale } = useTranslation()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('publishedListings')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('myListingsDescription')}
        </p>
      </div>

      {listings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">{t('noListingsYet')}</p>
          <p className="text-sm text-muted-foreground">
            {t('noListingsHint')}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to="/listings/$id"
              params={{ id: listing.id }}
              className="no-underline"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1 text-base">
                      {listing.aiName || listing.name}
                    </CardTitle>
                    <Badge variant="default">
                      {t('published')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  {listing.images.length > 0 ? (
                    <ListingThumbnail
                      src={listing.thumbnailSrc}
                      alt={listing.name}
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-md bg-muted">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  {t('imageCount', { count: listing.images.length })} &middot;{' '}
                  {new Date(listing.createdAt).toLocaleDateString(locale)}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
