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
  addImportsDir,
} from "@nuxt/kit";

export interface ModuleOptions {
  directusUrl: string;
  sendgridApiKey?: string;
  defaultFromEmail?: string;
  defaultFromName?: string;
  webhookSecret?: string;
  enableAnalytics?: boolean;
  enableWebhooks?: boolean;
  enableTemplates?: boolean;
  enableABTesting?: boolean;
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
    enableTemplates: true,
    enableABTesting: false,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // Validate required options
    if (!options.directusUrl) {
      throw new Error("Newsletter module requires directusUrl option");
    }

    // Install modern Nuxt modules first
    await installModule("@nuxt/icon", {
      provider: "iconify",
      class: "",
      aliases: {},
      iconifyApiOptions: {
        url: "https://api.iconify.design",
        publicApiFallback: true,
      },
    });

    await installModule("shadcn-nuxt", {
      prefix: "Ui",
      componentDir: "./components/ui",
    });

    await installModule("nuxt-echarts", {
      charts: ["LineChart", "BarChart", "PieChart"],
      components: [
        "GridComponent",
        "TooltipComponent",
        "LegendComponent",
        "ToolboxComponent",
      ],
      features: ["LabelLayout", "UniversalTransition"],
      ssr: true,
    });

    await installModule("@vueuse/nuxt");

    // Add runtime config (keeping your existing structure)
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
      enableTemplates: options.enableTemplates,
      enableABTesting: options.enableABTesting,
    };

    // Add required dependencies for transpilation
    nuxt.options.build = nuxt.options.build || {};
    nuxt.options.build.transpile = nuxt.options.build.transpile || [];
    nuxt.options.build.transpile.push(
      "@directus/sdk",
      "mjml",
      "handlebars",
      "@sendgrid/mail",
      "gsap",
      "vue-sonner"
    );

    // Add components (keeping your existing setup)
    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      pathPrefix: false,
      prefix: "",
      global: true,
    });

    // Add composables (enhanced with directory auto-import)
    addImportsDir(resolver.resolve("./runtime/composables"));

    // Keep your existing specific imports for better intellisense
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
      // Add new toast composable
      {
        name: "useToast",
        from: resolver.resolve("./runtime/composables/utils/useToast"),
      },
    ]);

    // Add server handlers (keeping all your existing ones)
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
      route: "/api/newsletter/analytics/**",
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

    // Add plugins (keeping your existing one + new toast plugin)
    addPlugin(resolver.resolve("./runtime/plugins/newsletter.client"));
    addPlugin(resolver.resolve("./runtime/plugins/vue-sonner.client"));

    // Add types (keeping your existing setup)
    nuxt.hook("prepare:types", (options) => {
      options.references.push({
        path: resolver.resolve("./runtime/types/newsletter.d.ts"),
      });
    });

    // Add CSS (keeping your existing setup)
    nuxt.options.css = nuxt.options.css || [];
    nuxt.options.css.push(resolver.resolve("./runtime/assets/newsletter.css"));

    // Configure Tailwind CSS if not already configured
    if (!nuxt.options.css.some((css) => css.includes("tailwindcss"))) {
      nuxt.options.css.push("tailwindcss/base");
      nuxt.options.css.push("tailwindcss/components");
      nuxt.options.css.push("tailwindcss/utilities");
    }

    // Ensure Icon module has the required collections
    nuxt.options.icon = nuxt.options.icon || {};
    nuxt.options.icon.collections = nuxt.options.icon.collections || [];
    if (!nuxt.options.icon.collections.includes("lucide")) {
      nuxt.options.icon.collections.push("lucide");
    }

    // Log successful setup with modern libraries
    console.log("📧 Newsletter module loaded with modern libraries");
    console.log("   ✅ shadcn-nuxt (UI components)");
    console.log("   ✅ nuxt-echarts (Charts)");
    console.log("   ✅ @nuxt/icon (Icons)");
    console.log("   ✅ vue-sonner (Toasts)");
    if (options.enableAnalytics) console.log("   ✅ Analytics enabled");
    if (options.enableWebhooks) console.log("   ✅ Webhooks enabled");
    if (options.enableTemplates) console.log("   ✅ Templates enabled");
    if (options.enableABTesting) console.log("   ✅ A/B Testing enabled");
  },
});
