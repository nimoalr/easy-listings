import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

type ImageZoomModalProps = {
  src: string
  alt: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageZoomModal({ src, alt, open, onOpenChange }: ImageZoomModalProps) {
  const [zoomed, setZoomed] = useState(false)

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setZoomed(false)
      onOpenChange(next)
    },
    [onOpenChange],
  )

  const toggleZoom = useCallback(() => {
    setZoomed((z) => !z)
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] max-w-[90vw] sm:max-w-[90vw] items-center justify-center overflow-auto border-none bg-black/95 p-2 shadow-2xl ring-0"
      >
        <div
          className={`flex items-center justify-center ${zoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in'}`}
          onClick={toggleZoom}
        >
          <img
            src={src}
            alt={alt}
            className={
              zoomed
                ? 'max-w-none'
                : 'max-h-[85vh] max-w-[88vw] object-contain'
            }
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
