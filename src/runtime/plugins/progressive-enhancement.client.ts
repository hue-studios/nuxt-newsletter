// src/runtime/plugins/progressive-enhancement.client.ts
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client side
  if (process.server) return

  // Wait for DOM to be ready
  await new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve)
    } else {
      resolve(void 0)
    }
  })

  // Progressive enhancement initialization
  const initializeProgressiveEnhancement = async () => {
    console.log('🚀 Initializing Progressive Enhancement for Newsletter Module')

    // Auto-detect and apply capability-based enhancements
    await detectAndApplyEnhancements()
    
    // Setup performance monitoring
    setupPerformanceMonitoring()
    
    // Setup feature flags based on capabilities
    setupFeatureFlags()
    
    // Apply theme based on capabilities
    applyThemeEnhancements()
    
    console.log('✅ Progressive Enhancement initialized')
  }

  const detectAndApplyEnhancements = async () => {
    // Device type detection and CSS class application
    const deviceType = getDeviceType()
    document.documentElement.classList.add(`device-${deviceType}`)
    
    // Connection speed detection
    const connectionSpeed = getConnectionSpeed()
    document.documentElement.classList.add(`connection-${connectionSpeed}`)
    
    // Feature support detection
    const features = detectFeatureSupport()
    Object.entries(features).forEach(([feature, supported]) => {
      if (supported) {
        document.documentElement.classList.add(`supports-${feature}`)
      } else {
        document.documentElement.classList.add(`no-${feature}`)
      }
    })
    
    // Storage capability detection
    const storageTypes = detectStorageSupport()
    Object.entries(storageTypes).forEach(([storage, supported]) => {
      if (supported) {
        document.documentElement.classList.add(`has-${storage}`)
      }
    })
  }

  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /mobile|android|iphone/.test(userAgent)
    const isTablet = /tablet|ipad/.test(userAgent)
    
    return isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  }

  const getConnectionSpeed = (): 'slow' | 'fast' | 'unknown' => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection
    
    if (connection?.effectiveType) {
      return ['slow-2g', '2g'].includes(connection.effectiveType) ? 'slow' : 'fast'
    }
    
    // Fallback: assume fast on desktop, unknown on mobile
    return getDeviceType() === 'desktop' ? 'fast' : 'unknown'
  }

  const detectFeatureSupport = () => {
    return {
      'drag-drop': 'draggable' in document.createElement('div'),
      'webgl': !!(window as any).WebGLRenderingContext,
      'service-worker': 'serviceWorker' in navigator,
      'intersection-observer': 'IntersectionObserver' in window,
      'resize-observer': 'ResizeObserver' in window,
      'clipboard-api': navigator.clipboard !== undefined,
      'share-api': navigator.share !== undefined,
      'geolocation': navigator.geolocation !== undefined,
      'notifications': 'Notification' in window,
      'web-speech': 'speechSynthesis' in window,
      'touch': 'ontouchstart' in window,
      'pointer-events': window.PointerEvent !== undefined,
      'css-custom-properties': CSS.supports('color', 'var(--fake-var)'),
      'css-grid': CSS.supports('display', 'grid'),
      'css-flexbox': CSS.supports('display', 'flex'),
      'css-sticky': CSS.supports('position', 'sticky'),
      'prefers-reduced-motion': window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  const detectStorageSupport = () => {
    const storage = {
      'local-storage': false,
      'session-storage': false,
      'indexed-db': false
    }

    // Test localStorage
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      storage['local-storage'] = true
    } catch {}

    // Test sessionStorage
    try {
      sessionStorage.setItem('test', 'test')
      sessionStorage.removeItem('test')
      storage['session-storage'] = true
    } catch {}

    // Test IndexedDB
    storage['indexed-db'] = 'indexedDB' in window

    return storage
  }

  const setupPerformanceMonitoring = () => {
    // Monitor Core Web Vitals if supported
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        // Apply performance-based optimizations
        if (lastEntry.startTime > 2500) { // Poor LCP
          document.documentElement.classList.add('slow-loading')
          // Could disable animations, reduce image quality, etc.
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID) - via event timing
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime
          if (fid > 100) { // Poor FID
            document.documentElement.classList.add('slow-interaction')
            // Could simplify interactions, reduce JavaScript
          }
        })
      }).observe({ entryTypes: ['first-input'] })
    }

    // Memory monitoring (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
        document.documentElement.classList.add('memory-constrained')
        // Could disable heavy features
      }
    }
  }

  const setupFeatureFlags = () => {
    // Create a global feature flag system
    ;(window as any).__NEWSLETTER_FEATURES__ = {
      // Editor features
      richTextDragDrop: document.documentElement.classList.contains('supports-drag-drop') &&
                       !document.documentElement.classList.contains('device-mobile'),
      
      autoSave: document.documentElement.classList.contains('has-local-storage') ||
               document.documentElement.classList.contains('has-session-storage'),
      
      realTimePreview: document.documentElement.classList.contains('connection-fast') &&
                      !document.documentElement.classList.contains('device-mobile'),
      
      animations: !document.documentElement.classList.contains('supports-prefers-reduced-motion') &&
                 !document.documentElement.classList.contains('slow-loading'),
      
      // Performance features
      lazyLoading: document.documentElement.classList.contains('supports-intersection-observer'),
      
      imageOptimization: document.documentElement.classList.contains('connection-slow') ||
                        document.documentElement.classList.contains('device-mobile'),
      
      // Advanced features
      collaboration: document.documentElement.classList.contains('supports-service-worker') &&
                    document.documentElement.classList.contains('connection-fast'),
      
      shareAPI: document.documentElement.classList.contains('supports-share-api'),
      
      clipboard: document.documentElement.classList.contains('supports-clipboard-api'),
      
      notifications: document.documentElement.classList.contains('supports-notifications')
    }

    // Emit feature detection complete event
    window.dispatchEvent(new CustomEvent('newsletter:features-detected', {
      detail: (window as any).__NEWSLETTER_FEATURES__
    }))
  }

  const applyThemeEnhancements = () => {
    // Dark mode support based on capabilities
    if (document.documentElement.classList.contains('has-local-storage')) {
      const darkModePreference = localStorage.getItem('newsletter-dark-mode')
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      if (darkModePreference === 'true' || (darkModePreference === null && systemPrefersDark)) {
        document.documentElement.classList.add('dark')
      }

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (localStorage.getItem('newsletter-dark-mode') === null) {
            document.documentElement.classList.toggle('dark', e.matches)
          }
        })
    }

    // Reduced motion support
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion')
    }

    // High contrast support
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.documentElement.classList.add('high-contrast')
    }

    // Add CSS custom properties for theming based on capabilities
    const root = document.documentElement
    
    // Animation duration based on performance
    if (document.documentElement.classList.contains('slow-loading')) {
      root.style.setProperty('--newsletter-animation-duration', '0ms')
    } else if (document.documentElement.classList.contains('reduce-motion')) {
      root.style.setProperty('--newsletter-animation-duration', '50ms')
    } else {
      root.style.setProperty('--newsletter-animation-duration', '200ms')
    }

    // Spacing adjustments for mobile
    if (document.documentElement.classList.contains('device-mobile')) {
      root.style.setProperty('--newsletter-toolbar-size', '44px') // Touch-friendly
      root.style.setProperty('--newsletter-spacing', '1rem')
    } else {
      root.style.setProperty('--newsletter-toolbar-size', '32px')
      root.style.setProperty('--newsletter-spacing', '0.75rem')
    }
  }

  // Auto-save implementation that respects capabilities
  const setupAutoSave = () => {
    if (!(window as any).__NEWSLETTER_FEATURES__.autoSave) return

    const autoSaveQueue = new Map()
    let autoSaveTimeout: NodeJS.Timeout | null = null

    const processAutoSave = async () => {
      if (autoSaveQueue.size === 0) return

      try {
        // Batch save all pending changes
        const changes = Array.from(autoSaveQueue.entries())
        autoSaveQueue.clear()

        // Use appropriate storage based on capabilities
        const storage = document.documentElement.classList.contains('has-local-storage') 
          ? localStorage 
          : sessionStorage

        changes.forEach(([key, value]) => {
          storage.setItem(`newsletter-autosave-${key}`, JSON.stringify({
            content: value,
            timestamp: Date.now()
          }))
        })

        // Emit auto-save success event
        window.dispatchEvent(new CustomEvent('newsletter:auto-save-success', {
          detail: { itemCount: changes.length }
        }))

      } catch (error) {
        console.warn('Auto-save failed:', error)
        window.dispatchEvent(new CustomEvent('newsletter:auto-save-error', {
          detail: { error }
        }))
      }
    }

    // Expose auto-save function globally
    ;(window as any).__NEWSLETTER_AUTO_SAVE__ = (key: string, content: any) => {
      autoSaveQueue.set(key, content)

      if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
      
      // Adjust delay based on connection speed
      const delay = document.documentElement.classList.contains('connection-slow') ? 5000 : 2000
      
      autoSaveTimeout = setTimeout(processAutoSave, delay)
    }
  }

  // Setup connection monitoring
  const setupConnectionMonitoring = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection

    if (connection) {
      const updateConnectionStatus = () => {
        // Remove old connection classes
        document.documentElement.classList.remove('connection-online', 'connection-offline')
        
        // Add current status
        document.documentElement.classList.add(
          navigator.onLine ? 'connection-online' : 'connection-offline'
        )

        // Emit connection change event
        window.dispatchEvent(new CustomEvent('newsletter:connection-change', {
          detail: {
            online: navigator.onLine,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink
          }
        }))
      }

      window.addEventListener('online', updateConnectionStatus)
      window.addEventListener('offline', updateConnectionStatus)
      connection.addEventListener('change', updateConnectionStatus)

      // Initial status
      updateConnectionStatus()
    }
  }

  // Initialize all progressive enhancements
  try {
    await initializeProgressiveEnhancement()
    setupAutoSave()
    setupConnectionMonitoring()
    
    // Mark as initialized
    ;(window as any).__NEWSLETTER_PE_INITIALIZED__ = true
    
  } catch (error) {
    console.error('Failed to initialize progressive enhancement:', error)
  }
})