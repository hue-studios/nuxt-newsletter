// build.config.ts
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  externals: [
    '@nuxt/kit',
    '@nuxt/schema',
    'nuxt',
    'nuxt/schema',
    'vue',
    'defu',
    'ofetch',
    '@directus/sdk',
    'mjml',
    'mjml-browser'
  ],
  rollup: {
    emitCJS: true
  },
  entries: [
    'src/module',
    'src/types',
    {
      input: 'src/runtime/',
      outDir: 'dist/runtime',
      declaration: true,
      ext: 'mjs'
    },
    {
      input: 'src/types/',
      outDir: 'dist/types',
      declaration: true,
      ext: 'ts'
    }
  ]
})