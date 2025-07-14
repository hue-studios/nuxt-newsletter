# Tailwind CSS 4 Setup Guide

## Automatic Setup (Recommended)

The newsletter module will automatically detect and install Tailwind CSS 4 for you. Just add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@hue-studios/nuxt-newsletter'],
  
  newsletter: {
    directus: {
      url: process.env.DIRECTUS_URL,
      auth: { type: 'static', token: process.env.DIRECTUS_TOKEN }
    },
    ui: {
      autoInstallTailwind: true // Default: true
    }
  }
})
```

The module will automatically:
- ✅ Install `tailwindcss@^4.0.0` and `@tailwindcss/vite`
- ✅ Add the Tailwind Vite plugin to your config
- ✅ Create a `tailwind.config.ts` with newsletter module paths
- ✅ Configure content scanning for the newsletter components

## Manual Setup

If you prefer to set up Tailwind CSS 4 manually:

### 1. Install Dependencies

```bash
npm install tailwindcss@^4.0.0 @tailwindcss/vite
```

### 2. Update nuxt.config.ts

```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@hue-studios/nuxt-newsletter'],
  
  vite: {
    plugins: [tailwindcss()],
  },
  
  newsletter: {
    directus: {
      url: process.env.DIRECTUS_URL,
      auth: { type: 'static', token: process.env.DIRECTUS_TOKEN }
    },
    ui: {
      autoInstallTailwind: false // Disable auto-install
    }
  }
})
```

### 3. Create tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue", 
    "./pages/**/*.vue",
    "./app.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    // Newsletter module components - REQUIRED
    "./node_modules/@hue-studios/nuxt-newsletter/dist/**/*.{js,vue,ts}",
  ],

  theme: {
    extend: {
      // Your custom theme extensions
    },
  },
};

export default config;
```

## Upgrading from Tailwind CSS 3

If you're upgrading from the old `@nuxtjs/tailwindcss` module:

### 1. Remove the old module

```bash
npm uninstall @nuxtjs/tailwindcss
```

### 2. Update nuxt.config.ts

```diff
export default defineNuxtConfig({
  modules: [
-   '@nuxtjs/tailwindcss',
    '@hue-studios/nuxt-newsletter'
  ],
  
+ vite: {
+   plugins: [tailwindcss()],
+ },
})
```

### 3. Update your tailwind.config

Rename `tailwind.config.js` to `tailwind.config.ts` and add TypeScript typing:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  // Your existing config
  content: [
    // Your existing paths
    "./node_modules/@hue-studios/nuxt-newsletter/dist/**/*.{js,vue,ts}",
  ],
};

export default config;
```

## Optional Utility Packages

For enhanced Tailwind experience, you can install these optional packages:

```bash
npm install tailwind-merge clsx tw-animate-css
```

- **`tailwind-merge`**: Merge Tailwind classes intelligently
- **`clsx`**: Conditional class names utility  
- **`tw-animate-css`**: Additional animations

Example usage:

```vue
<script setup>
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'

const buttonClass = twMerge(
  'px-4 py-2 rounded',
  clsx({
    'bg-blue-500 text-white': isPrimary,
    'bg-gray-200 text-gray-800': !isPrimary
  })
)
</script>
```

## Verification

Run the verification script to ensure everything is set up correctly:

```bash
npm run newsletter:verify
```

This will check:
- ✅ Tailwind CSS 4 packages are installed
- ✅ Vite plugin is configured  
- ✅ Content paths include newsletter module
- ✅ TypeScript configuration is correct

## Troubleshooting

### Module not found: tailwindcss

Make sure you have the correct version:

```bash
npm install tailwindcss@^4.0.0 @tailwindcss/vite
```

### Styles not applying

1. Check your `tailwind.config.ts` includes the newsletter module path:
   ```typescript
   content: [
     "./node_modules/@hue-studios/nuxt-newsletter/dist/**/*.{js,vue,ts}",
   ]
   ```

2. Verify the Vite plugin is added:
   ```typescript
   import tailwindcss from '@tailwindcss/vite'
   
   export default defineNuxtConfig({
     vite: {
       plugins: [tailwindcss()],
     }
   })
   ```

### Build errors

If you see TypeScript errors, make sure your `tailwind.config.ts` has proper typing:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  // config
};

export default config;
```

## Benefits of Tailwind CSS 4

- 🚀 **Faster builds** - Up to 10x faster than v3
- 📦 **Smaller bundle size** - Only includes used styles
- 🎯 **Better IntelliSense** - Improved autocomplete
- 🔧 **Native CSS** - Works with any framework
- ⚡ **Vite integration** - Optimized for modern tooling

---

**Need help?** Check the [verification script output](#verification) or [open an issue](https://github.com/hue-studios/nuxt-newsletter/issues).