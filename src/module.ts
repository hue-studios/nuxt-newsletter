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
import { defu } from "defu";

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
    name: "@hue-studios/nuxt-newsletter",
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
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // Check if we're in development or stub mode
    const isDev = nuxt.options.dev;
    const isStub = process.argv.includes("--stub");
    const isPrepare = process.argv.includes("prepare");

    // Add composables with proper structure
    const composableGroups = {
      core: ["useNewsletter", "useNewsletterBlocks", "useNewsletterTemplates"],
      utils: ["useDirectus", "useFileUpload", "useValidation"],
      ui: ["useDragDrop", "useEditor", "usePreview"],
      features: ["useAnalytics", "useWebhooks", "useABTesting"],
    };

    Object.entries(composableGroups).forEach(([folder, composables]) => {
      composables.forEach((composable) => {
        addImports({
          name: composable,
          from: resolver.resolve(
            `./runtime/composables/${folder}/${composable}`
          ),
        });
      });
    });

    // Add components properly
    const components = [
      {
        name: "NewsletterEditor",
        filePath: resolver.resolve(
          "./runtime/components/editor/NewsletterEditor.vue"
        ),
        global: true,
      },
      {
        name: "NewsletterList",
        filePath: resolver.resolve(
          "./runtime/components/newsletter/NewsletterList.vue"
        ),
        global: true,
      },
      {
        name: "NewsletterAnalytics",
        filePath: resolver.resolve(
          "./runtime/components/analytics/NewsletterAnalytics.vue"
        ),
        global: true,
      },
      {
        name: "BlockPicker",
        filePath: resolver.resolve(
          "./runtime/components/editor/BlockPicker.vue"
        ),
        global: true,
      },
      {
        name: "NewsletterDashboard",
        filePath: resolver.resolve(
          "./runtime/components/layout/NewsletterDashboard.vue"
        ),
        global: true,
      },
      // Add other components from your current implementation
    ];

    components.forEach((component) => {
      addComponent(component);
    });

    // Add component directories
    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      pathPrefix: false,
      prefix: "Newsletter",
      global: true,
    });

    // Add plugins
    addPlugin(resolver.resolve("./runtime/plugins/newsletter.client.ts"));
    addPlugin(resolver.resolve("./runtime/plugins/gsap.client.ts"));

    // Add server handlers
    addServerHandler({
      route: "/api/newsletter/send",
      handler: resolver.resolve("./runtime/server/api/newsletter/send.post.ts"),
    });

    addServerHandler({
      route: "/api/newsletter/webhooks/sendgrid",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/webhooks/sendgrid.post.ts"
      ),
    });

    // Add types
    nuxt.hook("prepare:types", ({ references }) => {
      references.push({
        types: "@hue-studios/nuxt-newsletter",
      });
    });

    // Add CSS
    nuxt.options.css.push(
      resolver.resolve("./runtime/assets/css/newsletter.css")
    );

    // Add runtime config
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      newsletter: {
        directusUrl: options.directusUrl,
        sendgridApiKey: options.sendgridApiKey,
        defaultFromEmail: options.defaultFromEmail,
        defaultFromName: options.defaultFromName,
        webhookSecret: options.webhookSecret,
        enableAnalytics: options.enableAnalytics,
        enableWebhooks: options.enableWebhooks,
      },
    });

    nuxt.options.runtimeConfig.public = defu(
      nuxt.options.runtimeConfig.public,
      {
        newsletter: {
          directusUrl: options.directusUrl,
          enableAnalytics: options.enableAnalytics,
        },
      }
    );

    // Dependency checking (development warnings)
    if (isDev || isStub || isPrepare) {
      const requiredModules = ["shadcn-nuxt", "@nuxtjs/color-mode"];
      const installedModules = nuxt.options.modules || [];
      const missingModules = requiredModules.filter((module) => {
        return !installedModules.some((m) =>
          typeof m === "string" ? m === module : m[0] === module
        );
      });

      if (missingModules.length > 0) {
        console.warn(`⚠️  Missing dependencies: ${missingModules.join(", ")}`);
      }
    }
  },
});
