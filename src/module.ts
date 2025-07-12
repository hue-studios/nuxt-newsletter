import {
  addComponentsDir,
  addImportsDir,
  addPlugin,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  installModule
} from '@nuxt/kit'
import { defu } from 'defu'

export interface NewsletterModuleOptions {
  /**
   * Directus configuration
   */
  directus: {
    /**
     * Directus instance URL
     */
    url: string
    /**
     * Authentication configuration
     */
    auth?: {
      /**
       * Authentication type
       * - 'static': Use a static token
       * - 'middleware': Use Nuxt middleware for auth
       */
      type: 'static' | 'middleware'
      /**
       * Static token (only used when type is 'static')
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
   * SendGrid configuration
   */
  sendgrid: {
    /**
     * SendGrid API key
     */
    apiKey?: string
    /**
     * Webhook verification secret
     */
    webhookSecret?: string
    /**
     * Default from email
     */
    defaultFromEmail?: string
    /**
     * Default from name
     */
    defaultFromName?: string
  }
  /**
   * MJML compilation mode
   * @default 'client'
   */
  mjmlMode?: 'client' | 'server'
  /**
   * Component prefix
   * @default 'Newsletter'
   */
  prefix?: string
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
    prefix: 'Newsletter'
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Validate required options
    if (!options.directus.url) {
      console.warn('[@hue-studios/nuxt-newsletter] Directus URL is required. Please set `newsletter.directus.url` in your nuxt.config.ts')
    }

    // Add runtime config
    nuxt.options.runtimeConfig.public.newsletter = defu(
      nuxt.options.runtimeConfig.public.newsletter as NewsletterModuleOptions,
      {
        directus: {
          url: options.directus.url,
          auth: options.directus.auth
        },
        defaultFromEmail: options.sendgrid.defaultFromEmail,
        defaultFromName: options.sendgrid.defaultFromName,
        mjmlMode: options.mjmlMode
      }
    )

    // Add private runtime config for sensitive data
    nuxt.options.runtimeConfig.sendgridApiKey = options.sendgrid.apiKey || process.env.SENDGRID_API_KEY || ''
    nuxt.options.runtimeConfig.sendgridWebhookSecret = options.sendgrid.webhookSecret || process.env.SENDGRID_WEBHOOK_SECRET || ''
    nuxt.options.runtimeConfig.directusAdminToken = process.env.DIRECTUS_ADMIN_TOKEN || ''

    // Install required dependencies
    await installModule('@vueuse/nuxt')

    // Add plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'all'
    })

    // Add composables directory (this will auto-import all composables)
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Add components
    await addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: options.prefix,
      global: false
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
    }

    // Add server utilities if needed
    if (options.directus.auth?.type === 'middleware') {
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.alias = nitroConfig.alias || {}
        nitroConfig.alias['#newsletter'] = resolver.resolve('./runtime/server/utils')
      })
    }

    // Add module transpilation
    nuxt.options.build.transpile.push(resolver.resolve('./runtime'))

    // Development hints
    nuxt.hook('build:before', () => {
      if (!options.sendgrid.apiKey && !process.env.SENDGRID_API_KEY) {
        console.info('[@hue-studios/nuxt-newsletter] SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.')
      }

      if (options.mjmlMode === 'server') {
        console.info('[@hue-studios/nuxt-newsletter] Server-side MJML compilation enabled. Install mjml: npm install mjml')
      } else {
        console.info('[@hue-studios/nuxt-newsletter] Client-side MJML compilation enabled. MJML browser will be loaded automatically.')
      }
    })

    console.info('[@hue-studios/nuxt-newsletter] Module initialized (v1.0.0)')
  }
})