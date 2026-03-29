import * as path from 'node:path'

export function getPublicImageUrls(filePaths: string[]): string[] {
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  return filePaths.map((filePath) => {
    const filename = path.basename(filePath)
    return `${appUrl}/api/uploads/${filename}`
  })
}
