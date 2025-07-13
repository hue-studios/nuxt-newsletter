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
    dev: false
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

    // Enhanced runtime config
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
        dev: options.dev || nuxt.options.dev
      }
    )

    // Private runtime config for sensitive data
    nuxt.options.runtimeConfig.sendgridApiKey = sendgridKey || ''
    nuxt.options.runtimeConfig.sendgridWebhookSecret = options.sendgrid?.webhookSecret || process.env.SENDGRID_WEBHOOK_SECRET || ''
    nuxt.options.runtimeConfig.directusAdminToken = process.env.DIRECTUS_ADMIN_TOKEN || ''

    // Install required dependencies with error handling
    try {
      await installModule('@vueuse/nuxt')
    } catch (error) {
      logger.error('Failed to install @vueuse/nuxt. Please install manually: npm install @vueuse/nuxt')
      throw error
    }

    // Add plugin with enhanced initialization
    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'all'
    })

    // Add composables with better auto-completion
    addImports([
      { 
        name: 'useDirectusNewsletter', 
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Access Directus newsletter operations (CRUD, templates, etc.)'
        }
      },
      { 
        name: 'useMjmlCompiler', 
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Compile newsletters to MJML and HTML'
        }
      },
      { 
        name: 'useNewsletter', 
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Access newsletter module configuration'
        }
      },
      { 
        name: 'useNewsletterEditor', 
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'Newsletter editor state management'
        }
      },
      { 
        name: 'useSendGrid', 
        from: resolver.resolve('./runtime/composables/index'),
        meta: {
          description: 'SendGrid email operations'
        }
      }
    ])

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
    }

    // Enhanced development experience
    if (nuxt.options.dev || options.dev) {
      // Add development middleware for better debugging
      nuxt.hook('render:route', (url, result, context) => {
        if (url.includes('/newsletter') && result.error) {
          logger.error(`Newsletter route error: ${url}`, result.error)
        }
      })

      // Add helpful development logs
      nuxt.hook('build:before', () => {
        logger.success(`
🎉 Newsletter Module Ready!

Configuration:
  • Directus: ${options.directus.url}
  • Auth: ${options.directus.auth?.type || 'static'}
  • MJML: ${options.mjmlMode || 'client'} mode
  • SendGrid: ${sendgridKey ? '✅ configured' : '❌ not configured'}

Components available:
  • <${options.prefix}Editor> - Main newsletter editor
  • <${options.prefix}Preview> - Live preview component
  • <${options.prefix}Block> - Individual block editor

Quick start:
  1. Set up Directus: npm run newsletter:setup
  2. Verify setup: npm run newsletter:verify
  3. Add blocks: npm run newsletter:blocks
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

    logger.success('Newsletter module initialized successfully!')
  }
})