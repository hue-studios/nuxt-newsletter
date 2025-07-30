// Fixed useMjmlCompiler.ts
import { debounce } from 'lodash';
import { $fetch } from 'ofetch';
import { readonly, ref } from 'vue';
import type { NewsletterBlock, NewsletterData } from '../../types';

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

  // Pre-process MJML template to replace variables with valid defaults
  const preprocessMjmlTemplate = (mjml: string): string => {
    // Define default values for common MJML attributes
    const defaults: Record<string, string> = {
      // Colors
      background_color: '#ffffff',
      text_color: '#000000',
      button_color: '#3182ce',
      link_color: '#3182ce',
      border_color: '#e5e7eb',
      
      // Spacing
      padding: '20px',
      margin: '0px',
      spacing: '10px',
      
      // Alignment
      text_align: 'left',
      align: 'center',
      vertical_align: 'middle',
      
      // Sizes
      font_size: '16px',
      line_height: '1.5',
      width: '100%',
      height: 'auto',
      
      // Typography
      font_family: 'Arial, sans-serif',
      font_weight: 'normal',
      text_decoration: 'none',
      
      // Common content
      title: 'Newsletter Title',
      subtitle: 'Newsletter Subtitle',
      text_content: 'Your content here',
      button_text: 'Click Here',
      button_url: '#',
      image_url: 'https://via.placeholder.com/600x300',
      image_alt_text: 'Image'
    }

    // Replace all {{variable}} patterns with defaults
    let processed = mjml
    
    // First pass: Replace known variables with defaults
    Object.entries(defaults).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      processed = processed.replace(regex, value)
    })
    
    // Second pass: Replace any remaining {{variable}} with safe defaults
    processed = processed.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      console.warn(`Unknown template variable: ${variable}, using default value`)
      
      // Guess appropriate default based on variable name
      if (variable.includes('color')) return '#000000'
      if (variable.includes('url') || variable.includes('link')) return '#'
      if (variable.includes('padding') || variable.includes('margin')) return '0px'
      if (variable.includes('size')) return '16px'
      if (variable.includes('align')) return 'left'
      
      return '' // Empty string as last resort
    })
    
    return processed
  }

  // Compile Handlebars template with block data
  const compileHandlebars = (template: string, data: any): string => {
    let compiled = template

    // Handle triple mustache for unescaped HTML {{{variable}}} FIRST
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (typeof value === 'string') {
        const regex = new RegExp(`\\{\\{\\{${key}\\}\\}\\}`, 'g')
        compiled = compiled.replace(regex, value)
      }
    })

    // Then replace simple variables {{variable}}
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        compiled = compiled.replace(regex, String(value))
      }
    })

    // Handle {{#if variable}} ... {{/if}}
    compiled = compiled.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
      const value = data[variable]
      const shouldShow = value && value !== '' && value !== null && value !== undefined
      return shouldShow ? content : ''
    })

    // Handle {{#unless variable}} ... {{/unless}}
    compiled = compiled.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, variable, content) => {
      const value = data[variable]
      const shouldShow = !value || value === '' || value === null || value === undefined
      return shouldShow ? content : ''
    })

    return compiled
  }

  // Generate MJML from newsletter data
  const generateMjml = (newsletter: NewsletterData, blockTypes: BlockType[]): string => {
    const blocks = newsletter.blocks || []
    
    let mjmlBlocks = ''

    blocks.forEach((block: NewsletterBlock) => {
      const blockType = blockTypes.find(bt => 
        bt.id === block.block_type || bt.slug === block.type
      )
      
      if (!blockType?.mjml_template) {
        console.warn(`No template found for block type: ${block.type}`)
        return
      }

      // Compile the template with the block's content
      const compiledBlock = compileHandlebars(blockType.mjml_template, block.content || {})
      mjmlBlocks += compiledBlock + '\n'
    })

    // If no blocks, add a placeholder
    if (!mjmlBlocks) {
      mjmlBlocks = `
        <mj-section>
          <mj-column>
            <mj-text align="center" color="#999">
              Add blocks to see your newsletter preview
            </mj-text>
          </mj-column>
        </mj-section>
      `
    }

    const mjml = `
      <mjml>
        <mj-head>
          <mj-title>${newsletter.subject || 'Newsletter'}</mj-title>
          <mj-preview>${newsletter.preheader || ''}</mj-preview>
          <mj-attributes>
            <mj-all font-family="Arial, sans-serif" />
            <mj-section background-color="#f4f4f4" padding="20px 0" />
            <mj-wrapper background-color="#ffffff" padding="0" />
            <mj-text font-size="16px" line-height="1.6" color="#333333" />
            <mj-button background-color="#3182ce" color="#ffffff" font-size="16px" inner-padding="12px 24px" />
          </mj-attributes>
        </mj-head>
        <mj-body background-color="#f4f4f4">
          <mj-wrapper>
            ${mjmlBlocks}
          </mj-wrapper>
        </mj-body>
      </mjml>
    `

    return mjml.trim()
  }

  // Compile MJML to HTML
  const compileMjml = async (mjml: string, options: any = {}): Promise<{ html: string; errors: any[] }> => {
    try {
      isCompiling.value = true
      compilationError.value = null

      // Pre-process MJML if it contains template variables
      let processedMjml = mjml
      if (mjml.includes('{{')) {
        console.log('Pre-processing MJML template variables...')
        processedMjml = preprocessMjmlTemplate(mjml)
      }

      // Try server-side compilation first
      try {
        const response = await $fetch('/api/newsletter/compile-mjml', {
          method: 'POST',
          body: { 
            mjml: processedMjml,
            validationLevel: 'soft', // Use soft validation to allow more flexibility
            ...options
          }
        })

        if (response.html) {
          return {
            html: response.html,
            errors: response.errors || []
          }
        }
      } catch (error) {
        console.warn('Server-side MJML compilation failed, trying client-side:', error)
      }

      // Try client-side compilation
      if (typeof window !== 'undefined' && window.mjml2html) {
        const result = window.mjml2html(processedMjml, {
          validationLevel: 'soft',
          ...options
        })
        
        return {
          html: result.html,
          errors: result.errors || []
        }
      }

      throw new Error('No MJML compiler available')
    } catch (error) {
      compilationError.value = error instanceof Error ? error.message : 'Unknown compilation error'
      throw error
    } finally {
      isCompiling.value = false
    }
  }

  // Debounced compilation
  const debouncedCompileMjml = debounce(compileMjml, 500)

  // Compile newsletter to HTML
  const compileNewsletter = async (
    newsletter: NewsletterData, 
    blockTypes: BlockType[]
  ): Promise<{ html: string; mjml: string; errors: any[] }> => {
    const mjml = generateMjml(newsletter, blockTypes)
    const { html, errors } = await compileMjml(mjml)
    
    return { html, mjml, errors }
  }

  return {
    isCompiling: readonly(isCompiling),
    compilationError: readonly(compilationError),
    generateMjml,
    compileMjml,
    debouncedCompileMjml,
    compileNewsletter,
    compileHandlebars,
    preprocessMjmlTemplate
  }
}