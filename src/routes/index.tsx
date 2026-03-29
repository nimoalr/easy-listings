import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getListings, createListing } from '@/server/listings'
import { Plus, Package } from 'lucide-react'
import { ListingThumbnail } from '@/components/listing-thumbnail'
import { useTranslation } from '@/i18n'

export const Route = createFileRoute('/')({
  loader: async () => {
    const all = await getListings()
    // Drafts = everything not published on eBay
    return all.filter((l) => l.ebayStatus !== 'published')
  },
  component: HomePage,
})

function HomePage() {
  const listings = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      const listing = await createListing({ data: { name, description } })
      setOpen(false)
      setName('')
      setDescription('')
      router.invalidate()
      navigate({ to: '/listings/$id', params: { id: listing.id } })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('drafts')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('myListingsDescription')}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('newListing')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createNewListing')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('itemName')}</Label>
                <Input
                  id="name"
                  placeholder={t('itemNamePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">
                  {t('briefDescription')}
                </Label>
                <Textarea
                  id="description"
                  placeholder={t('briefDescriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
              >
                {creating ? t('creating') : t('createDraft')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {listings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">{t('noListingsYet')}</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('noListingsHint')}
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newListing')}
          </Button>
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
                    <div className="flex gap-1">
                      {listing.ebayStatus && listing.ebayStatus !== 'not_listed' && (
                        <Badge
                          variant={
                            listing.ebayStatus === 'published'
                              ? 'default'
                              : listing.ebayStatus === 'failed'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {t(listing.ebayStatus === 'published' ? 'published' : listing.ebayStatus === 'draft' ? 'ebayDraft' : listing.ebayStatus === 'failed' ? 'publishFailed' : 'notListed')}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          listing.status === 'processed'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {t(listing.status === 'processed' ? 'statusProcessed' : 'statusDraft')}
                      </Badge>
                    </div>
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
