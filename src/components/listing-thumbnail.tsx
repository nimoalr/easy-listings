import { Package } from 'lucide-react'

export function ListingThumbnail({
  src,
  alt,
  className = '',
}: {
  src?: string | null
  alt: string
  className?: string
}) {
  if (!src) {
    return (
      <div
        className={`flex h-32 items-center justify-center rounded-md bg-muted ${className}`}
      >
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`h-32 w-full rounded-md object-cover ${className}`}
    />
  )
}
