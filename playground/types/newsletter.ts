import type { NewsletterModuleOptions } from '../../src/module'

declare module '#app' {
  interface NuxtApp {
    $newsletter: {
      config: NewsletterModuleOptions
      initialized: boolean
      version: string
    }
  }
}

export { }
