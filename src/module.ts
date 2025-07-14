// src/module.ts
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
       * @default 'static'
       */
      type: 'static' | 'middleware'
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
   * @default 'client'
   */
  mjmlMode?: 'client' | 'server'
  /**
   * Component prefix for auto-imported components
   * @default 'Newsletter'
   * @example 'Newsletter' creates <NewsletterEditor>, <NewsletterPreview>, etc.
   */
  prefix?: string
  /**
   * Enable development helpers and enhanced error messages
   * @default false in production
   */
  dev?: boolean
  /**
   * Modern UI configuration
   */
  ui?: {
    /**
     * Icon library to use
     * @default 'lucide'
     */
    icons?: 'lucide' | 'heroicons' | 'tabler'
    /**
     * Enable drag and drop functionality
     * @default true
     */
    enableDragDrop?: boolean
    /**
     * Auto-install TailwindCSS 4 if not present
     * @default true
     */
    autoInstallTailwind?: boolean
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
       * @default false
       */
      darkMode?: boolean
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
        type: 'static',
        middleware: 'auth'
      }
    },
    sendgrid: {
      defaultFromEmail: 'newsletter@example.com',
      defaultFromName: 'Newsletter'
    },
    mjmlMode: 'client',
    prefix: 'Newsletter',
    dev: false,
    ui: {
      icons: 'lucide',
      enableDragDrop: true,
      autoInstallTailwind: true,
      theme: {
        primaryColor: 'blue',
        darkMode: false
      }
    }
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const logger = useLogger('@hue-studios/nuxt-newsletter')

    // Enhanced environment variable handling
    const getEnvVar = (key: string, fallback = '') => {
      return process.env[key] || nuxt.options.runtimeConfig?.[key] || fallback
    }

    // Skip validation during build/prepare phase
    const isBuilding = process.env.NODE_ENV === 'prerender' || 
                      process.argv.includes('prepare') || 
                      process.argv.includes('build') ||
                      process.argv.includes('dev:prepare')

    // Get configuration values with better environment variable handling
    const directusUrl = options.directus.url || getEnvVar('DIRECTUS_URL')
    const directusToken = options.directus.auth?.token || getEnvVar('DIRECTUS_TOKEN')
    const sendgridApiKey = options.sendgrid?.apiKey || getEnvVar('SENDGRID_API_KEY')
    const sendgridWebhookSecret = options.sendgrid?.webhookSecret || getEnvVar('SENDGRID_WEBHOOK_SECRET')

    // Enhanced validation with better error messages
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
      options.directus.url = directusUrl
    }

    // Check authentication setup
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

    // Enhanced SendGrid setup check
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

    // Enhanced runtime config setup
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      // Private (server-side only)
      sendgridApiKey: sendgridApiKey || '',
      sendgridWebhookSecret: sendgridWebhookSecret || '',
      directusAdminToken: getEnvVar('DIRECTUS_ADMIN_TOKEN'),
      
      // Public (client-side accessible)
      public: {
        newsletter: {
          directus: {
            url: options.directus.url,
            auth: {
              type: options.directus.auth?.type || 'static',
              middleware: options.directus.auth?.middleware || 'auth'
            }
          },
          sendgrid: {
            defaultFromEmail: options.sendgrid?.defaultFromEmail || 'newsletter@example.com',
            defaultFromName: options.sendgrid?.defaultFromName || 'Newsletter'
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
          }
        }
      }
    })

    // Install required dependencies with enhanced error handling
    try {
      // Core dependencies
      await installModule('@vueuse/nuxt')
      logger.info('✅ @vueuse/nuxt installed')

      // Icon support
      await installModule('@nuxt/icon')
      logger.info(`✅ @nuxt/icon installed with ${options.ui?.icons || 'lucide'} icons`)
      
      // Auto-install TailwindCSS 4 if enabled and not already present
      if (options.ui?.autoInstallTailwind !== false) {
        await setupTailwindCSS4(nuxt, logger, resolver)
      }

      // Color mode support if dark mode is enabled
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

    // Add plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'all'
    })

    // Add composables
    addImports([
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
      }
    ])

    // Add drag and drop composable if enabled
    if (options.ui?.enableDragDrop !== false) {
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

    // Add components
    await addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: options.prefix,
      global: false,
      watch: nuxt.options.dev
    })

    // Add server handlers
    addServerHandler({
      route: '/api/newsletter/sendgrid-webhook',
      handler: resolver.resolve('./runtime/server/api/newsletter/sendgrid-webhook.post')
    })

    if (options.mjmlMode === 'server') {
      addServerHandler({
        route: '/api/newsletter/compile-mjml',
        handler: resolver.resolve('./runtime/server/api/newsletter/compile-mjml.post')
      })
      logger.info('✅ Server-side MJML compilation enabled')
    }

    // Enhanced development experience
    if (nuxt.options.dev || options.dev) {
      nuxt.hook('build:before', () => {
        const statusLines = [
          '🎉 Newsletter Module Ready! (Modern Edition)',
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
          'Components available:',
          `  • <${options.prefix}Editor> - Modern drag-drop newsletter editor`,
          `  • <${options.prefix}Preview> - Live preview with device frames`,
          `  • <${options.prefix}Block> - Dynamic block editor with validation`,
          '',
          'Quick start:',
          '  1. Set up Directus: npm run newsletter:setup',
          '  2. Verify setup: npm run newsletter:verify',
          '  3. Add advanced blocks: npm run newsletter:blocks',
          '',
          '✨ Enjoy the modern newsletter editing experience!'
        ]
        
        logger.success('\n' + statusLines.join('\n  '))
      })
    }

    // Add build transpilation
    nuxt.options.build.transpile.push(resolver.resolve('./runtime'))

    logger.success('Modern Newsletter module initialized successfully! 🚀')
  }
})

// Tailwind CSS 4 setup function (same as before)
async function setupTailwindCSS4(nuxt: any, logger: any, resolver: any) {
  // Implementation stays the same as in your original code
  const rootDir = nuxt.options.rootDir

  // Check if Tailwind CSS 4 is already installed
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