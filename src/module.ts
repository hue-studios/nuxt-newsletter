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
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // Validate required options
    if (!options.directusUrl) {
      throw new Error("Newsletter module requires directusUrl option");
    }

    // Check for required dependencies - Updated for Tailwind CSS 4
    const requiredModules = ["shadcn-nuxt", "@nuxtjs/color-mode"];

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
npm install shadcn-nuxt @nuxtjs/color-mode

And add them to your nuxt.config.ts modules array:
modules: [
  'shadcn-nuxt',
  '@nuxtjs/color-mode',
  '@hue-studios/nuxt-newsletter'
]

For Tailwind CSS 4 setup, ensure you have:
- tailwindcss package installed
- @tailwindcss/vite plugin configured in your vite.plugins array
- tailwind.config.js with module paths included

For detailed setup instructions, see: https://github.com/hue-studios/nuxt-newsletter#setup
      `);
    }

    // Check for Tailwind CSS 4 setup
    const hasTailwindVitePlugin = nuxt.options.vite?.plugins?.some(
      (plugin: any) => {
        return (
          plugin?.name === "tailwindcss" ||
          (typeof plugin === "function" &&
            plugin.toString().includes("tailwindcss"))
        );
      }
    );

    if (!hasTailwindVitePlugin) {
      console.warn(`
⚠️  Warning: Tailwind CSS 4 Vite plugin not detected.
Please ensure you have:

1. Installed tailwindcss: npm install tailwindcss
2. Added the Vite plugin to your nuxt.config.ts:

import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  // ... rest of your config
})
      `);
    }

    // Check if Shadcn components are properly configured
    if (!nuxt.options.shadcn || Object.keys(nuxt.options.shadcn).length === 0) {
      console.warn(`
⚠️  Warning: Shadcn-nuxt appears to be installed but not configured.
Please ensure you have run: npx shadcn-vue@latest init

And install required components:
npx shadcn-vue@latest add button input label textarea dialog badge card tabs dropdown-menu select switch slider toast alert separator progress sonner
      `);
    }

    // Check for required Tailwind CSS dependencies in package.json
    const packageJsonPath = resolver.resolve("../package.json");
    try {
      const packageJson = require(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (!allDeps.tailwindcss) {
        console.warn(`
⚠️  Warning: 'tailwindcss' package not found in dependencies.
Please install it with: npm install tailwindcss
        `);
      }
    } catch (error) {
      // Package.json not found or unreadable - this is expected for the module itself
    }

    // Add the rest of your module setup here
    // ... (add your existing plugin registrations, server handlers, etc.)

    console.log(
      "✅ Newsletter module loaded successfully with Tailwind CSS 4 support!"
    );
  },
});
