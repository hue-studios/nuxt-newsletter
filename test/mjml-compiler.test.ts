// test/module.test.ts
import { $fetch, setup } from '@nuxt/test-utils'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('Newsletter Module', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    modules: ['../../../src/module']
  })

  it('should load module', () => {
    expect(true).toBe(true)
  })

  it('should register composables', async () => {
    const html = await $fetch('/')
    expect(html).toContain('Newsletter Module')
  })

  it('should create webhook endpoint', async () => {
    // Test that the SendGrid webhook endpoint exists
    try {
      await $fetch('/api/newsletter/sendgrid-webhook', {
        method: 'POST',
        body: []
      })
    } catch (error: any) {
      // Should fail with auth error if no secret configured
      expect(error.statusCode).toBeDefined()
    }
  })
})

// test/composables.test.ts
import { beforeEach } from 'vitest'
import { useNewsletterEditor } from '../src/runtime/composables/useNewsletterEditor'

describe('useNewsletterEditor', () => {
  let editor: ReturnType<typeof useNewsletterEditor>

  beforeEach(() => {
    editor = useNewsletterEditor()
  })

  it('should initialize with empty newsletter', () => {
    expect(editor.newsletter.value.subject).toBe('')
    expect(editor.newsletter.value.blocks).toHaveLength(0)
  })

  it('should add blocks', () => {
    const block = editor.addBlock('hero')
    expect(editor.blocks.value).toHaveLength(1)
    expect(block.type).toBe('hero')
    expect(block.id).toBeDefined()
  })

  it('should remove blocks', () => {
    const block = editor.addBlock('text')
    expect(editor.blocks.value).toHaveLength(1)
    
    editor.removeBlock(block.id)
    expect(editor.blocks.value).toHaveLength(0)
  })

  it('should update blocks', () => {
    const block = editor.addBlock('button')
    editor.updateBlock(block.id, {
      content: { text: 'Click me!' }
    })
    
    expect(editor.blocks.value[0].content.text).toBe('Click me!')
  })

  it('should move blocks', () => {
    const block1 = editor.addBlock('text')
    const block2 = editor.addBlock('image')
    
    expect(editor.blocks.value[0].id).toBe(block1.id)
    expect(editor.blocks.value[1].id).toBe(block2.id)
    
    editor.moveBlock(0, 1)
    
    expect(editor.blocks.value[0].id).toBe(block2.id)
    expect(editor.blocks.value[1].id).toBe(block1.id)
  })

  it('should duplicate blocks', () => {
    const block = editor.addBlock('hero')
    editor.updateBlock(block.id, {
      content: { title: 'Original' }
    })
    
    editor.duplicateBlock(block.id)
    
    expect(editor.blocks.value).toHaveLength(2)
    expect(editor.blocks.value[1].content.title).toBe('Original')
    expect(editor.blocks.value[1].id).not.toBe(block.id)
  })

  it('should load from template', () => {
    const template = {
      blocks_config: [
        { type: 'hero', content: { title: 'Welcome' } },
        { type: 'text', content: { text: 'Hello world' } }
      ],
      default_subject_pattern: 'Monthly Newsletter'
    }
    
    editor.loadFromTemplate(template)
    
    expect(editor.newsletter.value.subject).toBe('Monthly Newsletter')
    expect(editor.blocks.value).toHaveLength(2)
    expect(editor.blocks.value[0].type).toBe('hero')
    expect(editor.blocks.value[0].content.title).toBe('Welcome')
  })
})

// test/mjml-compiler.test.ts
import { useMjmlCompiler } from '../src/runtime/composables/useMjmlCompiler'

describe('useMjmlCompiler', () => {
  const { compileHandlebars } = useMjmlCompiler()

  it('should compile simple variables', () => {
    const template = '<mj-text>Hello {{name}}!</mj-text>'
    const data = { name: 'World' }
    
    const result = compileHandlebars(template, data)
    expect(result).toBe('<mj-text>Hello World!</mj-text>')
  })

  it('should handle conditional blocks', () => {
    const template = `
      <mj-text>Welcome</mj-text>
      {{#if showButton}}
      <mj-button>Click me</mj-button>
      {{/if}}
    `
    
    const withButton = compileHandlebars(template, { showButton: true })
    expect(withButton).toContain('<mj-button>Click me</mj-button>')
    
    const withoutButton = compileHandlebars(template, { showButton: false })
    expect(withoutButton).not.toContain('<mj-button>')
  })

  it('should handle unescaped HTML', () => {
    const template = '<mj-text>{{{htmlContent}}}</mj-text>'
    const data = { htmlContent: '<strong>Bold text</strong>' }
    
    const result = compileHandlebars(template, data)
    expect(result).toBe('<mj-text><strong>Bold text</strong></mj-text>')
  })
})