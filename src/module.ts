// src/module.ts
import {
  defineNuxtModule,
  addPlugin,
  addServerHandler,
  addComponent,
  addImports,
  addComponentsDir,
  createResolver,
} from "@nuxt/kit";

export interface ModuleOptions {
  directusUrl: string;
  sendgridApiKey?: string;
  defaultFromEmail?: string;
  defaultFromName?: string;
  webhookSecret?: string;
  enableAnalytics?: boolean;
  enableWebhooks?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@your-org/nuxt-newsletter",
    configKey: "newsletter",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  defaults: {
    directusUrl: "",
    enableAnalytics: true,
    enableWebhooks: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // Validate required options
    if (!options.directusUrl) {
      throw new Error("Newsletter module requires directusUrl option");
    }

    // Check for required dependencies
    const requiredModules = [
      "@nuxtjs/tailwindcss",
      "shadcn-nuxt",
      "@nuxtjs/color-mode",
    ];

    const missingModules = requiredModules.filter((module) => {
      return (
        !nuxt.options.modules?.includes(module) &&
        !nuxt.options._modules?.find((m) =>
          typeof m === "string" ? m === module : m[0] === module
        )
      );
    });

    if (missingModules.length > 0) {
      throw new Error(`
Newsletter module requires the following dependencies to be installed and configured:

Missing modules: ${missingModules.join(", ")}

Please install them with:
npm install @nuxtjs/tailwindcss shadcn-nuxt @nuxtjs/color-mode

And add them to your nuxt.config.ts modules array:
modules: [
  '@nuxtjs/tailwindcss',
  'shadcn-nuxt',
  '@nuxtjs/color-mode',
  '@your-org/nuxt-newsletter'
]

For detailed setup instructions, see: https://github.com/your-org/nuxt-newsletter#setup
      `);
    }

    // Check if Shadcn components are properly configured
    if (!nuxt.options.shadcn || Object.keys(nuxt.options.shadcn).length === 0) {
      console.warn(`
⚠️  Warning: Shadcn-nuxt appears to be installed but not configured.
Please run: npx shadcn-vue@latest init
Or configure it manually in your nuxt.config.ts

For setup instructions, see: https://github.com/your-org/nuxt-newsletter#shadcn-setup
      `);
    }

    // Add runtime config
    nuxt.options.runtimeConfig = nuxt.options.runtimeConfig || {};
    nuxt.options.runtimeConfig.newsletter = {
      sendgridApiKey: options.sendgridApiKey,
      defaultFromEmail: options.defaultFromEmail,
      defaultFromName: options.defaultFromName,
      webhookSecret: options.webhookSecret,
    };

    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {};
    nuxt.options.runtimeConfig.public.newsletter = {
      directusUrl: options.directusUrl,
      enableAnalytics: options.enableAnalytics,
      enableWebhooks: options.enableWebhooks,
    };

    // Add required dependencies for transpilation
    nuxt.options.build = nuxt.options.build || {};
    nuxt.options.build.transpile = nuxt.options.build.transpile || [];
    nuxt.options.build.transpile.push(
      "@directus/sdk",
      "mjml",
      "handlebars",
      "@sendgrid/mail",
      "gsap"
    );

    // Add components
    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      pathPrefix: false,
      prefix: "",
      global: true,
    });

    // Add composables
    addImports([
      {
        name: "useNewsletter",
        from: resolver.resolve("./runtime/composables/useNewsletter"),
      },
      {
        name: "useNewsletterBlocks",
        from: resolver.resolve("./runtime/composables/useNewsletterBlocks"),
      },
      {
        name: "useNewsletterTemplates",
        from: resolver.resolve("./runtime/composables/useNewsletterTemplates"),
      },
      {
        name: "useDirectus",
        from: resolver.resolve("./runtime/composables/useDirectus"),
      },
    ]);

    // Add plugins
    addPlugin(resolver.resolve("./runtime/plugins/newsletter.client"));
    addPlugin(resolver.resolve("./runtime/plugins/directus"));
    addPlugin(resolver.resolve("./runtime/plugins/gsap.client"));

    // Add server handlers
    addServerHandler({
      route: "/api/newsletter/compile-mjml",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/compile-mjml.post"
      ),
    });

    addServerHandler({
      route: "/api/newsletter/send-test",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/send-test.post"
      ),
    });

    addServerHandler({
      route: "/api/newsletter/send",
      handler: resolver.resolve("./runtime/server/api/newsletter/send.post"),
    });

    addServerHandler({
      route: "/api/newsletter/upload-image",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/upload-image.post"
      ),
    });

    addServerHandler({
      route: "/api/newsletter/analytics/[id]",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/analytics/[id].get"
      ),
    });

    if (options.enableWebhooks) {
      addServerHandler({
        route: "/api/newsletter/webhook/sendgrid",
        handler: resolver.resolve(
          "./runtime/server/api/newsletter/webhook/sendgrid.post"
        ),
      });
    }

    // Add pages
    nuxt.hook("pages:extend", (pages) => {
      pages.push(
        {
          name: "newsletters",
          path: "/newsletters",
          file: resolver.resolve("./runtime/pages/newsletters/index.vue"),
        },
        {
          name: "newsletters-id-edit",
          path: "/newsletters/:id/edit",
          file: resolver.resolve("./runtime/pages/newsletters/[id]/edit.vue"),
        },
        {
          name: "newsletters-id-analytics",
          path: "/newsletters/:id/analytics",
          file: resolver.resolve(
            "./runtime/pages/newsletters/[id]/analytics.vue"
          ),
        }
      );
    });

    // Add CSS
    nuxt.options.css = nuxt.options.css || [];
    nuxt.options.css.push(
      resolver.resolve("./runtime/assets/css/newsletter.css")
    );

    console.log("✅ Newsletter module loaded successfully");
  },
});
