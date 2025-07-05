// scripts/install-directus-collections.js
#!/usr/bin/env node

/**
 * Automated Directus Collections Installer for Newsletter System
 * This script sets up all required collections, fields, and relationships
 */

import { createDirectus, rest, authentication, createCollection, createField, createRelation, createItems } from '@directus/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

class DirectusNewsletterInstaller {
  constructor(directusUrl, email, password) {
    this.directus = createDirectus(directusUrl).with(rest()).with(authentication())
    this.email = email
    this.password = password
    this.existingCollections = new Set()
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating with Directus...')
      await this.directus.login(this.email, this.password)
      console.log('✅ Authentication successful')
      return true
    } catch (error) {
      console.error('❌ Authentication failed:', error.message)
      return false
    }
  }

  async checkExistingCollections() {
    try {
      const collections = await this.directus.request(readCollections())
      this.existingCollections = new Set(collections.map(c => c.collection))
      console.log(`📋 Found ${collections.length} existing collections`)
    } catch (error) {
      console.error('Failed to fetch existing collections:', error.message)
    }
  }

  async createCollectionSafely(collectionConfig) {
    const { collection } = collectionConfig
    
    if (this.existingCollections.has(collection)) {
      console.log(`⏭️  Skipping ${collection} - already exists`)
      return true
    }

    try {
      console.log(`📝 Creating ${collection} collection...`)
      await this.directus.request(createCollection(collectionConfig))
      console.log(`✅ ${collection} collection created`)
      await this.delay(1000)
      return true
    } catch (error) {
      if (error.message?.includes('already exists')) {
        console.log(`⏭️  ${collection} collection already exists`)
        return true
      }
      console.error(`❌ Failed to create ${collection}:`, error.message)
      return false
    }
  }

  async createFieldSafely(collection, fieldConfig) {
    try {
      await this.directus.request(createField(collection, fieldConfig))
      console.log(`✅ Added field: ${collection}.${fieldConfig.field}`)
      await this.delay(500)
      return true
    } catch (error) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`⏭️  Field ${fieldConfig.field} already exists`)
        return true
      }
      console.error(`❌ Failed to create field ${fieldConfig.field}:`, error.message)
      return false
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async installCollections() {
    console.log('\n📦 Installing newsletter collections...')

    // Define collections
    const collections = [
      {
        collection: 'newsletter_templates',
        meta: {
          accountability: 'all',
          collection: 'newsletter_templates',
          hidden: false,
          icon: 'article',
          note: 'Reusable newsletter templates',
          display_template: '{{name}} ({{category}})',
          sort: 1
        },
        schema: { name: 'newsletter_templates' }
      },
      {
        collection: 'content_library',
        meta: {
          accountability: 'all',
          collection: 'content_library',
          hidden: false,
          icon: 'inventory_2',
          note: 'Reusable content blocks and snippets',
          display_template: '{{title}} ({{content_type}})',
          sort: 2
        },
        schema: { name: 'content_library' }
      },
      {
        collection: 'subscribers',
        meta: {
          accountability: 'all',
          collection: 'subscribers',
          hidden: false,
          icon: 'person',
          note: 'Newsletter subscribers',
          display_template: '{{name}} ({{email}}) - {{status}}',
          sort: 3
        },
        schema: { name: 'subscribers' }
      },
      {
        collection: 'mailing_lists',
        meta: {
          accountability: 'all',
          collection: 'mailing_lists',
          hidden: false,
          icon: 'group',
          note: 'Subscriber mailing lists',
          display_template: '{{name}} ({{subscriber_count}} subscribers)',
          sort: 4
        },
        schema: { name: 'mailing_lists' }
      },
      {
        collection: 'mailing_lists_subscribers',
        meta: {
          accountability: 'all',
          collection: 'mailing_lists_subscribers',
          hidden: true,
          icon: 'link',
          note: 'Junction table for mailing lists and subscribers'
        },
        schema: { name: 'mailing_lists_subscribers' }
      },
      {
        collection: 'newsletters',
        meta: {
          accountability: 'all',
          collection: 'newsletters',
          hidden: false,
          icon: 'mail',
          note: 'Email newsletters',
          display_template: '{{title}} - {{status}} ({{category}})',
          sort: 5
        },
        schema: { name: 'newsletters' }
      },
      {
        collection: 'newsletter_blocks',
        meta: {
          accountability: 'all',
          collection: 'newsletter_blocks',
          hidden: false,
          icon: 'view_module',
          note: 'Newsletter content blocks',
          display_template: '{{block_type.name}} (#{{sort}})',
          sort: 6
        },
        schema: { name: 'newsletter_blocks' }
      },
      {
        collection: 'block_types',
        meta: {
          accountability: 'all',
          collection: 'block_types',
          hidden: false,
          icon: 'extension',
          note: 'Available MJML block types',
          display_template: '{{name}}',
          sort: 7
        },
        schema: { name: 'block_types' }
      },
      {
        collection: 'newsletter_sends',
        meta: {
          accountability: 'all',
          collection: 'newsletter_sends',
          hidden: false,
          icon: 'send',
          note: 'Newsletter send history and analytics',
          display_template: '{{newsletter.title}} to {{mailing_list.name}} - {{status}}',
          sort: 8
        },
        schema: { name: 'newsletter_sends' }
      }
    ]

    // Create collections
    for (const collection of collections) {
      await this.createCollectionSafely(collection)
    }

    console.log('✅ Collections created successfully')
  }

  async installFields() {
    console.log('\n🔧 Installing fields...')

    // Newsletter Templates fields
    const templateFields = [
      { field: 'name', type: 'string', meta: { interface: 'input', required: true, width: 'half' }},
      { field: 'description', type: 'text', meta: { interface: 'input-multiline', width: 'half' }},
      { field: 'category', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [
        { text: 'Company News', value: 'company' },
        { text: 'Product Updates', value: 'product' },
        { text: 'Weekly Digest', value: 'weekly' }
      ]}}},
      { field: 'thumbnail_url', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'blocks_config', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }}},
      { field: 'default_subject_pattern', type: 'string', meta: { interface: 'input' }},
      { field: 'default_from_name', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'default_from_email', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'Published', value: 'published' },
        { text: 'Draft', value: 'draft' }
      ]}, default_value: 'published' }},
      { field: 'usage_count', type: 'integer', meta: { interface: 'input', readonly: true }, schema: { default_value: 0 }},
      { field: 'tags', type: 'csv', meta: { interface: 'tags' }}
    ]

    for (const field of templateFields) {
      await this.createFieldSafely('newsletter_templates', field)
    }

    // Block Types fields
    const blockTypeFields = [
      { field: 'name', type: 'string', meta: { interface: 'input', required: true, width: 'half' }},
      { field: 'slug', type: 'string', meta: { interface: 'input', required: true, width: 'half' }},
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' }},
      { field: 'mjml_template', type: 'text', meta: { interface: 'input-code', options: { language: 'xml' }}},
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'Published', value: 'published' },
        { text: 'Draft', value: 'draft' }
      ]}, default_value: 'published' }},
      { field: 'field_visibility_config', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }}},
      { field: 'icon', type: 'string', meta: { interface: 'select-icon', width: 'half' }},
      { field: 'category', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [
        { text: 'Content', value: 'content' },
        { text: 'Layout', value: 'layout' },
        { text: 'Media', value: 'media' },
        { text: 'Interactive', value: 'interactive' }
      ]}, default_value: 'content' }}
    ]

    for (const field of blockTypeFields) {
      await this.createFieldSafely('block_types', field)
    }

    // Newsletter fields
    const newsletterFields = [
      { field: 'title', type: 'string', meta: { interface: 'input', required: true, width: 'half' }},
      { field: 'slug', type: 'string', meta: { interface: 'input', required: true, width: 'half' }},
      { field: 'subject_line', type: 'string', meta: { interface: 'input', required: true, width: 'half' }},
      { field: 'preview_text', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'from_name', type: 'string', meta: { interface: 'input', width: 'third' }},
      { field: 'from_email', type: 'string', meta: { interface: 'input', width: 'third' }},
      { field: 'reply_to', type: 'string', meta: { interface: 'input', width: 'third' }},
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'Draft', value: 'draft' },
        { text: 'Ready', value: 'ready' },
        { text: 'Scheduled', value: 'scheduled' },
        { text: 'Sent', value: 'sent' }
      ]}, default_value: 'draft' }},
      { field: 'category', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [
        { text: 'Company', value: 'company' },
        { text: 'Product', value: 'product' },
        { text: 'Weekly', value: 'weekly' }
      ]}, default_value: 'company' }},
      { field: 'tags', type: 'csv', meta: { interface: 'tags', width: 'half' }},
      { field: 'blocks', type: 'alias', meta: { interface: 'list-o2m', special: ['o2m'], options: { template: '{{block_type.name}} (#{{sort}})' }}},
      { field: 'compiled_mjml', type: 'text', meta: { interface: 'input-code', options: { language: 'xml' }, readonly: true }},
      { field: 'compiled_html', type: 'text', meta: { interface: 'input-code', options: { language: 'htmlmixed' }, readonly: true }}
    ]

    for (const field of newsletterFields) {
      await this.createFieldSafely('newsletters', field)
    }

    // Newsletter Blocks fields
    const blockFields = [
      { field: 'newsletter_id', type: 'integer', meta: { interface: 'select-dropdown-m2o', hidden: true }},
      { field: 'block_type', type: 'integer', meta: { interface: 'select-dropdown-m2o', required: true, width: 'half' }},
      { field: 'sort', type: 'integer', meta: { interface: 'input', width: 'half' }, schema: { default_value: 1 }},
      { field: 'title', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'subtitle', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'text_content', type: 'text', meta: { interface: 'input-rich-text-html' }},
      { field: 'image_url', type: 'string', meta: { interface: 'input', width: 'full' }},
      { field: 'image_alt_text', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'button_text', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'button_url', type: 'string', meta: { interface: 'input', width: 'half' }},
      { field: 'background_color', type: 'string', meta: { interface: 'select-color', width: 'third' }, schema: { default_value: '#ffffff' }},
      { field: 'text_color', type: 'string', meta: { interface: 'select-color', width: 'third' }, schema: { default_value: '#333333' }},
      { field: 'text_align', type: 'string', meta: { interface: 'select-dropdown', width: 'third', options: { choices: [
        { text: 'Left', value: 'left' },
        { text: 'Center', value: 'center' },
        { text: 'Right', value: 'right' }
      ]}, default_value: 'center' }},
      { field: 'padding', type: 'string', meta: { interface: 'input', width: 'half' }, schema: { default_value: '20px 0' }},
      { field: 'font_size', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [
        { text: 'Small (12px)', value: '12px' },
        { text: 'Normal (14px)', value: '14px' },
        { text: 'Large (16px)', value: '16px' }
      ]}, default_value: '14px' }}
    ]

    for (const field of blockFields) {
      await this.createFieldSafely('newsletter_blocks', field)
    }

    console.log('✅ Fields created successfully')
  }

  async installRelations() {
    console.log('\n🔗 Installing relationships...')

    const relations = [
      // Newsletter → Blocks (O2M)
      {
        collection: 'newsletter_blocks',
        field: 'newsletter_id',
        related_collection: 'newsletters',
        meta: {
          many_collection: 'newsletter_blocks',
          many_field: 'newsletter_id',
          one_collection: 'newsletters',
          one_field: 'blocks',
          sort_field: 'sort',
          one_deselect_action: 'delete'
        }
      },
      // Newsletter Blocks → Block Types (M2O)
      {
        collection: 'newsletter_blocks',
        field: 'block_type',
        related_collection: 'block_types',
        meta: {
          many_collection: 'newsletter_blocks',
          many_field: 'block_type',
          one_collection: 'block_types',
          one_deselect_action: 'nullify'
        }
      }
    ]

    for (const relation of relations) {
      try {
        await this.directus.request(createRelation(relation))
        console.log(`✅ Created relation: ${relation.collection}.${relation.field} → ${relation.related_collection}`)
        await this.delay(1000)
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  Relation already exists: ${relation.collection}.${relation.field}`)
        } else {
          console.error(`❌ Failed to create relation: ${error.message}`)
        }
      }
    }

    console.log('✅ Relationships created successfully')
  }

  async installSampleData() {
    console.log('\n🧩 Installing sample data...')

    // Sample block types
    const blockTypes = [
      {
        name: "Hero Section",
        slug: "hero",
        description: "Large header section with title, subtitle, and optional button",
        category: "content",
        icon: "title",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-text align="{{text_align}}" font-size="32px" font-weight="bold" color="{{text_color}}">
      {{title}}
    </mj-text>
    {{#if subtitle}}
    <mj-text align="{{text_align}}" font-size="18px" color="{{text_color}}" padding="10px 0">
      {{subtitle}}
    </mj-text>
    {{/if}}
    {{#if button_text}}
    <mj-button background-color="#007bff" color="#ffffff" href="{{button_url}}" padding="20px 0">
      {{button_text}}
    </mj-button>
    {{/if}}
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: ["title", "subtitle", "button_text", "button_url", "background_color", "text_color", "text_align", "padding"]
      },
      {
        name: "Text Block",
        slug: "text",
        description: "Simple text content with formatting options",
        category: "content",
        icon: "text_fields",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-text align="{{text_align}}" font-size="{{font_size}}" color="{{text_color}}">
      {{{text_content}}}
    </mj-text>
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: ["text_content", "background_color", "text_color", "text_align", "padding", "font_size"]
      },
      {
        name: "Image Block",
        slug: "image",
        description: "Image with optional caption and link",
        category: "media",
        icon: "image",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    {{#if button_url}}
    <mj-image src="{{image_url}}" alt="{{image_alt_text}}" align="{{text_align}}" href="{{button_url}}" />
    {{else}}
    <mj-image src="{{image_url}}" alt="{{image_alt_text}}" align="{{text_align}}" />
    {{/if}}
    {{#if image_caption}}
    <mj-text align="{{text_align}}" font-size="12px" color="#666666" padding="10px 0 0 0">
      {{image_caption}}
    </mj-text>
    {{/if}}
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: ["image_url", "image_alt_text", "image_caption", "button_url", "background_color", "text_align", "padding"]
      },
      {
        name: "Button",
        slug: "button",
        description: "Call-to-action button",
        category: "interactive",
        icon: "smart_button",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-button background-color="#007bff" color="#ffffff" href="{{button_url}}" align="{{text_align}}">
      {{button_text}}
    </mj-button>
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: ["button_text", "button_url", "background_color", "text_align", "padding"]
      }
    ]

    for (const blockType of blockTypes) {
      try {
        await this.directus.request(createItems('block_types', blockType))
        console.log(`✅ Created block type: ${blockType.name}`)
        await this.delay(300)
      } catch (error) {
        console.log(`⚠️  Could not create block type ${blockType.name}: ${error.message}`)
      }
    }

    console.log('✅ Sample data installed successfully')
  }

  async run() {
    console.log('🚀 Starting Newsletter System Installation\n')

    if (!(await this.authenticate())) {
      return false
    }

    try {
      await this.checkExistingCollections()
      await this.installCollections()
      await this.installFields()
      await this.installRelations()
      await this.installSampleData()

      console.log('\n🎉 Newsletter system installation completed successfully!')
      console.log('\n📋 What was installed:')
      console.log('    • 9 Collections for newsletter management')
      console.log('    • All required fields and relationships')
      console.log('    • 4 Basic block types (Hero, Text, Image, Button)')
      console.log('    • Proper O2M relationship for newsletter blocks')
      
      console.log('\n📋 Next steps:')
      console.log('1. Install the Nuxt module in your project')
      console.log('2. Configure your environment variables')
      console.log('3. Start creating newsletters!')
      
      return true
    } catch (error) {
      console.error('\n❌ Installation failed:', error.message)
      return false
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.log('Newsletter System Installer')
    console.log('')
    console.log('Usage: node install-directus-collections.js <directus-url> <email> <password>')
    console.log('')
    console.log('Examples:')
    console.log('  node install-directus-collections.js https://admin.example.com admin@example.com password123')
    process.exit(1)
  }

  const [directusUrl, email, password] = args
  
  const installer = new DirectusNewsletterInstaller(directusUrl, email, password)
  
  const success = await installer.run()
  process.exit(success ? 0 : 1)
}

main().catch(console.error)

// package.json scripts section
{
  "scripts": {
    "install-collections": "node scripts/install-directus-collections.js"
  }
}


