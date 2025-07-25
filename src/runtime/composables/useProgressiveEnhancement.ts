// src/runtime/composables/useProgressiveEnhancement.ts
import { useNuxtApp, useRuntimeConfig } from '#app'
import { computed, onMounted, ref } from 'vue'

export interface EnvironmentCapabilities {
  // Authentication capabilities
  hasDirectusToken: boolean
  hasAuthMiddleware: boolean
  authType: 'static' | 'middleware' | 'none'
  
  // UI capabilities  
  hasTailwind: boolean
  hasIconLibrary: boolean
  preferredIconSet: 'lucide' | 'heroicons' | 'tabler' | 'none'
  
  // Feature capabilities
  supportsDragDrop: boolean
  supportsWebGL: boolean
  supportsServiceWorker: boolean
  
  // Performance capabilities
  connectionSpeed: 'slow' | 'fast' | 'unknown'
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  
  // Email capabilities
  hasSendGrid: boolean
  hasMailgun: boolean
  hasResend: boolean
  preferredEmailProvider: string | null
  
  // Storage capabilities
  hasLocalStorage: boolean
  hasSessionStorage: boolean
  hasIndexedDB: boolean
  
  // Development capabilities
  isDevelopment: boolean
  hasDevtools: boolean
}

export interface EnhancedFeatures {
  // Editor enhancements
  richTextFeatures: {
    headings: boolean
    lists: boolean
    links: boolean
    alignment: boolean
    colors: boolean
    tables: boolean
    images: boolean
    dragDrop: boolean
  }
  
  // UI enhancements
  animations: boolean
  transitions: boolean
  darkMode: boolean
  responsiveDesign: boolean
  
  // Performance enhancements
  lazyLoading: boolean
  imageOptimization: boolean
  codesplitting: boolean
  
  // Functionality enhancements
  autoSave: boolean
  realTimePreview: boolean
  collaboration: boolean
  analytics: boolean
}

export const useProgressiveEnhancement = () => {
  const config = useRuntimeConfig()
  const nuxtApp = useNuxtApp()
  
  const capabilities = ref<EnvironmentCapabilities>({
    hasDirectusToken: false,
    hasAuthMiddleware: false,
    authType: 'none',
    hasTailwind: false,
    hasIconLibrary: false,
    preferredIconSet: 'none',
    supportsDragDrop: false,
    supportsWebGL: false,
    supportsServiceWorker: false,
    connectionSpeed: 'unknown',
    deviceType: 'unknown',
    hasSendGrid: false,
    hasMailgun: false,
    hasResend: false,
    preferredEmailProvider: null,
    hasLocalStorage: false,
    hasSessionStorage: false,
    hasIndexedDB: false,
    isDevelopment: false,
    hasDevtools: false
  })

  const features = computed<EnhancedFeatures>(() => {
    const caps = capabilities.value
    
    return {
      // Rich text features based on device and performance
      richTextFeatures: {
        headings: true, // Always available
        lists: true, // Always available
        links: true, // Always available
        alignment: caps.deviceType !== 'mobile', // Skip on mobile for simplicity
        colors: caps.connectionSpeed !== 'slow' && caps.deviceType !== 'mobile',
        tables: caps.deviceType === 'desktop', // Only on desktop
        images: caps.connectionSpeed !== 'slow',
        dragDrop: caps.supportsDragDrop && caps.deviceType !== 'mobile'
      },
      
      // UI enhancements based on performance
      animations: caps.connectionSpeed !== 'slow' && caps.deviceType !== 'mobile',
      transitions: true, // Lightweight, always enable
      darkMode: caps.hasLocalStorage, // Need storage for preference
      responsiveDesign: true, // Always enable
      
      // Performance features
      lazyLoading: caps.connectionSpeed === 'slow' || caps.deviceType === 'mobile',
      imageOptimization: caps.connectionSpeed === 'slow',
      codesplitting: !caps.isDevelopment, // Enable in production
      
      // Advanced features
      autoSave: caps.hasLocalStorage || caps.hasSessionStorage,
      realTimePreview: caps.connectionSpeed === 'fast' && caps.deviceType === 'desktop',
      collaboration: caps.supportsServiceWorker && caps.connectionSpeed === 'fast',
      analytics: !caps.isDevelopment && caps.hasDirectusToken
    }
  })

  // Detect authentication capabilities
  const detectAuthCapabilities = () => {
    const newsletterConfig = config.public?.newsletter || config.newsletter || {}
    
    // Check for static token
    const hasToken = !!(
      newsletterConfig.directus?.auth?.token ||
      process.env.DIRECTUS_TOKEN ||
      process.env.NUXT_DIRECTUS_TOKEN
    )
    
    // Check for auth middleware
    const hasMiddleware = !!(
      newsletterConfig.directus?.auth?.middleware ||
      nuxtApp.$router?.getRoutes().some(route => 
        route.meta?.middleware?.includes('auth') ||
        route.meta?.auth !== false
      )
    )
    
    capabilities.value.hasDirectusToken = hasToken
    capabilities.value.hasAuthMiddleware = hasMiddleware
    
    // Determine auth type
    if (hasToken) {
      capabilities.value.authType = 'static'
    } else if (hasMiddleware) {
      capabilities.value.authType = 'middleware'
    } else {
      capabilities.value.authType = 'none'
    }
  }

  // Detect UI capabilities
  const detectUICapabilities = () => {
    // Check for Tailwind CSS
    capabilities.value.hasTailwind = !!(
      document.querySelector('link[href*="tailwind"]') ||
      document.querySelector('style[data-vite-dev-id*="tailwind"]') ||
      getComputedStyle(document.documentElement).getPropertyValue('--tw-ring-color')
    )
    
    // Check for icon libraries
    const hasLucide = !!(window as any).lucide || document.querySelector('[data-lucide]')
    const hasHeroicons = !!(window as any).heroicons || document.querySelector('[data-heroicons]')
    const hasTabler = !!(window as any).tabler || document.querySelector('[data-tabler]')
    
    capabilities.value.hasIconLibrary = hasLucide || hasHeroicons || hasTabler
    
    if (hasLucide) capabilities.value.preferredIconSet = 'lucide'
    else if (hasHeroicons) capabilities.value.preferredIconSet = 'heroicons'
    else if (hasTabler) capabilities.value.preferredIconSet = 'tabler'
    else capabilities.value.preferredIconSet = 'none'
  }

  // Detect device and performance capabilities
  const detectDeviceCapabilities = () => {
    // Device type detection
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /mobile|android|iphone/.test(userAgent)
    const isTablet = /tablet|ipad/.test(userAgent)
    
    capabilities.value.deviceType = isMobile ? 'mobile' : 
                                   isTablet ? 'tablet' : 'desktop'
    
    // Connection speed (if available)
    const connection = (navigator as any).connection || (navigator as any).mozConnection
    if (connection) {
      const effectiveType = connection.effectiveType
      capabilities.value.connectionSpeed = 
        ['slow-2g', '2g'].includes(effectiveType) ? 'slow' :
        ['3g'].includes(effectiveType) ? 'fast' :
        ['4g'].includes(effectiveType) ? 'fast' : 'unknown'
    } else {
      // Fallback: assume fast on desktop, unknown on mobile
      capabilities.value.connectionSpeed = 
        capabilities.value.deviceType === 'desktop' ? 'fast' : 'unknown'
    }
    
    // Feature detection
    capabilities.value.supportsDragDrop = 'draggable' in document.createElement('div')
    capabilities.value.supportsWebGL = !!(window as any).WebGLRenderingContext
    capabilities.value.supportsServiceWorker = 'serviceWorker' in navigator
  }

  // Detect email provider capabilities
  const detectEmailCapabilities = () => {
    const newsletterConfig = config.public?.newsletter || config.newsletter || {}
    
    capabilities.value.hasSendGrid = !!(
      newsletterConfig.sendgrid?.apiKey ||
      process.env.SENDGRID_API_KEY ||
      process.env.NUXT_SENDGRID_API_KEY
    )
    
    capabilities.value.hasMailgun = !!(
      newsletterConfig.mailgun?.apiKey ||
      process.env.MAILGUN_API_KEY ||
      process.env.NUXT_MAILGUN_API_KEY
    )
    
    capabilities.value.hasResend = !!(
      newsletterConfig.resend?.apiKey ||
      process.env.RESEND_API_KEY ||
      process.env.NUXT_RESEND_API_KEY
    )
    
    // Set preferred provider
    if (capabilities.value.hasSendGrid) {
      capabilities.value.preferredEmailProvider = 'sendgrid'
    } else if (capabilities.value.hasResend) {
      capabilities.value.preferredEmailProvider = 'resend'
    } else if (capabilities.value.hasMailgun) {
      capabilities.value.preferredEmailProvider = 'mailgun'
    }
  }

  // Detect storage capabilities
  const detectStorageCapabilities = () => {
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      capabilities.value.hasLocalStorage = true
    } catch {
      capabilities.value.hasLocalStorage = false
    }
    
    try {
      sessionStorage.setItem('test', 'test')
      sessionStorage.removeItem('test')
      capabilities.value.hasSessionStorage = true
    } catch {
      capabilities.value.hasSessionStorage = false
    }
    
    capabilities.value.hasIndexedDB = 'indexedDB' in window
  }

  // Detect development environment
  const detectDevelopmentCapabilities = () => {
    capabilities.value.isDevelopment = process.env.NODE_ENV === 'development'
    capabilities.value.hasDevtools = !!(window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__
  }

  // Run all capability detection
  const detectCapabilities = async () => {
    detectAuthCapabilities()
    detectEmailCapabilities()
    detectStorageCapabilities()
    detectDevelopmentCapabilities()
    
    // Client-side only detections
    if (process.client) {
      detectUICapabilities()
      detectDeviceCapabilities()
    }
  }

  // Get recommended configuration based on capabilities
  const getRecommendedConfig = () => {
    const caps = capabilities.value
    const feat = features.value
    
    return {
      // Authentication config
      directus: {
        auth: {
          type: caps.authType,
          token: caps.hasDirectusToken ? undefined : null, // Let user know token is missing
          middleware: caps.hasAuthMiddleware ? 'auth' : undefined
        }
      },
      
      // UI config
      ui: {
        icons: caps.preferredIconSet !== 'none' ? caps.preferredIconSet : 'lucide',
        enableDragDrop: feat.richTextFeatures.dragDrop,
        autoInstallTailwind: !caps.hasTailwind,
        theme: {
          primaryColor: 'blue',
          darkMode: feat.darkMode,
          animations: feat.animations,
          transitions: feat.transitions
        }
      },
      
      // Editor config
      editor: {
        features: feat.richTextFeatures,
        autoSave: feat.autoSave,
        autoSaveInterval: caps.connectionSpeed === 'slow' ? 30000 : 10000, // 30s vs 10s
        lazyLoading: feat.lazyLoading
      },
      
      // Performance config
      performance: {
        imageOptimization: feat.imageOptimization,
        codesplitting: feat.codesplitting,
        realTimePreview: feat.realTimePreview
      },
      
      // Email config
      email: {
        provider: caps.preferredEmailProvider,
        analytics: feat.analytics
      }
    }
  }

  // Initialize capabilities detection
  onMounted(() => {
    detectCapabilities()
  })

  return {
    capabilities,
    features,
    detectCapabilities,
    getRecommendedConfig,
    
    // Utility methods
    isFeatureEnabled: (feature: keyof EnhancedFeatures) => features.value[feature],
    hasCapability: (capability: keyof EnvironmentCapabilities) => capabilities.value[capability],
    
    // Quick checks
    shouldEnableFeature: (feature: string) => {
      switch (feature) {
        case 'dragdrop':
          return feat.richTextFeatures.dragDrop
        case 'animations':
          return feat.animations
        case 'autosave':
          return feat.autoSave
        case 'collaboration':
          return feat.collaboration
        default:
          return false
      }
    }
  }
}