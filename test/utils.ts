// test/utils.ts
import type { BlockType, NewsletterBlock } from '../src/types'

export const mockBlockTypes: BlockType[] = [
  {
    id: '1',
    name: 'Hero Section',
    slug: 'hero',
    description: 'Large header section',
    category: 'content',
    icon: 'title',
    mjml_template: '<mj-section><mj-column><mj-text>{{title}}</mj-text></mj-column></mj-section>',
    status: 'published',
    field_visibility_config: ['title', 'subtitle', 'button_text', 'button_url']
  },
  {
    id: '2',
    name: 'Text Block',
    slug: 'text',
    description: 'Simple text content',
    category: 'content',
    icon: 'text_fields',
    mjml_template: '<mj-section><mj-column><mj-text>{{{text_content}}}</mj-text></mj-column></mj-section>',
    status: 'published',
    field_visibility_config: ['text_content']
  }
]

export const mockNewsletter = {
  id: 'test-123',
  subject: 'Test Newsletter',
  preheader: 'Test preview',
  blocks: [
    {
      id: 'block-1',
      type: 'hero',
      content: { title: 'Welcome' },
      sort: 0
    }
  ]
}

export const mockSubscriber = {
  id: 'sub-123',
  email: 'test@example.com',
  name: 'Test User',
  status: 'active' as const,
  subscription_source: 'website' as const,
  engagement_score: 50
}

export const mockMailingList = {
  id: 'list-123',
  name: 'Test List',
  description: 'Test mailing list',
  subscriber_count: 100,
  active_count: 95,
  status: 'active' as const
}

export function createMockBlock(overrides?: Partial<NewsletterBlock>): NewsletterBlock {
  return {
    id: `block-${Date.now()}`,
    type: 'text',
    sort: 0,
    content: {},
    ...overrides
  }
}