// src/runtime/utils/performance/optimization.ts
/**
 * Performance optimization utilities
 */

// Debounce function calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

// Throttle function calls
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Lazy loading utility
// src/runtime/utils/performance/optimization.ts

// Replace the createLazyLoader function (around line 60):
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  options: {
    retries?: number
    retryDelay?: number
    timeout?: number
  } = {},
): () => Promise<T> {
  const { retries = 3, retryDelay = 1000, timeout = 10000 } = options
  let cached: Promise<T> | null = null

  return () => {
    if (cached) return cached

    // Fixed: Remove async from Promise constructor
    cached = new Promise<T>((resolve, reject) => {
      let attempts = 0

      const attempt = async (): Promise<void> => {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), timeout)
          })

          const result = await Promise.race([loader(), timeoutPromise])
          resolve(result)
        }
        catch (error) {
          attempts++
          if (attempts >= retries) {
            cached = null // Reset cache on final failure
            reject(error)
          }
          else {
            setTimeout(attempt, retryDelay * attempts)
          }
        }
      }

      // Call attempt without await in Promise constructor
      attempt().catch(reject)
    })

    return cached
  }
}

// Batch processing utility
export class BatchProcessor<T, R> {
  private queue: T[] = []
  private timeout: NodeJS.Timeout | null = null

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private delay: number = 100,
  ) {}

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...item, resolve, reject } as T & {
        resolve: (value: R) => void
        reject: (reason?: unknown) => void
      })
      this.scheduleProcessing()
    })
  }

  private scheduleProcessing(): void {
    if (this.timeout) return

    this.timeout = setTimeout(() => {
      this.processBatch()
    }, this.delay)
  }

  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return

    const batch = this.queue.splice(0, this.batchSize) as Array<
      T & { resolve: (value: R) => void, reject: (reason?: unknown) => void }
    >
    this.timeout = null

    try {
      const results = await this.processor(
        batch.map((item) => {
          const { resolve, reject, ...data } = item
          return data as T
        }),
      )

      batch.forEach((item, index) => {
        item.resolve(results[index])
      })
    }
    catch (error) {
      batch.forEach((item) => {
        item.reject(error)
      })
    }

    // Process remaining items
    if (this.queue.length > 0) {
      this.scheduleProcessing()
    }
  }
}

// Image optimization
export async function optimizeImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {},
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.8,
    format = 'jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      const aspectRatio = width / height

      if (width > maxWidth) {
        width = maxWidth
        height = width / aspectRatio
      }

      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      const mimeType = `image/${format}`
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            })
            resolve(optimizedFile)
          }
          else {
            reject(new Error('Failed to optimize image'))
          }
        },
        mimeType,
        quality,
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Bundle size tracking
export function trackBundleMetrics() {
  if (typeof window === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const nav = entry as PerformanceNavigationTiming
        console.log('Bundle metrics:', {
          domContentLoaded:
            nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          totalBytes: nav.transferSize,
          compressedBytes: nav.encodedBodySize,
        })
      }
    }
  })

  observer.observe({ entryTypes: ['navigation'] })
}
