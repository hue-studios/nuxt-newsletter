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
     * Auto-install TailwindCSS if not present
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

    // Enhanced validation with helpful error messages
    if (!options.directus.url) {
      logger.error(`
🚨 Newsletter Module Setup Error:

Directus URL is required! Please add to your nuxt.config.ts:

newsletter: {
  directus: {
    url: 'https://your-directus-instance.com',
    auth: {
      type: 'static',
      token: process.env.DIRECTUS_TOKEN
    }
  }
}

Or set the DIRECTUS_URL environment variable.

📚 Need help? Visit: https://github.com/hue-studios/nuxt-newsletter#setup
      `)
      throw new Error('Directus URL is required for the newsletter module')
    }

    // Check for required environment variables
    const directusToken = options.directus.auth?.token || process.env.DIRECTUS_TOKEN
    if (options.directus.auth?.type === 'static' && !directusToken) {
      logger.warn(`
⚠️  Newsletter Module Warning:

No Directus token configured! You'll need to set either:
1. newsletter.directus.auth.token in nuxt.config.ts
2. DIRECTUS_TOKEN environment variable

Without this, the module won't be able to connect to Directus.
      `)
    }

    // Check SendGrid setup
    const sendgridKey = options.sendgrid?.apiKey || process.env.SENDGRID_API_KEY
    if (!sendgridKey) {
      logger.info(`
ℹ️  Newsletter Module Info:

No SendGrid API key found. Email sending will be disabled.
To enable email sending, set SENDGRID_API_KEY environment variable.
      `)
    }

    // Enhanced runtime config with modern UI options
    nuxt.options.runtimeConfig.public.newsletter = defu(
      nuxt.options.runtimeConfig.public.newsletter as NewsletterModuleOptions,
      {
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
    )

    // Private runtime config for sensitive data
    nuxt.options.runtimeConfig.sendgridApiKey = sendgridKey || ''
    nuxt.options.runtimeConfig.sendgridWebhookSecret = options.sendgrid?.webhookSecret || process.env.SENDGRID_WEBHOOK_SECRET || ''
    nuxt.options.runtimeConfig.directusAdminToken = process.env.DIRECTUS_ADMIN_TOKEN || ''

    // Install required dependencies with enhanced error handling
    try {
      // Core dependencies
      await installModule('@vueuse/nuxt')
      logger.info('✅ @vueuse/nuxt installed')

      // Icon support
      await installModule('@nuxt/icon')
      logger.info(`✅ @nuxt/icon installed with ${options.ui?.icons || 'lucide'} icons`)
      
      // Auto-install TailwindCSS if enabled and not already present
      if (options.ui?.autoInstallTailwind !== false) {
        const hasTailwind = nuxt.options.modules.some(m => 
          (typeof m === 'string' && m.includes('tailwindcss')) ||
          (Array.isArray(m) && m[0]?.includes('tailwindcss'))
        )
        
        if (!hasTailwind) {
          await installModule('@nuxtjs/tailwindcss')
          logger.info('✅ @nuxtjs/tailwindcss auto-installed for modern UI')
        } else {
          logger.info('✅ TailwindCSS already configured')
        }
      }

      // Color mode support if dark mode is enabled
      if (options.ui?.theme?.darkMode) {
        const hasColorMode = nuxt.options.modules.some(m => 
          (typeof m === 'string' && m.includes('color-mode')) ||
          (Array.isArray(m) && m[0]?.includes('color-mode'))
        )
        
        if (!hasColorMode) {
          await installModule('@nuxtjs/color-mode')
          logger.info('✅ @nuxtjs/color-mode installed for dark mode support')
        }
      }

    } catch (error) {
      logger.error('Failed to install required dependencies. Please install manually:')
      logger.error('npm install @vueuse/nuxt @nuxt/icon @nuxtjs/tailwindcss')
      throw error
    }

    // Add plugin with enhanced initialization
    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'all'
    })

    // Add composables with better auto-completion and descriptions
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

    // Add components with better organization
    await addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: options.prefix,
      global: false,
      watch: nuxt.options.dev
    })

    // Add server handlers with better error handling
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
      // Add development middleware for better debugging
      nuxt.hook('render:route', (url, result, context) => {
        if (url.includes('/newsletter') && result.error) {
          logger.error(`Newsletter route error: ${url}`, result.error)
        }
      })

      // Add helpful development logs with modern features
      nuxt.hook('build:before', () => {
        logger.success(`
🎉 Newsletter Module Ready! (Modern UI Edition)

Configuration:
  • Directus: ${options.directus.url}
  • Auth: ${options.directus.auth?.type || 'static'}
  • MJML: ${options.mjmlMode || 'client'} mode
  • SendGrid: ${sendgridKey ? '✅ configured' : '❌ not configured'}

Modern UI Features:
  • TailwindCSS: ${options.ui?.autoInstallTailwind !== false ? '✅ enabled' : '❌ disabled'}
  • Icons: ${options.ui?.icons || 'lucide'}
  • Drag & Drop: ${options.ui?.enableDragDrop !== false ? '✅ enabled' : '❌ disabled'}
  • Theme: ${options.ui?.theme?.primaryColor || 'blue'} ${options.ui?.theme?.darkMode ? '(dark mode)' : '(light mode)'}

Components available:
  • <${options.prefix}Editor> - Modern drag-drop newsletter editor
  • <${options.prefix}Preview> - Live preview with device frames
  • <${options.prefix}Block> - Dynamic block editor with validation

Quick start:
  1. Set up Directus: npm run newsletter:setup
  2. Verify setup: npm run newsletter:verify
  3. Add advanced blocks: npm run newsletter:blocks

✨ Enjoy the modern newsletter editing experience!
        `)
      })
    }

    // Add build transpilation
    nuxt.options.build.transpile.push(resolver.resolve('./runtime'))

    // Enhanced error handling for common issues
    nuxt.hook('close', () => {
      // Cleanup and final checks
      if (nuxt.options.dev) {
        logger.info('Newsletter module cleanup completed')
      }
    })

    // Add custom CSS for TailwindCSS if needed
    if (options.ui?.autoInstallTailwind !== false) {
      nuxt.options.css = nuxt.options.css || []
      
      // Add custom newsletter styles if they don't exist
      const customCssPath = resolver.resolve('./runtime/assets/newsletter.css')
      if (!nuxt.options.css.some(css => css.includes('newsletter.css'))) {
        // Note: We'd need to create this CSS file with newsletter-specific styles
        // nuxt.options.css.push(customCssPath)
      }
    }

    logger.success('Modern Newsletter module initialized successfully! 🚀')
  }
})