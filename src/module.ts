// src/module.ts - Your existing module + additive progressive enhancement
import {
  addComponentsDir,
  addImports,
  addPlugin,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  installModule,
  useLogger
} from '@nuxt/kit'
import { defu } from 'defu'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export interface NewsletterModuleOptions {
  /**
   * Directus configuration
   */
  directus: {
    /**
     * Directus instance URL
     * @example 'https://admin.example.com'
     */
    url: string
    /**
     * Authentication configuration
     */
    auth?: {
      /**
       * Authentication type
       * - 'static': Use a static token (recommended for internal tools)
       * - 'middleware': Use Nuxt middleware for auth (recommended for user-facing apps)
       * - 'auto': Automatically detect best method (NEW!)
       * @default 'static'
       */
      type: 'static' | 'middleware' | 'auto'
      /**
       * Static token (only used when type is 'static')
       * Can be set via DIRECTUS_TOKEN environment variable
       */
      token?: string
      /**
       * Middleware name (only used when type is 'middleware')
       * @default 'auth'
       */
      middleware?: string
    }
  }
  /**
   * SendGrid configuration for email delivery
   */
  sendgrid?: {
    /**
     * SendGrid API key
     * Can be set via SENDGRID_API_KEY environment variable
     */
    apiKey?: string
    /**
     * Webhook verification secret for analytics
     * Can be set via SENDGRID_WEBHOOK_SECRET environment variable
     */
    webhookSecret?: string
    /**
     * Default sender email address
     * @default 'newsletter@example.com'
     */
    defaultFromEmail?: string
    /**
     * Default sender name
     * @default 'Newsletter'
     */
    defaultFromName?: string
  }
  /**
   * MJML compilation mode
   * - 'client': Compile in browser (good for development)
   * - 'server': Compile on server (better performance, requires mjml package)
   * - 'auto': Automatically choose based on environment (NEW!)
   * @default 'client'
   */
  mjmlMode?: 'client' | 'server' | 'auto'
  /**
   * Component prefix for auto-imported components
   * @default 'Newsletter'
   * @example 'Newsletter' creates <NewsletterEditor>, <NewsletterPreview>, etc.
   */
  prefix?: string
  /**
   * Enable development helpers and enhanced error messages
   * - true: Always enable
   * - false: Always disable  
   * - 'auto': Enable in development only (NEW!)
   * @default false in production
   */
  dev?: boolean | 'auto'
  /**
   * Modern UI configuration
   */
  ui?: {
    /**
     * Icon library to use
     * - 'lucide' | 'heroicons' | 'tabler': Specific library
     * - 'auto': Detect available library (NEW!)
     * @default 'lucide'
     */
    icons?: 'lucide' | 'heroicons' | 'tabler' | 'auto'
    /**
     * Enable drag and drop functionality
     * - true: Always enable
     * - false: Always disable
     * - 'auto': Enable based on device capability (NEW!)
     * @default true
     */
    enableDragDrop?: boolean | 'auto'
    /**
     * Auto-install TailwindCSS 4 if not present
     * - true: Always try to install
     * - false: Never install
     * - 'auto': Install only if not detected (NEW!)
     * @default true
     */
    autoInstallTailwind?: boolean | 'auto'
    /**
     * Theme configuration
     */
    theme?: {
      /**
       * Primary color for the interface
       * @default 'blue'
       */
      primaryColor?: string
      /**
       * Enable dark mode support
       * - true: Always enable
       * - false: Always disable
       * - 'auto': Enable if storage available (NEW!)
       * @default false
       */
      darkMode?: boolean | 'auto'
    }
  }
  /**
   * Progressive Enhancement (NEW!)
   * @default true
   */
  progressiveEnhancement?: {
    /**
     * Enable progressive enhancement features
     * @default true
     */
    enabled?: boolean
    /**
     * Rich text editor progressive features
     */
    editor?: {
      /**
       * Auto-adapt features based on device/performance
       * - true: Enable all auto-adaptations
       * - false: Use static configuration
       * - object: Configure specific adaptations
       * @default true
       */
      adaptiveFeatures?: boolean | {
        /**
         * Disable complex features on mobile
         * @default true
         */
        simplifyOnMobile?: boolean
        /**
         * Reduce features on slow connections
         * @default true
         */
        optimizeForSlow?: boolean
        /**
         * Enable advanced features on capable devices
         * @default true
         */
        enhanceOnDesktop?: boolean
      }
      /**
       * Auto-save based on storage capability
       * - true: Enable if storage available
       * - false: Never enable
       * - 'force': Always enable (use memory fallback)
       * @default true
       */
      autoSave?: boolean | 'force'
    }
    /**
     * Performance optimizations
     */
    performance?: {
      /**
       * Auto-enable lazy loading on slow connections
       * @default true
       */
      lazyLoading?: boolean
      /**
       * Reduce animations on low-performance devices
       * @default true
       */
      adaptiveAnimations?: boolean
      /**
       * Real-time preview only on fast connections
       * @default true
       */
      smartPreview?: boolean
    }
  }
}

export default defineNuxtModule<NewsletterModuleOptions>({
  meta: {
    name: '@hue-studios/nuxt-newsletter',
    configKey: 'newsletter',
    compatibility: {
      nuxt: '>=3.0.0'
    }
  },
  defaults: {
    directus: {
      url: '',
      auth: {
        type: 'static', // Keep your existing default
        middleware: 'auth'
      }
    },
    sendgrid: {
      defaultFromEmail: 'newsletter@example.com',
      defaultFromName: 'Newsletter'
    },
    mjmlMode: 'client',
    prefix: 'Newsletter',
    dev: 'auto', // NEW: auto-detect development mode
    ui: {
      icons: 'auto', // NEW: auto-detect available icons
      enableDragDrop: 'auto', // NEW: auto-detect device capability
      autoInstallTailwind: 'auto', // NEW: auto-detect if needed
      theme: {
        primaryColor: 'blue',
        darkMode: 'auto' // NEW: auto-detect storage capability
      }
    },
    // NEW: Progressive enhancement configuration
    progressiveEnhancement: {
      enabled: true,
      editor: {
        adaptiveFeatures: true,
        autoSave: true
      },
      performance: {
        lazyLoading: true,
        adaptiveAnimations: true,
        smartPreview: true
      }
    }
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const logger = useLogger('@hue-studios/nuxt-newsletter')

    // Your existing environment variable handling (KEEP AS-IS)
    const getEnvVar = (key: string, fallback = '') => {
      return process.env[key] || nuxt.options.runtimeConfig?.[key] || fallback
    }

    // Your existing build detection (KEEP AS-IS)
    const isBuilding = process.env.NODE_ENV === 'prerender' ||
                      process.argv.includes('prepare') ||
                      process.argv.includes('build') ||
                      process.argv.includes('dev:prepare')

    // === PROGRESSIVE ENHANCEMENT RESOLUTION ===
    // Resolve 'auto' values before validation
    await resolveAutoConfiguration(options, nuxt, logger, getEnvVar)

    // Your existing configuration resolution (KEEP AS-IS)
    const directusUrl = options.directus.url || getEnvVar('DIRECTUS_URL')
    const directusToken = options.directus.auth?.token || getEnvVar('DIRECTUS_TOKEN')
    const sendgridApiKey = options.sendgrid?.apiKey || getEnvVar('SENDGRID_API_KEY')
    const sendgridWebhookSecret = options.sendgrid?.webhookSecret || getEnvVar('SENDGRID_WEBHOOK_SECRET')
    const directusAdminToken = getEnvVar('DIRECTUS_ADMIN_TOKEN')

    // Your existing validation with better error messages (KEEP AS-IS)
    if (!directusUrl && !isBuilding) {
      const errorMessage = `
🚨 Newsletter Module Configuration Error:

Directus URL is required! Please configure it in one of these ways:

1. In your nuxt.config.ts:
   newsletter: {
     directus: {
       url: 'https://your-directus-instance.com'
     }
   }

2. In your .env file:
   DIRECTUS_URL=https://your-directus-instance.com

3. In your runtimeConfig:
   runtimeConfig: {
     directusUrl: 'https://your-directus-instance.com'
   }

📚 Quick setup: npm run newsletter:setup-wizard
📚 Docs: https://github.com/hue-studios/nuxt-newsletter#setup
      `

      if (nuxt.options.dev) {
        logger.warn(errorMessage)
        logger.info('Using fallback URL for development: http://localhost:8055')
        options.directus.url = 'http://localhost:8055'
      } else {
        logger.error(errorMessage)
        throw new Error('Newsletter Module: Directus URL is required')
      }
    } else {
      options.directus.url = directusUrl as string
    }

    // Your existing auth check (KEEP AS-IS)
    if (options.directus.auth?.type === 'static' && !directusToken && !isBuilding) {
      const authWarning = `
⚠️  Newsletter Module Authentication Warning:

No Directus token found! Add one of these:

1. In your .env file:
   DIRECTUS_TOKEN=your-token-here

2. In your nuxt.config.ts:
   newsletter: {
     directus: {
       auth: {
         type: 'static',
         token: 'your-token-here'
       }
     }
   }

3. In your runtimeConfig:
   runtimeConfig: {
     directusToken: 'your-token-here'
   }

Without a token, the module cannot connect to Directus.
      `
      logger.warn(authWarning)
    }

    // Your existing SendGrid check (KEEP AS-IS)
    if (!sendgridApiKey && !isBuilding) {
      logger.info(`
ℹ️  Newsletter Module - SendGrid Setup:

No SendGrid API key found. Email sending is disabled.

To enable email sending, add your API key:

1. In your .env file:
   SENDGRID_API_KEY=SG.your-api-key-here

2. In your runtimeConfig:
   runtimeConfig: {
     sendgridApiKey: 'SG.your-api-key-here'
   }

Get your API key from: https://app.sendgrid.com/settings/api_keys
      `)
    } else if (sendgridApiKey) {
      logger.info('✅ SendGrid configured - email sending enabled')
    }

    // Your existing runtime config (ENHANCED with progressive enhancement)
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      // Private (server-side only) - KEEP AS-IS
      sendgridApiKey: sendgridApiKey || '',
      sendgridWebhookSecret: sendgridWebhookSecret || '',
      directusAdminToken: directusAdminToken || '',
      directusToken: directusToken || '',

      // Public (client-side accessible) - ENHANCED
      public: {
        newsletter: {
          directus: {
            url: options.directus.url,
            auth: {
              type: options.directus.auth?.type || 'static',
              middleware: options.directus.auth?.middleware || 'auth',
              hasToken: !!directusToken
            }
          },
          sendgrid: {
            defaultFromEmail: options.sendgrid?.defaultFromEmail || 'newsletter@example.com',
            defaultFromName: options.sendgrid?.defaultFromName || 'Newsletter',
            configured: !!sendgridApiKey,
            hasWebhookSecret: !!sendgridWebhookSecret
          },
          mjmlMode: options.mjmlMode || 'client',
          prefix: options.prefix || 'Newsletter',
          dev: options.dev || nuxt.options.dev,
          ui: {
            icons: options.ui?.icons || 'lucide',
            enableDragDrop: options.ui?.enableDragDrop ?? true,
            autoInstallTailwind: options.ui?.autoInstallTailwind ?? true,
            theme: {
              primaryColor: options.ui?.theme?.primaryColor || 'blue',
              darkMode: options.ui?.theme?.darkMode || false
            }
          },
          // NEW: Progressive enhancement config
          progressiveEnhancement: options.progressiveEnhancement,
          status: {
            directusConfigured: !!directusUrl && directusUrl !== 'http://localhost:8055',
            directusAuthConfigured: !!directusToken,
            sendgridConfigured: !!sendgridApiKey,
            sendgridWebhookConfigured: !!sendgridWebhookSecret,
            mjmlMode: options.mjmlMode || 'client',
            directusAdminTokenConfigured: !!directusAdminToken
          }
        }
      }
    })

    // Your existing dependency installation (KEEP AS-IS)
    try {
      await installModule('@vueuse/nuxt')
      logger.info('✅ @vueuse/nuxt installed')

      await installModule('@nuxt/icon')
      logger.info(`✅ @nuxt/icon installed with ${options.ui?.icons || 'lucide'} icons`)

      if (options.ui?.autoInstallTailwind !== false) {
        await setupTailwindCSS4(nuxt, logger, resolver)
      }

      if (options.ui?.theme?.darkMode) {
        const hasColorMode = nuxt.options.modules.some(m =>
          (typeof m === 'string' && m.includes('color-mode')) ||
          (Array.isArray(m) && m[0]?.includes('color-mode'))
        )

        if (!hasColorMode) {
          try {
            await installModule('@nuxtjs/color-mode')
            logger.info('✅ @nuxtjs/color-mode installed for dark mode support')
          } catch (error) {
            logger.warn('⚠️  Dark mode is enabled but @nuxtjs/color-mode is not available')
            logger.warn('   Install it manually: npm install @nuxtjs/color-mode')
          }
        }
      }

    } catch (error) {
      logger.error('Failed to install required dependencies. Please install manually:')
      logger.error('npm install @vueuse/nuxt @nuxt/icon tailwindcss @tailwindcss/vite')
      throw error
    }

    // Your existing plugin (KEEP AS-IS)
    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'all'
    })

    // NEW: Add progressive enhancement plugin (ADDITIVE)
    if (options.progressiveEnhancement?.enabled !== false) {
      addPlugin({
        src: resolver.resolve('./runtime/plugins/progressive-enhancement.client'),
        mode: 'client'
      })
    }

    // Your existing composables (ENHANCED with new ones)
    addImports([
      // Your existing composables (KEEP AS-IS)
      {
        name: 'useDirectusNewsletter',
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Access Directus newsletter operations (CRUD, templates, subscribers, etc.)'
        }
      },
      {
        name: 'useMjmlCompiler',
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Compile newsletters to MJML and HTML with Handlebars support'
        }
      },
      {
        name: 'useNewsletter',
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Access newsletter module configuration and state'
        }
      },
      {
        name: 'useNewsletterEditor',
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Newsletter editor state management with drag-drop support'
        }
      },
      {
        name: 'useSendGrid',
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'SendGrid email operations and webhook handling'
        }
      },
      {
        name: 'useNewsletterErrors',
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'User-friendly error handling and troubleshooting'
        }
      },
      {
        name: 'useNewsletterSetup',
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Newsletter module setup validation and configuration helpers'
        }
      },
      {
        name: 'useTiptapEditor',
        from: resolver.resolve('./runtime/composables/useTiptapEditor'),
        meta: {
          description: 'Advanced Tiptap rich text editor with full formatting capabilities'
        }
      },
      // NEW: Progressive enhancement composables (ADDITIVE)
      {
        name: 'useProgressiveEnhancement',
        from: resolver.resolve('./runtime/composables/useProgressiveEnhancement'),
        meta: {
          description: 'Access progressive enhancement capabilities and adaptive features'
        }
      },
      {
        name: 'useNewsletterContentMapping',
        from: resolver.resolve('./runtime/composables/useNewsletterContentMapping'),
        meta: {
          description: 'Access content mapping configuration for newsletter blocks'
        }
      }
    ])

    // Your existing drag and drop (KEEP AS-IS)
    if (options.ui?.enableDragDrop !== false) {
      nuxt.options.css.push(resolver.resolve('./runtime/assets/css/drag-drop.css'))

      addImports([
        {
          name: 'useDragAndDrop',
          from: resolver.resolve('./runtime/composables/useDragAndDrop'),
          meta: {
            description: 'Drag and drop functionality for newsletter blocks'
          }
        }
      ])
    }

    // Your existing components (KEEP AS-IS)
    await addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: options.prefix,
      global: false,
      watch: nuxt.options.dev
    })

    // Your existing server handlers (KEEP AS-IS)
    addServerHandler({
      route: '/api/newsletter/sendgrid-webhook',
      handler: resolver.resolve('./runtime/server/api/newsletter/sendgrid-webhook.post')
    })

    addServerHandler({
      route: '/api/newsletter/test-connection',
      handler: resolver.resolve('./runtime/server/api/newsletter/test-connection.post')
    })

    if (options.mjmlMode === 'server') {
      addServerHandler({
        route: '/api/newsletter/compile-mjml',
        handler: resolver.resolve('./runtime/server/api/newsletter/compile-mjml.post')
      })
      logger.info('✅ Server-side MJML compilation enabled')
    }

    // Your existing development experience (ENHANCED)
    if (nuxt.options.dev || options.dev) {
      nuxt.hook('build:before', () => {
        const statusLines = [
          '🎉 Newsletter Module Ready! (Modern Edition with Progressive Enhancement)',
          '',
          'Configuration:',
          `  • Directus: ${options.directus.url}`,
          `  • Auth: ${options.directus.auth?.type || 'static'}`,
          `  • MJML: ${options.mjmlMode || 'client'} mode`,
          `  • SendGrid: ${sendgridApiKey ? '✅ configured' : '❌ not configured'}`,
          '',
          'Modern UI Features:',
          `  • TailwindCSS 4: ${options.ui?.autoInstallTailwind !== false ? '✅ enabled' : '❌ disabled'}`,
          `  • Icons: ${options.ui?.icons || 'lucide'}`,
          `  • Drag & Drop: ${options.ui?.enableDragDrop !== false ? '✅ enabled' : '❌ disabled'}`,
          `  • Theme: ${options.ui?.theme?.primaryColor || 'blue'} ${options.ui?.theme?.darkMode ? '(dark mode)' : '(light mode)'}`,
          '',
          'Progressive Enhancement:', // NEW
          `  • Enabled: ${options.progressiveEnhancement?.enabled !== false ? '✅ yes' : '❌ no'}`,
          `  • Adaptive Editor: ${options.progressiveEnhancement?.editor?.adaptiveFeatures !== false ? '✅ yes' : '❌ no'}`,
          `  • Smart Performance: ${options.progressiveEnhancement?.performance?.adaptiveAnimations !== false ? '✅ yes' : '❌ no'}`,
          '',
          'Components available:',
          `  • <${options.prefix}Editor> - Modern drag-drop newsletter editor`,
          `  • <${options.prefix}Preview> - Live preview with device frames`,
          `  • <${options.prefix}Block> - Dynamic block editor with validation`,
          `  • <${options.prefix}Setup> - Configuration and status checker`,
          '',
          'Quick start:',
          '  1. Set up Directus: npm run newsletter:setup',
          '  2. Verify setup: npm run newsletter:verify',
          '  3. Add advanced blocks: npm run newsletter:blocks',
          '',
          '✨ Enjoy the modern newsletter editing experience with adaptive features!'
        ]

        logger.success('\n' + statusLines.join('\n  '))
      })
    }

    // Your existing build transpilation (KEEP AS-IS)
    nuxt.options.build.transpile.push(resolver.resolve('./runtime'))

    logger.success('Modern Newsletter module with Progressive Enhancement initialized successfully! 🚀')
  }
})

// NEW: Progressive enhancement resolution function
async function resolveAutoConfiguration(
  options: NewsletterModuleOptions,
  nuxt: any,
  logger: any,
  getEnvVar: Function
) {
  // Only resolve 'auto' values, keep explicit values as-is
  
  // Auth type auto-detection
  if (options.directus.auth?.type === 'auto') {
    const hasToken = !!(
      options.directus.auth?.token ||
      getEnvVar('DIRECTUS_TOKEN')
    )
    
    const hasAuthMiddleware = nuxt.options.plugins?.some((plugin: any) => 
      typeof plugin === 'string' ? plugin.includes('auth') : 
      plugin.src?.includes('auth')
    ) || false

    if (hasToken) {
      options.directus.auth.type = 'static'
      logger.info('🤖 Auto-detected: Using static token authentication')
    } else if (hasAuthMiddleware) {
      options.directus.auth.type = 'middleware'
      logger.info('🤖 Auto-detected: Using middleware authentication')
    } else {
      options.directus.auth.type = 'static' // Fallback
      logger.warn('🤖 Auto-detect: No auth method found, defaulting to static')
    }
  }

  // MJML mode auto-detection
  if (options.mjmlMode === 'auto') {
    const hasMjmlDependency = existsSync(join(nuxt.options.rootDir, 'node_modules/mjml'))
    options.mjmlMode = hasMjmlDependency ? 'server' : 'client'
    logger.info(`🤖 Auto-detected: MJML mode set to ${options.mjmlMode}`)
  }

  // Development mode auto-detection
  if (options.dev === 'auto') {
    options.dev = nuxt.options.dev
    logger.info(`🤖 Auto-detected: Development mode ${options.dev ? 'enabled' : 'disabled'}`)
  }

  // UI auto-detections
  if (options.ui?.icons === 'auto') {
    const hasNuxtIcon = nuxt.options.modules?.some((module: any) => 
      typeof module === 'string' ? 
        module.includes('@nuxt/icon') : 
        module[0]?.includes('@nuxt/icon')
    )
    options.ui.icons = hasNuxtIcon ? 'lucide' : 'lucide' // Default to lucide
    logger.info(`🤖 Auto-detected: Icon library set to ${options.ui.icons}`)
  }

  if (options.ui?.autoInstallTailwind === 'auto') {
    const hasTailwind = nuxt.options.modules?.some((module: any) => 
      typeof module === 'string' ? 
        module.includes('tailwind') : 
        module[0]?.includes('tailwind')
    ) || nuxt.options.css?.some((css: string) => css.includes('tailwind'))

    options.ui.autoInstallTailwind = !hasTailwind
    logger.info(`🤖 Auto-detected: TailwindCSS auto-install ${options.ui.autoInstallTailwind ? 'enabled' : 'disabled'}`)
  }

  // Other 'auto' resolutions would happen at runtime in the progressive enhancement composable
  logger.info('🤖 Progressive enhancement configuration resolved')
}

// Your existing Tailwind CSS 4 setup function (KEEP AS-IS)
async function setupTailwindCSS4(nuxt: any, logger: any, resolver: any) {
  const rootDir = nuxt.options.rootDir

  const packageJsonPath = join(rootDir, 'package.json')
  let hasTailwind4 = false
  let hasVitePlugin = false

  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

    hasTailwind4 = dependencies.tailwindcss && dependencies.tailwindcss.includes('4.')
    hasVitePlugin = !!dependencies['@tailwindcss/vite']
  }

  const hasTailwindViteConfig = nuxt.options.vite?.plugins?.some((plugin: any) =>
    plugin?.name?.includes('tailwind') || plugin?.toString?.()?.includes('tailwind')
  )

  if (hasTailwind4 && hasVitePlugin && hasTailwindViteConfig) {
    logger.info('✅ Tailwind CSS 4 already configured')
    return
  }

  logger.info('📦 Installing Tailwind CSS 4...')

  try {
    const { execSync } = await import('child_process')

    if (!hasTailwind4 || !hasVitePlugin) {
      execSync('npm install tailwindcss@^4.0.0 @tailwindcss/vite', {
        stdio: 'inherit',
        cwd: rootDir
      })
      logger.info('✅ Tailwind CSS 4 packages installed')
    }

    logger.info('✅ Tailwind CSS 4 configured successfully')

  } catch (error) {
    logger.warn('⚠️  Could not auto-install Tailwind CSS 4. Please install manually:')
    logger.warn('npm install tailwindcss@^4.0.0 @tailwindcss/vite')
  }
}