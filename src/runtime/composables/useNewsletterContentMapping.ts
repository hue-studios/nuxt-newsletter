// composables/useNewsletterContentMapping.ts
import { computed, readonly, ref } from 'vue'

export interface ContentMappingRule {
  mappings: Record<string, string>
  defaults: Record<string, any>
  validators?: Record<string, (value: any) => boolean>
}

export interface ContentMappingConfig {
  [blockType: string]: ContentMappingRule
}

// Default content mapping configuration
const defaultMappingConfig: ContentMappingConfig = {
  'text': {
    mappings: {
      'text': 'text_content',
      'content': 'text_content',
      'body': 'text_content',
      'description': 'text_content'
    },
    defaults: {
      'text_content': '',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'font_size': '16px',
      'padding': '20px',
      'line_height': '1.6'
    },
    validators: {
      'text_content': (value) => typeof value === 'string'
    }
  },
  'button': {
    mappings: {
      'text': 'button_text',
      'label': 'button_text',
      'title': 'button_text',
      'url': 'button_url',
      'link': 'button_url',
      'href': 'button_url'
    },
    defaults: {
      'button_text': 'Click Here',
      'button_url': '#',
      'background_color': '#007bff',
      'text_color': '#ffffff',
      'border_radius': '4px',
      'padding': '12px 24px',
      'text_align': 'center'
    },
    validators: {
      'button_text': (value) => typeof value === 'string' && value.length > 0,
      'button_url': (value) => typeof value === 'string' && value.length > 0
    }
  },
  'hero': {
    mappings: {
      'title': 'hero_title',
      'heading': 'hero_title',
      'subtitle': 'hero_subtitle',
      'subheading': 'hero_subtitle',
      'description': 'hero_content',
      'text': 'hero_content',
      'content': 'hero_content'
    },
    defaults: {
      'hero_title': 'Welcome!',
      'hero_subtitle': 'This is your newsletter',
      'hero_content': '',
      'background_color': '#f8f9fa',
      'text_color': '#333333',
      'title_color': '#2c3e50',
      'text_align': 'center',
      'padding': '40px 20px'
    }
  },
  'image': {
    mappings: {
      'src': 'image_url',
      'url': 'image_url',
      'image': 'image_url',
      'source': 'image_url',
      'alt': 'image_alt',
      'alt_text': 'image_alt',
      'caption': 'image_caption'
    },
    defaults: {
      'image_url': 'https://via.placeholder.com/600x300?text=Newsletter+Image',
      'image_alt': 'Newsletter Image',
      'image_caption': '',
      'width': '100%',
      'padding': '20px'
    },
    validators: {
      'image_url': (value) => typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))
    }
  },
  'event-card': {
    mappings: {
      'title': 'event_title',
      'heading': 'event_title',
      'name': 'event_title',
      'subtitle': 'event_subtitle',
      'subheading': 'event_subtitle',
      'description': 'event_description',
      'text': 'event_description',
      'content': 'event_description',
      'body': 'event_description',
      'date': 'event_date',
      'event_date': 'event_date',
      'time': 'event_time',
      'event_time': 'event_time',
      'location': 'event_location',
      'venue': 'event_location',
      'event_location': 'event_location',
      'place': 'event_location',
      'button_text': 'button_text',
      'cta_text': 'button_text',
      'link_text': 'button_text',
      'button_url': 'button_url',
      'cta_url': 'button_url',
      'link_url': 'button_url',
      'url': 'button_url'
    },
    defaults: {
      'event_title': 'Upcoming Event',
      'event_subtitle': 'Join us for an exciting event',
      'event_description': 'Event description goes here',
      'event_date': 'TBD',
      'event_time': 'TBD',
      'event_location': 'TBD',
      'button_text': 'Register Now',
      'button_url': '#',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'title_color': '#2c3e50',
      'text_align': 'left',
      'padding': '20px'
    },
    validators: {
      'event_title': (value) => typeof value === 'string' && value.length > 0
    }
  },
  'team-member': {
    mappings: {
      'name': 'member_name',
      'member_name': 'member_name',
      'full_name': 'member_name',
      'title': 'member_title',
      'position': 'member_title',
      'role': 'member_title',
      'job_title': 'member_title',
      'member_title': 'member_title',
      'bio': 'member_bio',
      'description': 'member_bio',
      'text': 'member_bio',
      'content': 'member_bio',
      'about': 'member_bio',
      'member_bio': 'member_bio',
      'image': 'member_image',
      'photo': 'member_image',
      'avatar': 'member_image',
      'picture': 'member_image',
      'image_url': 'member_image',
      'member_image': 'member_image',
      'alt': 'image_alt',
      'alt_text': 'image_alt',
      'image_alt': 'image_alt'
    },
    defaults: {
      'member_name': 'Team Member',
      'member_title': 'Position',
      'member_bio': 'Member bio goes here',
      'member_image': 'https://via.placeholder.com/150x150?text=Team+Member',
      'image_alt': 'Team Member Photo',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'title_color': '#2c3e50',
      'text_align': 'left',
      'padding': '20px'
    },
    validators: {
      'member_name': (value) => typeof value === 'string' && value.length > 0
    }
  },
  'social-links': {
    mappings: {
      'facebook': 'facebook_url',
      'facebook_url': 'facebook_url',
      'fb_url': 'facebook_url',
      'twitter': 'twitter_url',
      'twitter_url': 'twitter_url',
      'x_url': 'twitter_url',
      'instagram': 'instagram_url',
      'instagram_url': 'instagram_url',
      'ig_url': 'instagram_url',
      'linkedin': 'linkedin_url',
      'linkedin_url': 'linkedin_url',
      'youtube': 'youtube_url',
      'youtube_url': 'youtube_url',
      'yt_url': 'youtube_url',
      'website': 'website_url',
      'website_url': 'website_url',
      'site_url': 'website_url',
      'tiktok': 'tiktok_url',
      'tiktok_url': 'tiktok_url',
      'discord': 'discord_url',
      'discord_url': 'discord_url'
    },
    defaults: {
      'facebook_url': '',
      'twitter_url': '',
      'instagram_url': '',
      'linkedin_url': '',
      'youtube_url': '',
      'website_url': '',
      'tiktok_url': '',
      'discord_url': '',
      'icon_size': '24px',
      'text_align': 'center',
      'padding': '20px',
      'background_color': '#ffffff'
    }
  },
  'product-showcase': {
    mappings: {
      'title': 'title',
      'heading': 'title',
      'name': 'title',
      'description': 'text_content',
      'text': 'text_content',
      'content': 'text_content',
      'body': 'text_content',
      'image': 'image',
      'image_url': 'image',
      'photo': 'image',
      'picture': 'image',
      'alt': 'image_alt_text',
      'alt_text': 'image_alt_text',
      'image_alt': 'image_alt_text',
      'price': 'price',
      'cost': 'price',
      'amount': 'price',
      'button_text': 'button_text',
      'cta_text': 'button_text',
      'link_text': 'button_text',
      'button_url': 'button_url',
      'cta_url': 'button_url',
      'link_url': 'button_url',
      'url': 'button_url'
    },
    defaults: {
      'title': 'Product Name',
      'text_content': 'Product description goes here',
      'image': 'https://via.placeholder.com/300x200?text=Product+Image',
      'image_alt_text': 'Product Image',
      'price': '$99.99',
      'button_text': 'Learn More',
      'button_url': '#',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'padding': '20px'
    },
    validators: {
      'title': (value) => typeof value === 'string' && value.length > 0
    }
  },
  'cta-section': {
    mappings: {
      'title': 'cta_title',
      'heading': 'cta_title',
      'headline': 'cta_title',
      'subtitle': 'cta_subtitle',
      'subheading': 'cta_subtitle',
      'description': 'cta_description',
      'text': 'cta_description',
      'content': 'cta_description',
      'body': 'cta_description',
      'button_text': 'button_text',
      'cta_text': 'button_text',
      'action_text': 'button_text',
      'link_text': 'button_text',
      'button_url': 'button_url',
      'cta_url': 'button_url',
      'action_url': 'button_url',
      'link_url': 'button_url',
      'url': 'button_url'
    },
    defaults: {
      'cta_title': 'Take Action Now',
      'cta_subtitle': 'Don\'t miss out on this opportunity',
      'cta_description': 'Join thousands of others who have already taken action.',
      'button_text': 'Get Started',
      'button_url': '#',
      'background_color': '#f8f9fa',
      'text_color': '#333333',
      'title_color': '#2c3e50',
      'text_align': 'center',
      'padding': '40px 20px'
    },
    validators: {
      'cta_title': (value) => typeof value === 'string' && value.length > 0,
      'button_text': (value) => typeof value === 'string' && value.length > 0
    }
  },
  'divider': {
    mappings: {
      'color': 'border_color',
      'width': 'border_width',
      'style': 'border_style'
    },
    defaults: {
      'border_color': '#e5e5e5',
      'border_width': '1px',
      'border_style': 'solid',
      'padding': '20px 0'
    }
  },
  'spacer': {
    mappings: {
      'height': 'spacer_height'
    },
    defaults: {
      'spacer_height': '20px'
    }
  }
}

export function useNewsletterContentMapping(customConfig?: Partial<ContentMappingConfig>) {
  const mappingConfig = ref<ContentMappingConfig>({
    ...defaultMappingConfig,
    ...customConfig
  })

  const mappingStats = ref({
    totalMappings: 0,
    successfulMappings: 0,
    failedMappings: 0,
    validationErrors: [] as string[]
  })

  // Update mapping configuration
  const updateMappingConfig = (blockType: string, config: Partial<ContentMappingRule>) => {
    if (!mappingConfig.value[blockType]) {
      mappingConfig.value[blockType] = {
        mappings: {},
        defaults: {}
      }
    }

    mappingConfig.value[blockType] = {
      ...mappingConfig.value[blockType],
      ...config,
      mappings: {
        ...mappingConfig.value[blockType].mappings,
        ...config.mappings
      },
      defaults: {
        ...mappingConfig.value[blockType].defaults,
        ...config.defaults
      }
    }
  }

  // Map content for a specific block
  const mapBlockContent = (block: any, blockType: any): Record<string, any> => {
    const blockSlug = blockType.slug
    const config = mappingConfig.value[blockSlug]
    
    // Reset stats for this mapping
    mappingStats.value.totalMappings = 0
    mappingStats.value.successfulMappings = 0
    mappingStats.value.failedMappings = 0
    mappingStats.value.validationErrors = []

    if (!config) {
      console.warn(`No mapping config found for block type: ${blockSlug}`)
      return { ...block.content }
    }

    const mappedContent: Record<string, any> = {}
    const originalContent = block.content || {}

    // Apply mappings
    Object.entries(originalContent).forEach(([originalKey, value]) => {
      mappingStats.value.totalMappings++
      
      const mappedKey = config.mappings[originalKey] || originalKey
      
      // Validate value if validator exists
      if (config.validators && config.validators[mappedKey]) {
        const isValid = config.validators[mappedKey](value)
        if (!isValid) {
          mappingStats.value.validationErrors.push(
            `Invalid value for ${mappedKey}: ${value}`
          )
          mappingStats.value.failedMappings++
          return
        }
      }
      
      mappedContent[mappedKey] = value
      mappingStats.value.successfulMappings++
      
      if (originalKey !== mappedKey) {
        console.log(`✓ Mapped ${originalKey} → ${mappedKey}: "${value}"`)
      }
    })

    // Apply defaults for missing fields
    Object.entries(config.defaults).forEach(([key, defaultValue]) => {
      if (!(key in mappedContent)) {
        mappedContent[key] = defaultValue
        console.log(`✓ Applied default ${key}: "${defaultValue}"`)
      }
    })

    console.log(`Content mapping complete for ${blockSlug}:`, {
      original: originalContent,
      mapped: mappedContent,
      stats: mappingStats.value
    })

    return mappedContent
  }

  // Validate all content in a newsletter
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
        bt.id === block.block_type
      )

      if (!blockType) {
        errors.push(`Block ${index + 1}: Unknown block type '${block.type}'`)
        return
      }

      const config = mappingConfig.value[blockType.slug]
      if (!config) {
        warnings.push(`Block ${index + 1}: No mapping config for '${blockType.slug}'`)
        return
      }

      // Check required fields (those with validators)
      if (config.validators) {
        Object.entries(config.validators).forEach(([field, validator]) => {
          const mappedContent = mapBlockContent(block, blockType)
          const value = mappedContent[field]
          
          if (!validator(value)) {
            errors.push(`Block ${index + 1}: Invalid ${field} value`)
          }
        })
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
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
          docs += `- \`${field}\`: \`${JSON.stringify(value)}\`\n`
        })
        docs += '\n'
      }
      
      docs += '---\n\n'
    })
    
    return docs
  }

  // Export current configuration as JSON
  const exportConfig = (): string => {
    return JSON.stringify(mappingConfig.value, null, 2)
  }

  // Import configuration from JSON
  const importConfig = (configJson: string): boolean => {
    try {
      const imported = JSON.parse(configJson)
      mappingConfig.value = { ...mappingConfig.value, ...imported }
      return true
    } catch (error) {
      console.error('Failed to import mapping config:', error)
      return false
    }
  }

  // Get available block types from current config
  const availableBlockTypes = computed(() => {
    return Object.keys(mappingConfig.value)
  })

  // Get config for specific block type
  const getConfigForBlockType = (blockType: string) => {
    return mappingConfig.value[blockType] || null
  }

  return {
    // State
    mappingConfig: readonly(mappingConfig),
    mappingStats: readonly(mappingStats),
    availableBlockTypes,
    
    // Methods
    mapBlockContent,
    updateMappingConfig,
    validateNewsletterContent,
    generateMappingDocs,
    exportConfig,
    importConfig,
    getConfigForBlockType
  }
}