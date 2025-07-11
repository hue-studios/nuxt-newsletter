import {
  addComponentsDir,
  addImports,
  addImportsDir,
  addPlugin,
  createResolver,
  defineNuxtModule,
  installModule
} from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
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
       * - 'custom': Provide your own auth handler
       */
      type: 'static' | 'middleware' | 'custom'
      /**
       * Static token (only used when type is 'static')
       */
      token?: string
      /**
       * Middleware name (only used when type is 'middleware')
       * @default 'auth'
       */
      middleware?: string
      /**
       * Custom auth handler (only used when type is 'custom')
       */
      handler?: () => string | Promise<string>
    }
  }
  /**
   * Component prefix
   * @default 'Newsletter'
   */
  prefix?: string
  /**
   * Feature flags
   */
  features?: {
    /**
     * Enable drag and drop functionality
     * @default true
     */
    dragDrop?: boolean
    /**
     * Styling system to use
     * @default 'unstyled'
     */
    styling?: 'tailwind' | 'unstyled' | 'custom'
    /**
     * Enable preview functionality
     * @default true
     */
    preview?: boolean
    /**
     * Enable templates
     * @default true
     */
    templates?: boolean
    /**
     * Enable rich text editor (Tiptap)
     * @default false
     */
    richTextEditor?: boolean
  }
  /**
   * Drag and drop provider
   * @default 'auto'
   */
  dragProvider?: 'sortablejs' | 'draggable-plus' | 'custom' | 'auto'
  /**
   * Custom CSS file path (only used when styling is 'custom')
   */
  customStyles?: string
}

export default defineNuxtModule<NewsletterModuleOptions>({
  meta: {
    name: '@nuxt/newsletter',
    configKey: 'newsletter',
    compatibility: {
      nuxt: '>=3.0.0'
    }
  },
  defaults: {
    directus: {
      url: '',
      auth: {
        type: 'middleware',
        middleware: 'auth'
      }
    },
    prefix: 'Newsletter',
    features: {
      dragDrop: true,
      styling: 'unstyled',
      preview: true,
      templates: true,
      richTextEditor: false
    },
    dragProvider: 'auto'
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Validate required options
    if (!options.directus.url) {
      console.warn('[@nuxt/newsletter] Directus URL is required. Please set `newsletter.directus.url` in your nuxt.config.ts')
    }

    // Add runtime config
    nuxt.options.runtimeConfig.public.newsletter = defu(
      nuxt.options.runtimeConfig.public.newsletter as NewsletterModuleOptions,
      {
        directus: {
          url: options.directus.url,
          auth: options.directus.auth
        },
        features: options.features,
        dragProvider: options.dragProvider
      }
    )

    // Install required dependencies
    await installModule('@vueuse/nuxt')

    // Add plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'all'
    })

    // Add composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Add individual composable imports for better tree-shaking
    addImports([
      {
        name: 'useNewsletter',
        from: resolver.resolve('./runtime/composables/useNewsletter')
      },
      {
        name: 'useNewsletterEditor',
        from: resolver.resolve('./runtime/composables/useNewsletterEditor')
      },
      {
        name: 'useDirectusNewsletter',
        from: resolver.resolve('./runtime/composables/useDirectusNewsletter')
      }
    ])

    // Add components
    await addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: options.prefix,
      global: false
    })

    // Add server utilities if needed
    if (options.directus.auth?.type === 'middleware') {
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.alias = nitroConfig.alias || {}
        nitroConfig.alias['#newsletter'] = resolver.resolve('./runtime/server/utils')
      })
    }

    // Handle styling
    if (options.features?.styling === 'tailwind') {
      // Check if Tailwind is installed
      if (!hasNuxtModule('@nuxtjs/tailwindcss', nuxt)) {
        console.info('[@nuxt/newsletter] TailwindCSS styling is enabled but @nuxtjs/tailwindcss is not installed.')
        console.info('[@nuxt/newsletter] Run: npm install -D @nuxtjs/tailwindcss')
      }
    } else if (options.features?.styling === 'custom' && options.customStyles) {
      nuxt.options.css.push(options.customStyles)
    }

    // Provide development warnings/info
    if (options.features?.dragDrop && options.dragProvider === 'auto') {
      nuxt.hook('build:before', () => {
        console.info('[@nuxt/newsletter] Drag and drop is enabled. Install your preferred provider:')
        console.info('  - SortableJS: npm install sortablejs @types/sortablejs')
        console.info('  - Vue Draggable Plus: npm install vue-draggable-plus')
        console.info('  - Or set dragProvider: "custom" to use your own solution')
      })
    }

    // Rich text editor warning
    if (options.features?.richTextEditor) {
      nuxt.hook('build:before', () => {
        console.info('[@nuxt/newsletter] Rich text editor is enabled. Install Tiptap:')
        console.info('  npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link')
      })
    }

    // Add module transpilation
    nuxt.options.build.transpile.push(resolver.resolve('./runtime'))

    console.info('[@nuxt/newsletter] Module initialized')
  }
})

// Helper to check if a module is installed
function hasNuxtModule(name: string, nuxt: Nuxt): boolean {
  return nuxt.options.modules.some((m) => {
    if (typeof m === 'string') return m === name
    if (Array.isArray(m)) return m[0] === name
    return false
  })
}