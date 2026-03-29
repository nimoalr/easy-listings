import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPublicImageUrls } from '../server/ebay-images'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getPublicImageUrls', () => {
  it('constructs URLs using APP_URL env var', () => {
    vi.stubEnv('APP_URL', 'https://myapp.example.com')
    const urls = getPublicImageUrls(['uploads/abc.jpg'])
    expect(urls[0]).toBe('https://myapp.example.com/api/uploads/abc.jpg')
  })

  it('falls back to localhost:3000 when APP_URL is unset', () => {
    vi.stubEnv('APP_URL', '')
    const urls = getPublicImageUrls(['uploads/test.png'])
    expect(urls[0]).toBe('http://localhost:3000/api/uploads/test.png')
  })

  it('strips trailing slash from APP_URL', () => {
    vi.stubEnv('APP_URL', 'https://app.com/')
    const urls = getPublicImageUrls(['uploads/img.webp'])
    // Should not have double slash in the path (after the protocol)
    expect(urls[0].replace('https://', '')).not.toContain('//')
    expect(urls[0]).toBe('https://app.com/api/uploads/img.webp')
  })

  it('extracts basename from nested file paths', () => {
    vi.stubEnv('APP_URL', 'https://app.com')
    const urls = getPublicImageUrls(['some/deep/path/image.png'])
    expect(urls[0]).toBe('https://app.com/api/uploads/image.png')
  })
})
