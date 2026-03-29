import { createServerFn } from '@tanstack/react-start'
import * as fs from 'node:fs'
import * as path from 'node:path'

const mimeMap: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

/** Pure server-side function — can be called from other server code */
export function readImageAsDataUrl(filePath: string): string | null {
  const fullPath = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(fullPath)) return null

  const buffer = fs.readFileSync(fullPath)
  const ext = path.extname(filePath).toLowerCase()
  const mime = mimeMap[ext] || 'image/jpeg'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

/** Server function — callable from client via RPC (single image) */
export const getImageDataUrl = createServerFn({ method: 'GET' })
  .inputValidator((filePath: string) => filePath)
  .handler(async ({ data: filePath }) => {
    return readImageAsDataUrl(filePath)
  })

/** Server function — callable from client via RPC (batch) */
export const getImageDataUrls = createServerFn({ method: 'POST' })
  .inputValidator((data: Array<{ id: string; filePath: string }>) => data)
  .handler(async ({ data: images }) => {
    const result: Record<string, string> = {}
    for (const img of images) {
      const src = readImageAsDataUrl(img.filePath)
      if (src) result[img.id] = src
    }
    return result
  })
