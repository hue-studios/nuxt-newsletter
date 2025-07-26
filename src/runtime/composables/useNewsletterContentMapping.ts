// src/runtime/composables/useNewsletterContentMapping.ts
import { ref } from 'vue'

export interface ContentMappingRule {
  // Direct field mappings (from content field -> to MJML placeholder)
  mappings: Record<string, string>
  // Default values for missing fields
  defaults: Record<string, any>
  // Validators for fields
  validators?: Record<string, (value: any) => boolean>
}

export interface ContentMappingConfig {
  [blockType: string]: ContentMappingRule
}

// Default mapping configuration based on your actual Directus block types
const defaultMappingConfig: ContentMappingConfig = {
  'hero': {
    mappings: {
      // No mappings needed - field names match MJML placeholders
    },
    defaults: {
      'title': 'Welcome to Our Newsletter',
      'subtitle': 'Stay updated with our latest news',
      'button_text': 'Learn More',
      'button_url': '#',
      'background_color': '#f7fafc',
      'text_color': '#333333',
      'text_align': 'center',
      'padding': '40px 20px'
    },
    validators: {
      'button_url': (value) => !value || value.startsWith('http') || value.startsWith('#') || value.startsWith('/')
    }
  },
  'text': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'text_content': '<p>Add your content here...</p>',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'padding': '20px',
      'font_size': '16px'
    }
  },
  'image': {
    mappings: {
      // No mappings needed - fields match
    },
    defaults: {
      'image': 'https://via.placeholder.com/600x400',
      'image_alt_text': 'Image description',
      'image_caption': '',
      'button_url': '',
      'background_color': '#ffffff',
      'text_align': 'center',
      'padding': '20px'
    },
    validators: {
      'image': (value) => !value || value.startsWith('http') || value.startsWith('/'),
      'button_url': (value) => !value || value.startsWith('http') || value.startsWith('#') || value.startsWith('/')
    }
  },
  'button': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'button_text': 'Click Here',
      'button_url': '#',
      'background_color': '#ffffff',
      'text_align': 'center',
      'padding': '20px'
    },
    validators: {
      'button_url': (value) => !value || value.startsWith('http') || value.startsWith('#') || value.startsWith('/')
    }
  },
  'product-showcase': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'title': 'Product Name',
      'text_content': '<p>Product description goes here...</p>',
      'image': 'https://via.placeholder.com/300x300',
      'image_alt_text': 'Product Image',
      'price': '$99.99',
      'button_text': 'Shop Now',
      'button_url': '#',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'padding': '30px 20px'
    }
  },
  'team-member': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'title': 'Team Member Name',
      'subtitle': 'Job Title',
      'text_content': '<p>Bio goes here...</p>',
      'image': 'https://via.placeholder.com/150x150',
      'image_alt_text': 'Team Member Photo',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'padding': '30px 20px'
    }
  },
  'statistics': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'stat1_number': '100+',
      'stat1_label': 'Happy Customers',
      'stat2_number': '50+',
      'stat2_label': 'Products',
      'stat3_number': '10+',
      'stat3_label': 'Years Experience',
      'stat4_number': '24/7',
      'stat4_label': 'Support',
      'background_color': '#f7fafc',
      'text_color': '#333333',
      'padding': '40px 20px'
    }
  },
  'social-links': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'title': 'Follow Us',
      'facebook_url': 'https://facebook.com',
      'twitter_url': 'https://twitter.com',
      'instagram_url': 'https://instagram.com',
      'linkedin_url': 'https://linkedin.com',
      'youtube_url': '',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'center',
      'padding': '20px'
    },
    validators: {
      'facebook_url': (value) => !value || value.startsWith('http'),
      'twitter_url': (value) => !value || value.startsWith('http'),
      'instagram_url': (value) => !value || value.startsWith('http'),
      'linkedin_url': (value) => !value || value.startsWith('http'),
      'youtube_url': (value) => !value || value.startsWith('http')
    }
  },
  'event-card': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'title': 'Upcoming Event',
      'text_content': '<p>Event description goes here...</p>',
      'event_date': 'TBD',
      'event_time': 'TBD',
      'event_location': 'TBD',
      'button_text': 'Register Now',
      'button_url': '#',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'padding': '30px 20px'
    }
  },
  'feature-list': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'title': 'Key Features',
      'feature1': 'Feature one description',
      'feature2': 'Feature two description',
      'feature3': 'Feature three description',
      'feature4': '',
      'feature5': '',
      'feature6': '',
      'button_text': 'Learn More',
      'button_url': '#',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'padding': '30px 20px'
    }
  },
  'testimonial': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'testimonial_text': 'This is an amazing product that has helped our business grow.',
      'testimonial_author': 'John Doe',
      'author_title': 'CEO',
      'author_company': 'Example Corp',
      'author_avatar': 'https://via.placeholder.com/50x50',
      'background_color': '#f7fafc',
      'text_color': '#333333',
      'text_align': 'center',
      'padding': '40px 20px'
    }
  },
  'three-column': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'column1_title': 'Column 1',
      'column1_content': 'Content for column 1',
      'column2_title': 'Column 2',
      'column2_content': 'Content for column 2',
      'column3_title': 'Column 3',
      'column3_content': 'Content for column 3',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'padding': '30px 20px'
    }
  },
  'cta-section': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'cta_title': 'Ready to Get Started?',
      'cta_subtitle': 'Join thousands of satisfied customers today',
      'primary_button_text': 'Start Now',
      'primary_button_url': '#',
      'secondary_button_text': 'Learn More',
      'secondary_button_url': '#',
      'background_color': '#f7fafc',
      'text_color': '#333333',
      'text_align': 'center',
      'padding': '40px 20px'
    }
  },
  'progress-bar': {
    mappings: {
      // No mappings needed
    },
    defaults: {
      'title': 'Progress Update',
      'progress_label': 'Project Completion',
      'progress_percentage': '75',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'padding': '20px'
    },
    validators: {
      'progress_percentage': (value) => {
        const num = parseInt(value)
        return !isNaN(num) && num >= 0 && num <= 100
      }
    }
  }
}

export function useNewsletterContentMapping(customConfig?: Partial<ContentMappingConfig>) {
  const mappingConfig = ref<ContentMappingConfig>({
    ...defaultMappingConfig,
    ...(customConfig || {})
  })

  const mappingStats = ref({
    totalMappings: 0,
    totalDefaults: 0,
    lastMapped: null as string | null
  })

  // Enhanced mapping function that handles both direct values and defaults
  const mapBlockContent = (block: any, blockType: any): Record<string, any> => {
    const blockSlug = blockType?.slug || blockType?.type || 'unknown'
    const originalContent = block?.content || {}
    
    console.log(`🔄 Mapping content for block type: ${blockSlug}`)
    console.log(`📝 Original content:`, originalContent)

    const config = mappingConfig.value[blockSlug]
    if (!config) {
      console.warn(`⚠️ No mapping config for block type: ${blockSlug}`)
      // Return original content with basic defaults
      return {
        ...originalContent,
        background_color: originalContent.background_color || '#ffffff',
        text_color: originalContent.text_color || '#333333',
        text_align: originalContent.text_align || 'left',
        padding: originalContent.padding || '20px'
      }
    }

    const mappedContent: Record<string, any> = {}
    let appliedMappings = 0
    let appliedDefaults = 0

    // First, apply any field mappings
    Object.entries(config.mappings || {}).forEach(([fromKey, toKey]) => {
      if (originalContent[fromKey] !== undefined) {
        mappedContent[toKey] = originalContent[fromKey]
        appliedMappings++
        console.log(`✓ Mapped ${fromKey} → ${toKey}: "${originalContent[fromKey]}"`)
      }
    })

    // Copy all original content fields that aren't mapped
    Object.entries(originalContent).forEach(([key, value]) => {
      if (!(key in mappedContent) && !Object.values(config.mappings || {}).includes(key)) {
        mappedContent[key] = value
      }
    })

    // Apply defaults for missing fields
    Object.entries(config.defaults || {}).forEach(([key, defaultValue]) => {
      if (!(key in mappedContent) || mappedContent[key] === '' || mappedContent[key] === null || mappedContent[key] === undefined) {
        mappedContent[key] = defaultValue
        appliedDefaults++
        console.log(`✓ Applied default ${key}: "${defaultValue}"`)
      }
    })

    // Validate fields if validators are defined
    if (config.validators) {
      Object.entries(config.validators).forEach(([field, validator]) => {
        if (mappedContent[field] !== undefined) {
          const isValid = validator(mappedContent[field])
          if (!isValid) {
            console.warn(`⚠️ Invalid value for ${field}: "${mappedContent[field]}"`)
          }
        }
      })
    }

    // Update stats
    mappingStats.value.totalMappings += appliedMappings
    mappingStats.value.totalDefaults += appliedDefaults
    mappingStats.value.lastMapped = blockSlug

    console.log(`📊 Block ${blockSlug}: ${appliedMappings} mappings, ${appliedDefaults} defaults applied`)
    console.log(`📝 Final mapped content:`, mappedContent)

    return mappedContent
  }

  // Update mapping configuration for a specific block type
  const updateMappingConfig = (blockType: string, config: ContentMappingRule) => {
    mappingConfig.value[blockType] = config
  }

  // Get mapping configuration for a block type
  const getMappingConfig = (blockType: string): ContentMappingRule | undefined => {
    return mappingConfig.value[blockType]
  }

  // Validate content for a specific block
  const validateBlockContent = (block: any, blockType: any): { valid: boolean; errors: string[] } => {
    const blockSlug = blockType?.slug || 'unknown'
    const config = mappingConfig.value[blockSlug]
    const errors: string[] = []

    if (!config || !config.validators) {
      return { valid: true, errors: [] }
    }

    const mappedContent = mapBlockContent(block, blockType)

    Object.entries(config.validators).forEach(([field, validator]) => {
      const value = mappedContent[field]
      if (!validator(value)) {
        errors.push(`Invalid ${field} value: ${value}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validate all blocks in a newsletter
  const validateNewsletterContent = (newsletter: any, blockTypes: any[]): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!newsletter?.blocks) {
      errors.push('Newsletter has no blocks')
      return { valid: false, errors, warnings }
    }

    newsletter.blocks.forEach((block: any, index: number) => {
      const blockType = blockTypes.find(bt => 
        bt.slug === block.type || 
        bt.id === block.block_type ||
        bt.id === block.type ||
        bt.slug === block.block_type
      )

      if (!blockType) {
        errors.push(`Block ${index + 1}: Unknown block type '${block.type}'`)
        return
      }

      const validation = validateBlockContent(block, blockType)
      if (!validation.valid) {
        validation.errors.forEach(error => {
          errors.push(`Block ${index + 1} (${blockType.name}): ${error}`)
        })
      }

      const config = mappingConfig.value[blockType.slug]
      if (!config) {
        warnings.push(`Block ${index + 1} (${blockType.name}): No mapping configuration`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Get all available block types from config
  const getConfiguredBlockTypes = (): string[] => {
    return Object.keys(mappingConfig.value)
  }

  // Reset mapping stats
  const resetStats = () => {
    mappingStats.value = {
      totalMappings: 0,
      totalDefaults: 0,
      lastMapped: null
    }
  }

  // Generate mapping documentation
  const generateMappingDocs = (): string => {
    let docs = '# Newsletter Content Mapping Documentation\n\n'
    
    Object.entries(mappingConfig.value).forEach(([blockType, config]) => {
      docs += `## ${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block\n\n`
      
      if (Object.keys(config.mappings).length > 0) {
        docs += '### Field Mappings\n'
        Object.entries(config.mappings).forEach(([from, to]) => {
          docs += `- \`${from}\` → \`${to}\`\n`
        })
        docs += '\n'
      }
      
      if (Object.keys(config.defaults).length > 0) {
        docs += '### Default Values\n'
        Object.entries(config.defaults).forEach(([field, value]) => {
          docs += `- \`${field}\`: ${JSON.stringify(value)}\n`
        })
        docs += '\n'
      }
      
      if (config.validators && Object.keys(config.validators).length > 0) {
        docs += '### Field Validators\n'
        Object.keys(config.validators).forEach(field => {
          docs += `- \`${field}\`: Custom validation applied\n`
        })
        docs += '\n'
      }
    })
    
    return docs
  }

  return {
    mapBlockContent,
    updateMappingConfig,
    getMappingConfig,
    validateBlockContent,
    validateNewsletterContent,
    getConfiguredBlockTypes,
    mappingStats,
    resetStats,
    generateMappingDocs
  }
}