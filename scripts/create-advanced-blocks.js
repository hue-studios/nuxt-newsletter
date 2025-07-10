#!/usr/bin/env node

/**
 * Advanced Block Types Creator
 * Creates more sophisticated MJML block types for newsletters
 */

import {
  createDirectus,
  rest,
  authentication,
  createItems,
  createField,
} from "@directus/sdk";

class AdvancedBlocksInstaller {
  constructor(directusUrl, email, password) {
    this.directus = createDirectus(directusUrl)
      .with(rest())
      .with(authentication());
    this.email = email;
    this.password = password;
  }

  async authenticate() {
    try {
      console.log("🔐 Authenticating with Directus...");
      await this.directus.login({ email: this.email, password: this.password });
      console.log("✅ Authentication successful");
      return true;
    } catch (error) {
      console.error("❌ Authentication failed:", error.message);
      return false;
    }
  }

  async createFieldSafely(collection, fieldConfig) {
    try {
      await this.directus.request(createField(collection, fieldConfig));
      console.log(`✅ Added field: ${collection}.${fieldConfig.field}`);
      await this.delay(500);
      return true;
    } catch (error) {
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate")
      ) {
        console.log(`⏭️  Field ${fieldConfig.field} already exists`);
        return true;
      }
      console.error(
        `❌ Failed to create field ${fieldConfig.field}:`,
        error.message
      );
      return false;
    }
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async addRequiredFields() {
    console.log("\n🔧 Adding required fields for advanced blocks...");

    // Additional fields needed for advanced block types
    const additionalFields = [
      // Product showcase fields
      {
        field: "price",
        type: "string",
        meta: { interface: "input", width: "half" },
      },

      // Statistics fields
      {
        field: "stat1_number",
        type: "string",
        meta: { interface: "input", width: "fourth" },
      },
      {
        field: "stat1_label",
        type: "string",
        meta: { interface: "input", width: "fourth" },
      },
      {
        field: "stat2_number",
        type: "string",
        meta: { interface: "input", width: "fourth" },
      },
      {
        field: "stat2_label",
        type: "string",
        meta: { interface: "input", width: "fourth" },
      },
      {
        field: "stat3_number",
        type: "string",
        meta: { interface: "input", width: "fourth" },
      },
      {
        field: "stat3_label",
        type: "string",
        meta: { interface: "input", width: "fourth" },
      },
      {
        field: "stat4_number",
        type: "string",
        meta: { interface: "input", width: "fourth" },
      },
      {
        field: "stat4_label",
        type: "string",
        meta: { interface: "input", width: "fourth" },
      },

      // Social media fields
      {
        field: "facebook_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "twitter_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "instagram_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "linkedin_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "youtube_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "tiktok_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },

      // Event fields
      {
        field: "event_date",
        type: "string",
        meta: { interface: "input", width: "third" },
      },
      {
        field: "event_time",
        type: "string",
        meta: { interface: "input", width: "third" },
      },
      {
        field: "event_location",
        type: "string",
        meta: { interface: "input", width: "third" },
      },

      // Feature list fields
      {
        field: "feature1",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "feature2",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "feature3",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "feature4",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "feature5",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "feature6",
        type: "string",
        meta: { interface: "input", width: "half" },
      },

      // Testimonial fields
      {
        field: "testimonial_text",
        type: "text",
        meta: { interface: "input-multiline" },
      },
      {
        field: "testimonial_author",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "author_title",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "author_company",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "author_avatar",
        type: "string",
        meta: { interface: "input", width: "half" },
      },

      // Multi-column fields
      {
        field: "column1_title",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "column1_content",
        type: "text",
        meta: { interface: "input-multiline", width: "half" },
      },
      {
        field: "column2_title",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "column2_content",
        type: "text",
        meta: { interface: "input-multiline", width: "half" },
      },
      {
        field: "column3_title",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "column3_content",
        type: "text",
        meta: { interface: "input-multiline", width: "half" },
      },

      // CTA section fields
      { field: "cta_title", type: "string", meta: { interface: "input" } },
      { field: "cta_subtitle", type: "string", meta: { interface: "input" } },
      {
        field: "primary_button_text",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "primary_button_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "secondary_button_text",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "secondary_button_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },

      // Progress/rating fields
      {
        field: "progress_percentage",
        type: "integer",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "progress_label",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "rating_value",
        type: "integer",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "rating_max",
        type: "integer",
        meta: { interface: "input", width: "half" },
      },
    ];

    for (const field of additionalFields) {
      await this.createFieldSafely("newsletter_blocks", field);
    }

    console.log("✅ Additional fields created successfully");
  }

  async installAdvancedBlocks() {
    console.log("\n🧩 Installing advanced block types...");

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
    <mj-text font-size="16px" color="{{text_color}}" line-height="1.6">
      {{{text_content}}}
    </mj-text>
    {{#if price}}
    <mj-text font-size="20px" font-weight="bold" color="#e53e3e" padding="10px 0">
      {{price}}
    </mj-text>
    {{/if}}
    {{#if button_text}}
    <mj-button background-color="#007bff" href="{{button_url}}" align="left">
      {{button_text}}
    </mj-button>
    {{/if}}
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "title",
          "text_content",
          "image_url",
          "image_alt_text",
          "price",
          "button_text",
          "button_url",
          "background_color",
          "text_color",
          "padding",
        ],
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
    <mj-text font-size="14px" color="#666666" font-style="italic" padding="5px 0">
      {{subtitle}}
    </mj-text>
    {{/if}}
    <mj-text font-size="14px" color="{{text_color}}" line-height="1.6">
      {{{text_content}}}
    </mj-text>
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "title",
          "subtitle",
          "text_content",
          "image_url",
          "image_alt_text",
          "background_color",
          "text_color",
          "padding",
        ],
      },

      {
        name: "Statistics Block",
        slug: "statistics",
        description: "Display key statistics with numbers and labels",
        category: "content",
        icon: "bar_chart",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  {{#if stat1_number}}
  <mj-column width="25%">
    <mj-text align="center" font-size="36px" font-weight="bold" color="#007bff">
      {{stat1_number}}
    </mj-text>
    <mj-text align="center" font-size="14px" color="{{text_color}}">
      {{stat1_label}}
    </mj-text>
  </mj-column>
  {{/if}}
  {{#if stat2_number}}
  <mj-column width="25%">
    <mj-text align="center" font-size="36px" font-weight="bold" color="#28a745">
      {{stat2_number}}
    </mj-text>
    <mj-text align="center" font-size="14px" color="{{text_color}}">
      {{stat2_label}}
    </mj-text>
  </mj-column>
  {{/if}}
  {{#if stat3_number}}
  <mj-column width="25%">
    <mj-text align="center" font-size="36px" font-weight="bold" color="#ffc107">
      {{stat3_number}}
    </mj-text>
    <mj-text align="center" font-size="14px" color="{{text_color}}">
      {{stat3_label}}
    </mj-text>
  </mj-column>
  {{/if}}
  {{#if stat4_number}}
  <mj-column width="25%">
    <mj-text align="center" font-size="36px" font-weight="bold" color="#dc3545">
      {{stat4_number}}
    </mj-text>
    <mj-text align="center" font-size="14px" color="{{text_color}}">
      {{stat4_label}}
    </mj-text>
  </mj-column>
  {{/if}}
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "stat1_number",
          "stat1_label",
          "stat2_number",
          "stat2_label",
          "stat3_number",
          "stat3_label",
          "stat4_number",
          "stat4_label",
          "background_color",
          "text_color",
          "padding",
        ],
      },

      {
        name: "Social Media Links",
        slug: "social-links",
        description: "Social media icons with links",
        category: "interactive",
        icon: "share",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    {{#if title}}
    <mj-text align="{{text_align}}" font-size="16px" color="{{text_color}}" padding-bottom="20px">
      {{title}}
    </mj-text>
    {{/if}}
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
      {{#if youtube_url}}
      <mj-social-element name="youtube" href="{{youtube_url}}" />
      {{/if}}
    </mj-social>
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "title",
          "facebook_url",
          "twitter_url",
          "instagram_url",
          "linkedin_url",
          "youtube_url",
          "background_color",
          "text_color",
          "text_align",
          "padding",
        ],
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
    {{#if text_content}}
    <mj-text font-size="16px" color="{{text_color}}" align="{{text_align}}" line-height="1.6">
      {{{text_content}}}
    </mj-text>
    {{/if}}
    <mj-table>
      {{#if event_date}}
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding: 10px 0; font-weight: bold; color: {{text_color}};">📅 Date:</td>
        <td style="padding: 10px 0; color: {{text_color}};">{{event_date}}</td>
      </tr>
      {{/if}}
      {{#if event_time}}
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding: 10px 0; font-weight: bold; color: {{text_color}};">🕐 Time:</td>
        <td style="padding: 10px 0; color: {{text_color}};">{{event_time}}</td>
      </tr>
      {{/if}}
      {{#if event_location}}
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: {{text_color}};">📍 Location:</td>
        <td style="padding: 10px 0; color: {{text_color}};">{{event_location}}</td>
      </tr>
      {{/if}}
    </mj-table>
    {{#if button_text}}
    <mj-button background-color="#007bff" href="{{button_url}}" align="{{text_align}}">
      {{button_text}}
    </mj-button>
    {{/if}}
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "title",
          "text_content",
          "event_date",
          "event_time",
          "event_location",
          "button_text",
          "button_url",
          "background_color",
          "text_color",
          "text_align",
          "padding",
        ],
      },

      {
        name: "Feature List",
        slug: "feature-list",
        description: "List of features with checkmarks",
        category: "content",
        icon: "checklist",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    {{#if title}}
    <mj-text font-size="24px" font-weight="bold" color="{{text_color}}" align="{{text_align}}" padding-bottom="20px">
      {{title}}
    </mj-text>
    {{/if}}
    {{#if feature1}}
    <mj-text font-size="16px" color="{{text_color}}" padding="5px 0">
      ✅ {{feature1}}
    </mj-text>
    {{/if}}
    {{#if feature2}}
    <mj-text font-size="16px" color="{{text_color}}" padding="5px 0">
      ✅ {{feature2}}
    </mj-text>
    {{/if}}
    {{#if feature3}}
    <mj-text font-size="16px" color="{{text_color}}" padding="5px 0">
      ✅ {{feature3}}
    </mj-text>
    {{/if}}
    {{#if feature4}}
    <mj-text font-size="16px" color="{{text_color}}" padding="5px 0">
      ✅ {{feature4}}
    </mj-text>
    {{/if}}
    {{#if feature5}}
    <mj-text font-size="16px" color="{{text_color}}" padding="5px 0">
      ✅ {{feature5}}
    </mj-text>
    {{/if}}
    {{#if feature6}}
    <mj-text font-size="16px" color="{{text_color}}" padding="5px 0">
      ✅ {{feature6}}
    </mj-text>
    {{/if}}
    {{#if button_text}}
    <mj-button background-color="#007bff" href="{{button_url}}" align="{{text_align}}" padding="20px 0 0 0">
      {{button_text}}
    </mj-button>
    {{/if}}
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "title",
          "feature1",
          "feature2",
          "feature3",
          "feature4",
          "feature5",
          "feature6",
          "button_text",
          "button_url",
          "background_color",
          "text_color",
          "text_align",
          "padding",
        ],
      },

      {
        name: "Testimonial",
        slug: "testimonial",
        description: "Customer testimonial with author info",
        category: "content",
        icon: "format_quote",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-text font-size="20px" color="{{text_color}}" align="{{text_align}}" font-style="italic" line-height="1.6">
      "{{testimonial_text}}"
    </mj-text>
    <mj-table padding="20px 0 0 0">
      <tr>
        {{#if author_avatar}}
        <td style="width: 60px; vertical-align: top;">
          <img src="{{author_avatar}}" alt="{{testimonial_author}}" style="width: 50px; height: 50px; border-radius: 50%;" />
        </td>
        {{/if}}
        <td style="vertical-align: top;">
          <div style="font-weight: bold; color: {{text_color}}; font-size: 16px;">
            {{testimonial_author}}
          </div>
          {{#if author_title}}
          <div style="color: #666666; font-size: 14px;">
            {{author_title}}{{#if author_company}}, {{author_company}}{{/if}}
          </div>
          {{/if}}
        </td>
      </tr>
    </mj-table>
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "testimonial_text",
          "testimonial_author",
          "author_title",
          "author_company",
          "author_avatar",
          "background_color",
          "text_color",
          "text_align",
          "padding",
        ],
      },

      {
        name: "Three Column Layout",
        slug: "three-column",
        description: "Three column content layout",
        category: "layout",
        icon: "view_column",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  {{#if column1_title}}
  <mj-column width="33.33%">
    <mj-text font-size="18px" font-weight="bold" color="{{text_color}}" align="center" padding-bottom="10px">
      {{column1_title}}
    </mj-text>
    {{#if column1_content}}
    <mj-text font-size="14px" color="{{text_color}}" align="center" line-height="1.6">
      {{column1_content}}
    </mj-text>
    {{/if}}
  </mj-column>
  {{/if}}
  {{#if column2_title}}
  <mj-column width="33.33%">
    <mj-text font-size="18px" font-weight="bold" color="{{text_color}}" align="center" padding-bottom="10px">
      {{column2_title}}
    </mj-text>
    {{#if column2_content}}
    <mj-text font-size="14px" color="{{text_color}}" align="center" line-height="1.6">
      {{column2_content}}
    </mj-text>
    {{/if}}
  </mj-column>
  {{/if}}
  {{#if column3_title}}
  <mj-column width="33.33%">
    <mj-text font-size="18px" font-weight="bold" color="{{text_color}}" align="center" padding-bottom="10px">
      {{column3_title}}
    </mj-text>
    {{#if column3_content}}
    <mj-text font-size="14px" color="{{text_color}}" align="center" line-height="1.6">
      {{column3_content}}
    </mj-text>
    {{/if}}
  </mj-column>
  {{/if}}
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "column1_title",
          "column1_content",
          "column2_title",
          "column2_content",
          "column3_title",
          "column3_content",
          "background_color",
          "text_color",
          "padding",
        ],
      },

      {
        name: "Call to Action Section",
        slug: "cta-section",
        description: "Prominent call-to-action with multiple buttons",
        category: "interactive",
        icon: "campaign",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    {{#if cta_title}}
    <mj-text font-size="28px" font-weight="bold" color="{{text_color}}" align="{{text_align}}" padding-bottom="10px">
      {{cta_title}}
    </mj-text>
    {{/if}}
    {{#if cta_subtitle}}
    <mj-text font-size="18px" color="{{text_color}}" align="{{text_align}}" padding-bottom="20px" line-height="1.6">
      {{cta_subtitle}}
    </mj-text>
    {{/if}}
    <mj-table>
      <tr>
        {{#if primary_button_text}}
        <td style="padding: 10px;">
          <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; border-radius: 6px; background-color: #007bff;">
            <tr>
              <td style="color: white; font-weight: bold; padding: 12px 25px; text-decoration: none;">
                <a href="{{primary_button_url}}" style="color: white; text-decoration: none; font-size: 16px;">{{primary_button_text}}</a>
              </td>
            </tr>
          </table>
        </td>
        {{/if}}
        {{#if secondary_button_text}}
        <td style="padding: 10px;">
          <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; border-radius: 6px; border: 2px solid #007bff;">
            <tr>
              <td style="color: #007bff; font-weight: bold; padding: 12px 25px; text-decoration: none;">
                <a href="{{secondary_button_url}}" style="color: #007bff; text-decoration: none; font-size: 16px;">{{secondary_button_text}}</a>
              </td>
            </tr>
          </table>
        </td>
        {{/if}}
      </tr>
    </mj-table>
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "cta_title",
          "cta_subtitle",
          "primary_button_text",
          "primary_button_url",
          "secondary_button_text",
          "secondary_button_url",
          "background_color",
          "text_color",
          "text_align",
          "padding",
        ],
      },

      {
        name: "Progress Bar",
        slug: "progress-bar",
        description: "Progress indicator with percentage and label",
        category: "content",
        icon: "linear_scale",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    {{#if title}}
    <mj-text font-size="18px" font-weight="bold" color="{{text_color}}" align="{{text_align}}" padding-bottom="10px">
      {{title}}
    </mj-text>
    {{/if}}
    {{#if progress_label}}
    <mj-text font-size="14px" color="{{text_color}}" align="{{text_align}}" padding-bottom="5px">
      {{progress_label}}
    </mj-text>
    {{/if}}
    <mj-table>
      <tr>
        <td style="background-color: #e2e8f0; height: 20px; border-radius: 10px; position: relative; overflow: hidden;">
          <div style="background-color: #007bff; height: 100%; width: {{progress_percentage}}%; border-radius: 10px;"></div>
        </td>
        <td style="padding-left: 15px; font-weight: bold; color: {{text_color}};">
          {{progress_percentage}}%
        </td>
      </tr>
    </mj-table>
  </mj-column>
</mj-section>`,
        status: "published",
        field_visibility_config: [
          "title",
          "progress_label",
          "progress_percentage",
          "background_color",
          "text_color",
          "text_align",
          "padding",
        ],
      },
    ];

    for (const blockType of advancedBlockTypes) {
      try {
        await this.directus.request(createItems("block_types", blockType));
        console.log(`✅ Created advanced block type: ${blockType.name}`);
        await this.delay(300);
      } catch (error) {
        if (
          error.message?.includes("duplicate") ||
          error.message?.includes("unique")
        ) {
          console.log(`⏭️  Block type "${blockType.name}" already exists`);
        } else {
          console.log(
            `⚠️  Could not create block type ${blockType.name}: ${error.message}`
          );
        }
      }
    }

    console.log("✅ Advanced block types installed successfully");
  }

  async run() {
    console.log("🚀 Installing Advanced Newsletter Block Types\n");

    if (!(await this.authenticate())) {
      return false;
    }

    try {
      await this.addRequiredFields();
      await this.installAdvancedBlocks();

      console.log(
        "\n🎉 Advanced block types installation completed successfully!"
      );
      console.log("\n📋 What was installed:");
      console.log("    • 30+ additional fields for advanced blocks");
      console.log("    • 10 Advanced block types:");
      console.log("        - Product Showcase");
      console.log("        - Team Member");
      console.log("        - Statistics Block");
      console.log("        - Social Media Links");
      console.log("        - Event Card");
      console.log("        - Feature List");
      console.log("        - Testimonial");
      console.log("        - Three Column Layout");
      console.log("        - Call to Action Section");
      console.log("        - Progress Bar");

      console.log(
        "\n📋 These blocks are now available in your newsletter editor!"
      );

      return true;
    } catch (error) {
      console.error("\n❌ Installation failed:", error.message);
      console.error(error.stack);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log("Advanced Newsletter Blocks Installer");
    console.log("");
    console.log(
      "Usage: node create-advanced-blocks.js <directus-url> <email> <password>"
    );
    console.log("");
    console.log("Examples:");
    console.log(
      "  node create-advanced-blocks.js https://admin.example.com admin@example.com password123"
    );
    console.log("");
    console.log(
      "Note: Run this AFTER installing the basic collections with install-directus-collections.js"
    );
    process.exit(1);
  }

  const [directusUrl, email, password] = args;

  const installer = new AdvancedBlocksInstaller(directusUrl, email, password);

  const success = await installer.run();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
