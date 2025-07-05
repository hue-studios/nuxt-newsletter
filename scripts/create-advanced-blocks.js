// scripts/create-advanced-blocks.js
#!/usr/bin/env node

/**
 * Advanced Block Types Creator
 * Creates more sophisticated MJML block types
 */

import { createDirectus, rest, authentication, createItems } from '@directus/sdk'

const advancedBlockTypes = [
  {
    name: "Product Showcase",
    slug: "product-showcase",
    description: "Product display with image, title, price, and CTA",
    category: "content",
    icon: "storefront",
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column width="40%">
    <mj-image src="{{image_url}}" alt="{{image_alt_text}}" />
  </mj-column>
  <mj-column width="60%">
    <mj-text font-size="24px" font-weight="bold" color="{{text_color}}">
      {{title}}
    </mj-text>
    <mj-text font-size="16px" color="{{text_color}}">
      {{{text_content}}}
    </mj-text>
    {{#if price}}
    <mj-text font-size="20px" font-weight="bold" color="#e53e3e">
      {{price}}
    </mj-text>
    {{/if}}
    <mj-button background-color="#007bff" href="{{button_url}}">
      {{button_text}}
    </mj-button>
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: ["title", "text_content", "image_url", "image_alt_text", "price", "button_text", "button_url", "background_color", "text_color", "padding"]
  },
  {
    name: "Team Member",
    slug: "team-member",
    description: "Team member profile with photo and bio",
    category: "content",
    icon: "person",
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column width="30%">
    <mj-image src="{{image_url}}" alt="{{image_alt_text}}" border-radius="50%" width="120px" />
  </mj-column>
  <mj-column width="70%">
    <mj-text font-size="20px" font-weight="bold" color="{{text_color}}">
      {{title}}
    </mj-text>
    {{#if subtitle}}
    <mj-text font-size="14px" color="#666666" font-style="italic">
      {{subtitle}}
    </mj-text>
    {{/if}}
    <mj-text font-size="14px" color="{{text_color}}">
      {{{text_content}}}
    </mj-text>
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: ["title", "subtitle", "text_content", "image_url", "image_alt_text", "background_color", "text_color", "padding"]
  },
  {
    name: "Statistics Block",
    slug: "statistics",
    description: "Display key statistics with numbers and labels",
    category: "content",
    icon: "bar_chart",
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column width="25%">
    <mj-text align="center" font-size="36px" font-weight="bold" color="#007bff">
      {{stat1_number}}
    </mj-text>
    <mj-text align="center" font-size="14px" color="{{text_color}}">
      {{stat1_label}}
    </mj-text>
  </mj-column>
  <mj-column width="25%">
    <mj-text align="center" font-size="36px" font-weight="bold" color="#28a745">
      {{stat2_number}}
    </mj-text>
    <mj-text align="center" font-size="14px" color="{{text_color}}">
      {{stat2_label}}
    </mj-text>
  </mj-column>
  <mj-column width="25%">
    <mj-text align="center" font-size="36px" font-weight="bold" color="#ffc107">
      {{stat3_number}}
    </mj-text>
    <mj-text align="center" font-size="14px" color="{{text_color}}">
      {{stat3_label}}
    </mj-text>
  </mj-column>
  <mj-column width="25%">
    <mj-text align="center" font-size="36px" font-weight="bold" color="#dc3545">
      {{stat4_number}}
    </mj-text>
    <mj-text align="center" font-size="14px" color="{{text_color}}">
      {{stat4_label}}
    </mj-text>
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: ["stat1_number", "stat1_label", "stat2_number", "stat2_label", "stat3_number", "stat3_label", "stat4_number", "stat4_label", "background_color", "text_color", "padding"]
  },
  {
    name: "Social Media Links",
    slug: "social-links",
    description: "Social media icons with links",
    category: "interactive",
    icon: "share",
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-text align="{{text_align}}" font-size="16px" color="{{text_color}}" padding-bottom="20px">
      {{title}}
    </mj-text>
    <mj-social font-size="15px" icon-size="30px" mode="horizontal" align="{{text_align}}">
      {{#if facebook_url}}
      <mj-social-element name="facebook" href="{{facebook_url}}" />
      {{/if}}
      {{#if twitter_url}}
      <mj-social-element name="twitter" href="{{twitter_url}}" />
      {{/if}}
      {{#if instagram_url}}
      <mj-social-element name="instagram" href="{{instagram_url}}" />
      {{/if}}
      {{#if linkedin_url}}
      <mj-social-element name="linkedin" href="{{linkedin_url}}" />
      {{/if}}
    </mj-social>
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: ["title", "facebook_url", "twitter_url", "instagram_url", "linkedin_url", "background_color", "text_color", "text_align", "padding"]
  },
  {
    name: "Event Card",
    slug: "event-card",
    description: "Event announcement with date, time, and location",
    category: "content",
    icon: "event",
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}" border="2px solid #e2e8f0" border-radius="8px">
  <mj-column>
    <mj-text font-size="24px" font-weight="bold" color="{{text_color}}" align="{{text_align}}">
      {{title}}
    </mj-text>
    <mj-text font-size="16px" color="{{text_color}}" align="{{text_align}}">
      {{{text_content}}}
    </mj-text>
    <mj-table>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding: 10px 0; font-weight: bold;">📅 Date:</td>
        <td style="padding: 10px 0;">{{event_date}}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding: 10px 0; font-weight: bold;">🕐 Time:</td>
        <td style="padding: 10px 0;">{{event_time}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold;">📍 Location:</td>
        <td style="padding: 10px 0;">{{event_location}}</td>
      </tr>
    </mj-table>
    {{#if button_text}}
    <mj-button background-color="#007bff" href="{{button_url}}" align="{{text_align}}">
      {{button_text}}
    </mj-button>
    {{/if}}
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: ["title", "text_content", "event_date", "event_time", "event_location", "button_text", "button_url", "background_color", "text_color", "text_align", "padding"]
  }
]

export { advancedBlockTypes }