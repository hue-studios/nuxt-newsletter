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

// Comprehensive content mapping configuration including all block types
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
      'hero_subtitle': 'Your journey starts here',
      'hero_content': 'Discover amazing things with us.',
      'background_color': '#f8f9fa',
      'text_color': '#333333',
      'title_color': '#2c3e50',
      'text_align': 'center',
      'padding': '40px 20px'
    },
    validators: {
      'hero_title': (value) => typeof value === 'string' && value.length > 0
    }
  },
  // NEW: Statistics block mapping
  'statistics': {
    mappings: {
      'stat_1_number': 'stat1_number',
      'stat_1_label': 'stat1_label',
      'stat_2_number': 'stat2_number',
      'stat_2_label': 'stat2_label',
      'stat_3_number': 'stat3_number',
      'stat_3_label': 'stat3_label',
      'stat_4_number': 'stat4_number',
      'stat_4_label': 'stat4_label'
    },
    defaults: {
      'stat1_number': '100+',
      'stat1_label': 'Customers',
      'stat2_number': '50+',
      'stat2_label': 'Projects',
      'stat3_number': '99%',
      'stat3_label': 'Satisfaction',
      'stat4_number': '24/7',
      'stat4_label': 'Support',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'padding': '30px 20px'
    }
  },
  // NEW: Product showcase mapping
  'product-showcase': {
    mappings: {
      'name': 'title',
      'product_name': 'title',
      'description': 'text_content',
      'product_description': 'text_content',
      'image_url': 'image',
      'product_image': 'image',
      'alt_text': 'image_alt_text',
      'cost': 'price',
      'amount': 'price',
      'cta_text': 'button_text',
      'link_text': 'button_text',
      'cta_url': 'button_url',
      'link_url': 'button_url'
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
  // NEW: Feature list mapping
  'feature-list': {
    mappings: {
      'heading': 'title',
      'item1': 'feature1',
      'item2': 'feature2',
      'item3': 'feature3',
      'item4': 'feature4',
      'item5': 'feature5',
      'item6': 'feature6',
      'cta_text': 'button_text',
      'cta_url': 'button_url'
    },
    defaults: {
      'title': 'Key Features',
      'feature1': 'Easy to use interface',
      'feature2': 'Fast performance',
      'feature3': '24/7 customer support',
      'feature4': 'Secure and reliable',
      'feature5': 'Mobile responsive',
      'feature6': 'Regular updates',
      'button_text': 'Get Started',
      'button_url': '#',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'left',
      'padding': '30px 20px'
    }
  },
  // NEW: Testimonial mapping
  'testimonial': {
    mappings: {
      'quote': 'testimonial_text',
      'text': 'testimonial_text',
      'content': 'testimonial_text',
      'author': 'testimonial_author',
      'name': 'testimonial_author',
      'title': 'author_title',
      'job_title': 'author_title',
      'company': 'author_company',
      'avatar': 'author_avatar',
      'image': 'author_avatar'
    },
    defaults: {
      'testimonial_text': 'This product has completely transformed how we work. Highly recommended!',
      'testimonial_author': 'John Doe',
      'author_title': 'CEO',
      'author_company': 'Tech Corp',
      'author_avatar': 'https://via.placeholder.com/80x80?text=JD',
      'background_color': '#f8f9fa',
      'text_color': '#333333',
      'text_align': 'center',
      'padding': '40px 20px'
    },
    validators: {
      'testimonial_text': (value) => typeof value === 'string' && value.length > 0,
      'testimonial_author': (value) => typeof value === 'string' && value.length > 0
    }
  },
  // NEW: Three column mapping
  'three-column': {
    mappings: {
      'col1_title': 'column1_title',
      'col1_content': 'column1_content',
      'col2_title': 'column2_title',
      'col2_content': 'column2_content',
      'col3_title': 'column3_title',
      'col3_content': 'column3_content'
    },
    defaults: {
      'column1_title': 'Column 1',
      'column1_content': 'Content for the first column goes here.',
      'column2_title': 'Column 2',
      'column2_content': 'Content for the second column goes here.',
      'column3_title': 'Column 3',
      'column3_content': 'Content for the third column goes here.',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'text_align': 'center',
      'padding': '30px 20px'
    }
  },
  // NEW: CTA section mapping
  'cta-section': {
    mappings: {
      'heading': 'cta_title',
      'subheading': 'cta_subtitle',
      'description': 'cta_description',
      'primary_text': 'button_text',
      'primary_url': 'button_url',
      'secondary_text': 'secondary_button_text',
      'secondary_url': 'secondary_button_url'
    },
    defaults: {
      'cta_title': 'Take Action Now',
      'cta_subtitle': 'Don\'t miss out on this opportunity',
      'cta_description': 'Join thousands of others who have already taken action.',
      'button_text': 'Get Started',
      'button_url': '#',
      'secondary_button_text': 'Learn More',
      'secondary_button_url': '#',
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
  // Other existing mappings...
  'image': {
    mappings: {
      'src': 'image_url',
      'url': 'image_url',
      'alt': 'image_alt_text',
      'caption': 'image_caption'
    },
    defaults: {
      'image_url': 'https://via.placeholder.com/600x300',
      'image_alt_text': 'Image',
      'image_caption': '',
      'text_align': 'center',
      'padding': '20px'
    },
    validators: {
      'image_url': (value) => typeof value === 'string' && value.length > 0
    }
  },
  'social-links': {
    mappings: {
      'heading': 'title',
      'facebook': 'facebook_url',
      'twitter': 'twitter_url',
      'linkedin': 'linkedin_url',
      'instagram': 'instagram_url',
      'youtube': 'youtube_url'
    },
    defaults: {
      'title': 'Follow Us on Social Media',
      'facebook_url': '',
      'twitter_url': '',
      'linkedin_url': '',
      'instagram_url': '',
      'youtube_url': '',
      'background_color': '#f8f9fa',
      'text_color': '#333333',
      'text_align': 'center',
      'padding': '30px 20px'
    }
  },
  'team-member': {
    mappings: {
      'name': 'member_title',
      'position': 'subtitle',
      'bio': 'text_content',
      'photo': 'member_image',
      'image': 'member_image'
    },
    defaults: {
      'member_title': 'Team Member',
      'subtitle': 'Position',
      'text_content': 'Team member bio goes here.',
      'member_image': 'https://via.placeholder.com/150x150?text=Photo',
      'image_alt_text': 'Team Member Photo',
      'background_color': '#ffffff',
      'text_color': '#333333',
      'padding': '30px 20px'
    }
  },
  'event-card': {
    mappings: {
      'name': 'event_title',
      'description': 'text_content',
      'date': 'event_date',
      'time': 'event_time',
      'location': 'event_location',
      'cta_text': 'button_text',
      'cta_url': 'button_url'
    },
    defaults: {
      'event_title': 'Upcoming Event',
      'text_content': 'Event description goes here.',
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
    ...(customConfig || {})
  })

  const mappingStats = ref({
    totalMappings: 0,
    totalDefaults: 0,
    lastMapped: null as string | null
  })

  // Enhanced mapping function with better error handling
  const mapBlockContent = (block: any, blockType: any): Record<string, any> => {
    const blockSlug = blockType?.slug || blockType?.type || 'unknown'
    const originalContent = block?.content || {}
    
    console.log(`🔄 Mapping content for block type: ${blockSlug}`)
    console.log(`📝 Original content:`, originalContent)

    const config = mappingConfig.value[blockSlug]
    if (!config) {
      console.warn(`⚠️ No mapping config for block type: ${blockSlug}`)
      return {
        ...originalContent,
        // Add basic defaults for unknown block types
        background_color: '#ffffff',
        text_color: '#333333',
        text_align: 'left',
        padding: '20px'
      }
    }

    const mappedContent: Record<string, any> = {}
    let replacements = 0

    // Apply mappings
    Object.entries(config.mappings || {}).forEach(([fromKey, toKey]) => {
      if (originalContent[fromKey] !== undefined) {
        mappedContent[toKey] = originalContent[fromKey]
        replacements++
        console.log(`✓ Mapped ${fromKey} → ${toKey}: "${originalContent[fromKey]}"`)
      }
    })

    // Copy unmapped properties directly
    Object.entries(originalContent).forEach(([key, value]) => {
      if (!(key in mappedContent) && !Object.values(config.mappings || {}).includes(key)) {
        mappedContent[key] = value
      }
    })

    // Apply defaults for missing fields
    Object.entries(config.defaults || {}).forEach(([key, defaultValue]) => {
      if (!(key in mappedContent)) {
        mappedContent[key] = defaultValue
        console.log(`✓ Applied default ${key}: "${defaultValue}"`)
      }
    })

    // Update stats
    mappingStats.value.totalMappings += replacements
    mappingStats.value.lastMapped = blockSlug

    console.log(`📊 Block ${blockSlug}: ${replacements} replacements made`)
    console.log(`📝 Mapped content:`, mappedContent)

    return mappedContent
  }

  // Update mapping configuration
  const updateMappingConfig = (blockType: string, config: ContentMappingRule) => {
    mappingConfig.value[blockType] = config
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