import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { listingImages } from '../db/schema'
import { eq } from 'drizzle-orm'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

export const uploadImages = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      listingId: string
      files: Array<{ name: string; base64: string }>
    }) => data,
  )
  .handler(async ({ data }) => {
    ensureUploadsDir()

    const existingImages = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, data.listingId))

    let order = existingImages.length

    const results = []

    for (const file of data.files) {
      const ext = path.extname(file.name) || '.jpg'
      const filename = `${crypto.randomUUID()}${ext}`
      const filePath = path.join(UPLOADS_DIR, filename)

      const buffer = Buffer.from(file.base64, 'base64')
      fs.writeFileSync(filePath, buffer)

      const [image] = await db
        .insert(listingImages)
        .values({
          listingId: data.listingId,
          filePath: `uploads/${filename}`,
          originalFilename: file.name,
          order: order++,
        })
        .returning()

      results.push(image!)
    }

    return results
  })

export const deleteImage = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const [image] = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.id, id))
      .limit(1)

    if (image) {
      const fullPath = path.resolve(process.cwd(), image.filePath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
      await db.delete(listingImages).where(eq(listingImages.id, id))
    }

    return { success: true }
  })
