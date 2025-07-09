// src/module.ts
import {
  defineNuxtModule,
  addPlugin,
  addServerHandler,
  addComponent,
  addImports,
  addComponentsDir,
  createResolver,
  addTypeTemplate,
} from "@nuxt/kit";
import { defu } from "defu";

export interface ModuleOptions {
  directusUrl: string;
  directusToken?: string;
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

    // Check environment flags
    const isDev = nuxt.options.dev;
    const isStub = process.argv.includes("--stub");
    const isPrepare = process.argv.includes("prepare");

    // Add type template for better TypeScript support
    addTypeTemplate({
      filename: "types/newsletter.d.ts",
      write: true,
      getContents: () => /* typescript */ `
        declare module '#app' {
          interface NuxtApp {
            $directus: any
            $directusHelpers: any
            $gsap: {
              gsap: any
              Draggable: any
              ScrollTrigger: any
              ScrollSmoother: any
              MorphSVGPlugin: any
            }
            $newsletter: {
              generateSlug: (title: string) => string
              validateEmail: (email: string) => boolean
            }
          }
        }
        
        declare module 'vue' {
          interface ComponentCustomProperties {
            $directus: any
            $directusHelpers: any
            $gsap: {
              gsap: any
              Draggable: any
              ScrollTrigger: any
              ScrollSmoother: any
              MorphSVGPlugin: any
            }
            $newsletter: {
              generateSlug: (title: string) => string
              validateEmail: (email: string) => boolean
            }
          }
        }
        
        export {}
      `,
    });

    // Add composables with proper structure
    const composableGroups = {
      core: ["useNewsletter", "useNewsletterBlocks", "useNewsletterTemplates"],
      utils: ["useDirectus", "useFileUpload", "useValidation"],
      ui: ["useDragDrop", "useEditor", "usePreview"],
      features: ["useAnalytics", "useWebhooks", "useABTesting"],
    };

    Object.entries(composableGroups).forEach(([folder, composables]) => {
      composables.forEach((composable) => {
        const composablePath = resolver.resolve(
          `./runtime/composables/${folder}/${composable}.ts`
        );
        addImports({
          name: composable,
          from: composablePath,
        });
      });
    });

    // Add components
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

    // Add plugins in correct order
    addPlugin(resolver.resolve("./runtime/plugins/newsletter.client.ts"));
    addPlugin(resolver.resolve("./runtime/plugins/directus.client.ts"));
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

    addServerHandler({
      route: "/api/newsletter/list",
      handler: resolver.resolve("./runtime/server/api/newsletter/list.get.ts"),
    });

    addServerHandler({
      route: "/api/newsletter/create",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/create.post.ts"
      ),
    });

    addServerHandler({
      route: "/api/newsletter/update",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/update.put.ts"
      ),
    });

    addServerHandler({
      route: "/api/newsletter/delete",
      handler: resolver.resolve(
        "./runtime/server/api/newsletter/delete.delete.ts"
      ),
    });

    // Add CSS
    nuxt.options.css.push(
      resolver.resolve("./runtime/assets/css/newsletter.css")
    );

    // Add runtime config
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      newsletter: {
        directusUrl: options.directusUrl,
        directusToken: options.directusToken,
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

    // Add transpile for GSAP
    nuxt.options.build = nuxt.options.build || {};
    nuxt.options.build.transpile = nuxt.options.build.transpile || [];
    nuxt.options.build.transpile.push("gsap");

    // Add GSAP to optimizeDeps (for Vite)
    nuxt.options.vite = nuxt.options.vite || {};
    nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {};
    nuxt.options.vite.optimizeDeps.include =
      nuxt.options.vite.optimizeDeps.include || [];
    nuxt.options.vite.optimizeDeps.include.push(
      "gsap",
      "gsap/Draggable",
      "gsap/ScrollTrigger",
      "gsap/ScrollSmoother",
      "gsap/MorphSVGPlugin"
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
