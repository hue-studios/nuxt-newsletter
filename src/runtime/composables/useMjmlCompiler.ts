// src/runtime/composables/useMjmlCompiler.ts
import { $fetch } from 'ofetch'
import { readonly, ref } from 'vue'
import { useDirectusNewsletter } from './useDirectusNewsletter'
import type { NewsletterBlock, NewsletterData } from './useNewsletterEditor'

// Declare window.mjml2html for TypeScript
declare global {
  interface Window {
    mjml2html?: (mjml: string, options?: any) => { html: string; errors: any[] }
  }
}

interface BlockType {
  id: string
  name: string
  slug: string
  mjml_template: string
  field_visibility_config: string[]
  category: string
  icon: string
}

export function useMjmlCompiler() {
  const isCompiling = ref(false)
  const compilationError = ref<string | null>(null)

  // Compile Handlebars template with block data
  const compileHandlebars = (template: string, data: any): string => {
    // Basic Handlebars implementation for common patterns
    let compiled = template

    // Replace simple variables {{variable}}
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`{{${key}}}`, 'g')
        compiled = compiled.replace(regex, String(value))
      }
    })

    // Handle {{#if variable}} ... {{/if}}
    compiled = compiled.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
      return data[variable] ? content : ''
    })

    // Handle triple mustache for unescaped HTML {{{variable}}}
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (typeof value === 'string') {
        const regex = new RegExp(`{{{${key}}}}`, 'g')
        compiled = compiled.replace(regex, value)
      }
    })

    return compiled
  }

  // Compile a single block to MJML
  const compileBlockToMjml = async (block: NewsletterBlock, blockType: BlockType): Promise<string> => {
    try {
      // Merge block content with settings
      const blockData = {
        ...block.content,
        ...block.settings,
        // Provide defaults for common fields
        background_color: block.settings?.backgroundColor || '#ffffff',
        text_color: block.settings?.textColor || '#333333',
        text_align: block.settings?.textAlign || 'left',
        padding: block.settings?.padding || '20px 0',
        font_size: block.settings?.fontSize || '16px'
      }

      // Compile the template with block data
      const mjmlBlock = compileHandlebars(blockType.mjml_template, blockData)
      return mjmlBlock
    } catch (error) {
      console.error('Error compiling block to MJML:', error)
      return `<!-- Error compiling block ${block.id} -->`
    }
  }

  // Compile full newsletter to MJML
  const compileNewsletterToMjml = async (
    newsletter: NewsletterData,
    blockTypes: BlockType[]
  ): Promise<string> => {
    isCompiling.value = true
    compilationError.value = null

    try {
      const blockTypesMap = new Map(blockTypes.map(bt => [bt.slug, bt]))
      
      // Compile each block
      const compiledBlocks: string[] = []
      
      for (const block of newsletter.blocks) {
        const blockType = blockTypesMap.get(block.type)
        if (blockType) {
          const mjmlBlock = await compileBlockToMjml(block, blockType)
          compiledBlocks.push(mjmlBlock)
        } else {
          compiledBlocks.push(`<!-- Unknown block type: ${block.type} -->`)
        }
      }

      // Build complete MJML document
      const mjmlDocument = `
<mjml>
  <mj-head>
    <mj-title>${newsletter.subject || 'Newsletter'}</mj-title>
    <mj-preview>${newsletter.preheader || ''}</mj-preview>
    <mj-attributes>
      <mj-all font-family="${newsletter.settings?.fontFamily || 'Arial, sans-serif'}" />
      <mj-text color="${newsletter.settings?.textColor || '#333333'}" />
      <mj-section background-color="${newsletter.settings?.backgroundColor || '#ffffff'}" />
    </mj-attributes>
    <mj-style>
      .link { color: #3b82f6; text-decoration: underline; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f5f5f5">
    <mj-wrapper padding="20px 0">
      ${compiledBlocks.join('\n')}
      
      <!-- Footer -->
      <mj-section padding="20px 0">
        <mj-column>
          <mj-divider border-color="#e5e5e5" />
          <mj-text align="center" font-size="12px" color="#6b7280" padding="20px 0">
            © ${new Date().getFullYear()} Your Company. All rights reserved.<br/>
            <a href="{{unsubscribe_url}}" class="link">Unsubscribe</a> | 
            <a href="{{preferences_url}}" class="link">Update Preferences</a> | 
            <a href="{{view_in_browser_url}}" class="link">View in Browser</a>
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>`

      return mjmlDocument
    } catch (error) {
      compilationError.value = error instanceof Error ? error.message : 'Unknown compilation error'
      throw error
    } finally {
      isCompiling.value = false
    }
  }

  // Compile MJML to HTML (requires server-side processing or MJML browser library)
  const compileMjmlToHtml = async (mjml: string): Promise<{ html: string; errors: any[] }> => {
    try {
      // Option 1: Use MJML browser version (for client-side)
      if (typeof window !== 'undefined' && window.mjml2html) {
        return window.mjml2html(mjml, {
          keepComments: false,
          minify: true,
          validationLevel: 'soft'
        })
      }

      // Option 2: Call server endpoint for compilation
      const response = await $fetch('/api/newsletter/compile-mjml', {
        method: 'POST',
        body: { mjml }
      })

      return response as { html: string; errors: any[] }
    } catch (error) {
      console.error('Error compiling MJML to HTML:', error)
      return {
        html: '<p>Error compiling email template</p>',
        errors: [error]
      }
    }
  }

  // Load block types from Directus
  const loadBlockTypes = async (): Promise<BlockType[]> => {
    try {
      const { fetchBlockTypes } = useDirectusNewsletter()
      return await fetchBlockTypes()
    } catch (error) {
      console.error('Error loading block types:', error)
      return []
    }
  }

  return {
    isCompiling: readonly(isCompiling),
    compilationError: readonly(compilationError),
    compileHandlebars,
    compileBlockToMjml,
    compileNewsletterToMjml,
    compileMjmlToHtml,
    loadBlockTypes
  }
}