import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState, useCallback, lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getListing, updateListing, deleteListing } from '@/server/listings'
import { uploadImages, deleteImage } from '@/server/images'
import { analyzeListing, analyzeListingForEbay, type EbayAIAnalysis } from '@/server/ai'
import { getEbayAccounts } from '@/server/ebay-auth'
import { getImageDataUrls } from '@/server/serve-image'
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Save,
  Trash2,
  X,
  Loader2,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n'
import { ImageZoomModal } from '@/components/image-zoom-modal'
const EbayListingSection = lazy(() => import('@/components/ebay/ebay-listing-section').then(m => ({ default: m.EbayListingSection })))

type ListingImage = {
  id: string
  listingId: string
  filePath: string
  originalFilename: string
  order: number
  createdAt: Date
}

export const Route = createFileRoute('/listings/$id')({
  loader: async ({ params }) => {
    const [listing, ebayAccounts] = await Promise.all([
      getListing({ data: params.id }),
      getEbayAccounts().catch(() => []),
    ])
    return { listing, ebayAccounts }
  },
  component: ListingDetailPage,
})

function ListingDetailPage() {
  const { listing, ebayAccounts } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const { t, locale } = useTranslation()

  const [name, setName] = useState(listing.name)
  const [description, setDescription] = useState(listing.description ?? '')
  const [aiName, setAiName] = useState(listing.aiName ?? '')
  const [aiDescription, setAiDescription] = useState(
    listing.aiDescription ?? '',
  )
  const [images, setImages] = useState<ListingImage[]>(listing.images)
  const [imageSrcs, setImageSrcs] = useState<Record<string, string>>(listing.imageSrcs ?? {})
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null)
  const [ebayAIAnalysis, setEbayAIAnalysis] = useState<EbayAIAnalysis | null>(null)
  const [aiApplied, setAiApplied] = useState(false)

  const handleFileUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      setUploading(true)
      try {
        const files: Array<{ name: string; base64: string }> = []
        for (const file of Array.from(fileList)) {
          const buffer = await file.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              '',
            ),
          )
          files.push({ name: file.name, base64 })
        }

        const newImages = await uploadImages({
          data: { listingId: listing.id, files },
        })
        setImages((prev) => [...prev, ...newImages])

        // Load the new image data URLs
        const newSrcs = await getImageDataUrls({
          data: newImages.map((img) => ({ id: img.id, filePath: img.filePath })),
        })
        setImageSrcs((prev) => ({ ...prev, ...newSrcs }))

        toast.success(t('toastImageUploaded', { count: newImages.length }))
      } catch (err) {
        toast.error(t('toastUploadFailed'))
        console.error(err)
      } finally {
        setUploading(false)
      }
    },
    [listing.id],
  )

  async function handleSave() {
    setSaving(true)
    try {
      await updateListing({
        data: {
          id: listing.id,
          name,
          description,
          aiName: aiName || undefined,
          aiDescription: aiDescription || undefined,
        },
      })
      toast.success(t('toastListingSaved'))
    } catch {
      toast.error(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAnalyze() {
    if (images.length === 0) {
      toast.error(t('toastUploadFirst'))
      return
    }
    setAnalyzing(true)
    setAiApplied(false)
    try {
      // Use eBay-enhanced analysis if accounts are connected
      const imagePaths = images.map((img) => img.filePath)
      const selectedAccount = ebayAccounts[0]

      if (ebayAccounts.length > 0) {
        const ebayResult = await analyzeListingForEbay({
          data: {
            listingId: listing.id,
            name,
            description,
            imagePaths,
            locale,
            marketplace: selectedAccount?.marketplace,
          },
        })
        setAiName(ebayResult.titleSuggestion || ebayResult.correctedName)
        setAiDescription(ebayResult.description)
        setEbayAIAnalysis(ebayResult)
      } else {
        const result = await analyzeListing({
          data: { listingId: listing.id, name, description, imagePaths, locale },
        })
        setAiName(result.correctedName)
        setAiDescription(result.description)
      }

      // Results are already saved to DB by the server function

      toast.success(t('toastAIComplete'))
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('toastAIFailed'),
      )
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleDeleteImage(imageId: string) {
    await deleteImage({ data: imageId })
    setImages((prev) => prev.filter((img) => img.id !== imageId))
    setImageSrcs((prev) => {
      const next = { ...prev }
      delete next[imageId]
      return next
    })
    toast.success(t('toastImageRemoved'))
  }

  async function handleDeleteListing() {
    setDeleting(true)
    try {
      await deleteListing({ data: listing.id })
      toast.success(t('toastListingDeleted'))
      router.invalidate()
      navigate({ to: '/' })
    } catch {
      toast.error(t('toastDeleteFailed'))
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteListing}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? t('deleting') : t('delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Item details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('itemDetails')}
                <Badge
                  variant={
                    listing.status === 'processed' ? 'default' : 'secondary'
                  }
                >
                  {t(listing.status === 'processed' ? 'statusProcessed' : 'statusDraft')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('itemName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('itemNameInputPlaceholder')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t('yourDescription')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('yourDescriptionPlaceholder')}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? t('saving') : t('saveDraft')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleAnalyze}
                  disabled={analyzing || images.length === 0}
                >
                  {analyzing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {analyzing ? t('analyzing') : t('analyzeWithAI')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Results — hidden after applying */}
          {(aiName || aiDescription) && !aiApplied && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {t('aiAnalysis')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiName && (
                  <div className="grid gap-2">
                    <Label>{t('suggestedName')}</Label>
                    <Input
                      value={aiName}
                      onChange={(e) => setAiName(e.target.value)}
                    />
                  </div>
                )}
                {aiDescription && (
                  <div className="grid gap-2">
                    <Label>{t('generatedDescription')}</Label>
                    <Textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      rows={8}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (aiName) setName(aiName)
                      if (aiDescription) setDescription(aiDescription)
                      setAiApplied(true)
                      toast.success(t('toastAIApplied'))
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {t('applyToListing')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setAiApplied(true)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('hideAnalysis')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Images */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {t('images', { count: images.length })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              <label
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleFileUpload(e.dataTransfer.files)
                }}
              >
                {uploading ? (
                  <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading
                    ? t('uploading')
                    : t('uploadHint')}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={uploading}
                />
              </label>

              {images.length > 0 && <Separator />}

              {/* Image grid */}
              <div className="grid grid-cols-2 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="group relative">
                    {imageSrcs[img.id] ? (
                      <img
                        src={imageSrcs[img.id]}
                        alt={img.originalFilename}
                        className="h-40 w-full cursor-pointer rounded-md object-cover transition-opacity hover:opacity-80"
                        onClick={() =>
                          setZoomImage({
                            src: imageSrcs[img.id],
                            alt: img.originalFilename,
                          })
                        }
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-md bg-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {img.originalFilename}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* eBay Listing Section */}
      <Suspense fallback={null}>
        <EbayListingSection
          listingId={listing.id}
          accounts={ebayAccounts}
          aiAnalysis={ebayAIAnalysis}
        />
      </Suspense>

      {zoomImage && (
        <ImageZoomModal
          src={zoomImage.src}
          alt={zoomImage.alt}
          open={!!zoomImage}
          onOpenChange={(open) => {
            if (!open) setZoomImage(null)
          }}
        />
      )}
    </div>
  )
}
