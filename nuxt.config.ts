// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    esbuild: {
      options: {
        target: "es2020",
      },
    },
  },
  modules: ["@nuxt/icon", "@nuxt/test-utils"],
  imports: {
    transform: {
      exclude: [/\buseNuxtApp\b/],
    },
  },
});
