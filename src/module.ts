// src/module.ts
import {
  defineNuxtModule,
  addPlugin,
  addServerHandler,
  addComponent,
  addImports,
  addComponentsDir,
  createResolver,
  installModule,
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

    // Add required Nuxt imports first
    addImports([
      { name: "ref", from: "vue" },
      { name: "computed", from: "vue" },
      { name: "reactive", from: "vue" },
      { name: "readonly", from: "vue" },
      { name: "onMounted", from: "vue" },
      { name: "onUnmounted", from: "vue" },
      { name: "useNuxtApp", from: "#app" },
      { name: "navigateTo", from: "#app/composables/router" },
      { name: "useDebounceFn", from: "@vueuse/core" },
    ]);

    // Add composables with proper structure
    const composableGroups = {
      core: ["useNewsletter", "useNewsletterBlocks", "useNewsletterTemplates"],
      utils: ["useDirectus", "useFileUpload", "useValidation"],
      ui: ["useDragDrop", "useEditor", "usePreview"],
      features: [
        "useAnalytics",
        "useWebhooks",
        "useABTesting",
        "useSegmentation",
      ],
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
      {
        name: "NewsletterSegmentBuilder",
        filePath: resolver.resolve(
          "./runtime/components/forms/NewsletterSegmentBuilder.vue"
        ),
        global: true,
      },
      {
        name: "SegmentBuilder",
        filePath: resolver.resolve(
          "./runtime/components/forms/SegmentBuilder.vue"
        ),
        global: true,
      },
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
    addPlugin(resolver.resolve("./runtime/plugins/directus.client.ts"));
    addPlugin(resolver.resolve("./runtime/plugins/gsap.client.ts"));

    // Add server handlers
    addServerHandler({
      route: "/api/newsletter/core/send",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/core/send.post.ts"
      ),
    });

    addServerHandler({
      route: "/api/newsletter/core/compile-mjml",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/core/compile-mjml.post.ts"
      ),
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
    nuxt.options.runtimeConfig.public = defu(
      nuxt.options.runtimeConfig.public,
      {
        newsletter: {
          directusUrl: options.directusUrl,
          sendgridApiKey: options.sendgridApiKey,
          defaultFromEmail: options.defaultFromEmail,
          defaultFromName: options.defaultFromName,
          webhookSecret: options.webhookSecret,
          enableAnalytics: options.enableAnalytics,
          enableWebhooks: options.enableWebhooks,
        },
      }
    );

    // Also add to private runtime config for server-side
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      newsletter: {
        sendgridApiKey: options.sendgridApiKey,
        webhookSecret: options.webhookSecret,
      },
    });

    // Dependency checking (development warnings)
    if (isDev || isStub || isPrepare) {
      const requiredModules = ["shadcn-nuxt", "@nuxtjs/color-mode"];
      const installedModules = nuxt.options.modules || [];
      const missingModules = requiredModules.filter((module) => {
        return !installedModules.some((m) => {
          // Handle different module declaration formats
          if (typeof m === "string") {
            return m === module;
          } else if (Array.isArray(m) && m.length > 0) {
            return typeof m[0] === "string" && m[0] === module;
          }
          return false;
        });
      });

      if (missingModules.length > 0) {
        console.warn(`⚠️  Missing dependencies: ${missingModules.join(", ")}`);
        console.warn(
          `   Please install them with: npm install ${missingModules.join(" ")}`
        );
      }
    }

    // Install required modules if they're missing (in development)
    if (isDev && !isStub && !isPrepare) {
      try {
        await installModule("@vueuse/nuxt");
      } catch (error) {
        console.warn(
          "Could not auto-install @vueuse/nuxt. Please install manually."
        );
      }
    }
  },
});
