#!/usr/bin/env node

/**
 * Automated Directus Collections Installer for Newsletter System
 * This script sets up all required collections, fields, and relationships
 */

import {
  createDirectus,
  rest,
  authentication,
  createCollection,
  createField,
  createRelation,
  createItems,
  readCollections, // Fixed: Added missing import
  aggregate,
  readItems,
  updateCollection,
} from "@directus/sdk";
import { readFileSync } from "node:fs";
import { join } from "node:path";

class DirectusNewsletterInstaller {
  constructor(directusUrl, email, password) {
    this.directus = createDirectus(directusUrl)
      .with(rest())
      .with(authentication());
    this.email = email;
    this.password = password;
    this.existingCollections = new Set();
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

  async checkExistingCollections() {
    try {
      const collections = await this.directus.request(readCollections());
      this.existingCollections = new Set(collections.map((c) => c.collection));
      console.log(`📋 Found ${collections.length} existing collections`);
    } catch (error) {
      console.error("Failed to fetch existing collections:", error.message);
    }
  }

  async createCollectionSafely(collectionConfig) {
    const { collection } = collectionConfig;

    if (this.existingCollections.has(collection)) {
      console.log(`⏭️  Skipping ${collection} - already exists`);
      return true;
    }

    try {
      console.log(`📝 Creating ${collection} collection...`);
      await this.directus.request(createCollection(collectionConfig));
      console.log(`✅ ${collection} collection created`);
      await this.delay(1000);
      return true;
    } catch (error) {
      if (error.message?.includes("already exists")) {
        console.log(`⏭️  ${collection} collection already exists`);
        return true;
      }
      console.error(`❌ Failed to create ${collection}:`, error.message);
      return false;
    }
  }

  async createFieldSafely(collection, fieldConfig) {
    try {
      await this.directus.request(createField(collection, fieldConfig));
      console.log(`✅ Added field: ${collection}.${fieldConfig.field}`);
      await this.delay(1000);
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

  async installCollections() {
    console.log("\n📦 Installing newsletter collections...");

    const collections = [
      {
        collection: "newsletter_templates",
        meta: {
          accountability: "all",
          collection: "newsletter_templates",
          hidden: false,
          icon: "article",
          note: "Reusable newsletter templates",
          display_template: "{{name}} ({{category}})",
          sort: 1,
        },
        schema: { name: "newsletter_templates" },
      },
      {
        collection: "content_library",
        meta: {
          accountability: "all",
          collection: "content_library",
          hidden: false,
          icon: "inventory_2",
          note: "Reusable content blocks and snippets",
          display_template: "{{title}} ({{content_type}})",
          sort: 2,
        },
        schema: { name: "content_library" },
      },
      {
        collection: "subscribers",
        meta: {
          accountability: "all",
          collection: "subscribers",
          hidden: false,
          icon: "person",
          note: "Newsletter subscribers",
          display_template: "{{name}} ({{email}}) - {{status}}",
          sort: 3,
        },
        schema: { name: "subscribers" },
      },
      {
        collection: "mailing_lists",
        meta: {
          accountability: "all",
          collection: "mailing_lists",
          hidden: false,
          icon: "group",
          note: "Subscriber mailing lists",
          display_template: "{{name}} ({{subscriber_count}} subscribers)",
          sort: 4,
        },
        schema: { name: "mailing_lists" },
      },
      {
        collection: "mailing_lists_subscribers",
        meta: {
          accountability: "all",
          collection: "mailing_lists_subscribers",
          hidden: true,
          icon: "link",
          note: "Junction table for mailing lists and subscribers",
        },
        schema: { name: "mailing_lists_subscribers" },
      },
      {
        collection: "newsletters",
        meta: {
          accountability: "all",
          collection: "newsletters",
          hidden: false,
          icon: "mail",
          note: "Email newsletters",
          display_template: "{{title}} - {{status}} ({{category}})",
          sort: 5,
        },
        schema: { name: "newsletters" },
      },
      {
        collection: "newsletter_blocks",
        meta: {
          accountability: "all",
          collection: "newsletter_blocks",
          hidden: false,
          icon: "view_module",
          note: "Newsletter content blocks",
          display_template: "{{block_type.name}} (#{{sort}})",
          sort: 6,
        },
        schema: { name: "newsletter_blocks" },
      },
      {
        collection: "block_types",
        meta: {
          accountability: "all",
          collection: "block_types",
          hidden: false,
          icon: "extension",
          note: "Available MJML block types",
          display_template: "{{name}}",
          sort: 7,
        },
        schema: { name: "block_types" },
      },
      {
        collection: "newsletter_sends",
        meta: {
          accountability: "all",
          collection: "newsletter_sends",
          hidden: false,
          icon: "send",
          note: "Newsletter send history and analytics",
          display_template:
            "{{newsletter.title}} to {{mailing_list.name}} - {{status}}",
          sort: 8,
        },
        schema: { name: "newsletter_sends" },
      },
      // Fixed: Added missing newsletter_analytics collection
      {
        collection: "newsletter_analytics",
        meta: {
          accountability: "all",
          collection: "newsletter_analytics",
          hidden: false,
          icon: "analytics",
          note: "Newsletter tracking events and analytics",
          display_template: "{{event_type}} - {{email}}",
          sort: 9,
        },
        schema: { name: "newsletter_analytics" },
      },
    ];

    for (const collection of collections) {
      await this.createCollectionSafely(collection);
    }

    console.log("✅ Collections created successfully");
  }

  async installFields() {
    console.log("\n🔧 Installing fields...");

    // Newsletter Templates fields
    const templateFields = [
      {
        field: "name",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "description",
        type: "text",
        meta: { interface: "input-multiline", width: "half" },
      },
      {
        field: "category",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Company News", value: "company" },
              { text: "Product Updates", value: "product" },
              { text: "Weekly Digest", value: "weekly" },
              { text: "Monthly Report", value: "monthly" },
              { text: "Event Announcement", value: "event" },
            ],
          },
        },
      },
      {
        field: "thumbnail_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "blocks_config",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
      {
        field: "default_subject_pattern",
        type: "string",
        meta: { interface: "input" },
      },
      {
        field: "default_from_name",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "default_from_email",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Published", value: "published" },
              { text: "Draft", value: "draft" },
            ],
          },
          default_value: "published",
        },
      },
      {
        field: "usage_count",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      { field: "tags", type: "csv", meta: { interface: "tags" } },
    ];

    for (const field of templateFields) {
      await this.createFieldSafely("newsletter_templates", field);
    }

    // Fixed: Added Content Library fields
    const contentLibraryFields = [
      {
        field: "title",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "content_type",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Text", value: "text" },
              { text: "Hero", value: "hero" },
              { text: "Button", value: "button" },
              { text: "Image", value: "image" },
              { text: "HTML", value: "html" },
              { text: "Social", value: "social" },
              { text: "Footer", value: "footer" },
            ],
          },
        },
      },
      {
        field: "content_data",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
      {
        field: "preview_text",
        type: "text",
        meta: { interface: "input-multiline" },
      },
      { field: "tags", type: "csv", meta: { interface: "tags" } },
      { field: "category", type: "string", meta: { interface: "input" } },
      {
        field: "usage_count",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "is_global",
        type: "boolean",
        meta: { interface: "boolean", width: "half" },
        schema: { default_value: false },
      },
    ];

    for (const field of contentLibraryFields) {
      await this.createFieldSafely("content_library", field);
    }

    // Fixed: Added Subscribers fields
    const subscriberFields = [
      {
        field: "email",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "name",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "first_name",
        type: "string",
        meta: { interface: "input", width: "third" },
      },
      {
        field: "last_name",
        type: "string",
        meta: { interface: "input", width: "third" },
      },
      {
        field: "company",
        type: "string",
        meta: { interface: "input", width: "third" },
      },
      {
        field: "job_title",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Active", value: "active" },
              { text: "Unsubscribed", value: "unsubscribed" },
              { text: "Bounced", value: "bounced" },
              { text: "Pending", value: "pending" },
              { text: "Suppressed", value: "suppressed" },
            ],
          },
          default_value: "pending",
        },
      },
      {
        field: "subscription_source",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Website", value: "website" },
              { text: "Import", value: "import" },
              { text: "Manual", value: "manual" },
              { text: "Event", value: "event" },
              { text: "API", value: "api" },
              { text: "Referral", value: "referral" },
            ],
          },
          default_value: "website",
        },
      },
      {
        field: "subscription_preferences",
        type: "csv",
        meta: { interface: "tags" },
      },
      {
        field: "custom_fields",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
      {
        field: "engagement_score",
        type: "integer",
        meta: { interface: "input", width: "half" },
        schema: { default_value: 0 },
      },
      {
        field: "subscribed_at",
        type: "timestamp",
        meta: { interface: "datetime", width: "half" },
      },
      {
        field: "last_email_opened",
        type: "timestamp",
        meta: { interface: "datetime", width: "half" },
      },
      {
        field: "last_email_clicked",
        type: "timestamp",
        meta: { interface: "datetime", width: "half" },
      },
      {
        field: "unsubscribed_at",
        type: "timestamp",
        meta: { interface: "datetime", width: "half" },
      },
      {
        field: "bounce_count",
        type: "integer",
        meta: { interface: "input", width: "half" },
        schema: { default_value: 0 },
      },
    ];

    for (const field of subscriberFields) {
      await this.createFieldSafely("subscribers", field);
    }

    // Fixed: Added Mailing Lists fields
    const mailingListFields = [
      {
        field: "name",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "description",
        type: "text",
        meta: { interface: "input-multiline", width: "half" },
      },
      {
        field: "subscriber_count",
        type: "integer",
        meta: { interface: "input", readonly: true, width: "half" },
        schema: { default_value: 0 },
      },
      {
        field: "active_count",
        type: "integer",
        meta: { interface: "input", readonly: true, width: "half" },
        schema: { default_value: 0 },
      },
      {
        field: "status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Active", value: "active" },
              { text: "Archived", value: "archived" },
            ],
          },
          default_value: "active",
        },
      },
      { field: "tags", type: "csv", meta: { interface: "tags" } },
      {
        field: "subscribers",
        type: "alias",
        meta: { interface: "list-m2m", special: ["m2m"] },
      },
    ];

    for (const field of mailingListFields) {
      await this.createFieldSafely("mailing_lists", field);
    }

    // Fixed: Added junction table fields
    const junctionFields = [
      {
        field: "mailing_lists_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o", hidden: true },
      },
      {
        field: "subscribers_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o", hidden: true },
      },
      {
        field: "subscribed_at",
        type: "timestamp",
        meta: { interface: "datetime" },
      },
      {
        field: "status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Subscribed", value: "subscribed" },
              { text: "Unsubscribed", value: "unsubscribed" },
            ],
          },
          default_value: "subscribed",
        },
      },
    ];

    for (const field of junctionFields) {
      await this.createFieldSafely("mailing_lists_subscribers", field);
    }

    // Block Types fields
    const blockTypeFields = [
      {
        field: "name",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "slug",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "description",
        type: "text",
        meta: { interface: "input-multiline" },
      },
      {
        field: "mjml_template",
        type: "text",
        meta: { interface: "input-code", options: { language: "xml" } },
      },
      {
        field: "status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Published", value: "published" },
              { text: "Draft", value: "draft" },
            ],
          },
          default_value: "published",
        },
      },
      {
        field: "field_visibility_config",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
      {
        field: "icon",
        type: "string",
        meta: { interface: "select-icon", width: "half" },
      },
      {
        field: "category",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Content", value: "content" },
              { text: "Layout", value: "layout" },
              { text: "Media", value: "media" },
              { text: "Interactive", value: "interactive" },
            ],
          },
          default_value: "content",
        },
      },
    ];

    for (const field of blockTypeFields) {
      await this.createFieldSafely("block_types", field);
    }

    // Newsletter fields - Updated to match your types
    const newsletterFields = [
      {
        field: "title",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "slug",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "subject_line",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
      {
        field: "preview_text",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "from_name",
        type: "string",
        meta: { interface: "input", width: "third" },
      },
      {
        field: "from_email",
        type: "string",
        meta: { interface: "input", width: "third" },
      },
      {
        field: "reply_to",
        type: "string",
        meta: { interface: "input", width: "third" },
      },
      {
        field: "status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Draft", value: "draft" },
              { text: "Ready", value: "ready" },
              { text: "Scheduled", value: "scheduled" },
              { text: "Sending", value: "sending" },
              { text: "Sent", value: "sent" },
              { text: "Paused", value: "paused" },
            ],
          },
          default_value: "draft",
        },
      },
      {
        field: "category",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Company", value: "company" },
              { text: "Product", value: "product" },
              { text: "Weekly", value: "weekly" },
              { text: "Monthly", value: "monthly" },
              { text: "Event", value: "event" },
              { text: "Offer", value: "offer" },
              { text: "Story", value: "story" },
            ],
          },
          default_value: "company",
        },
      },
      { field: "tags", type: "csv", meta: { interface: "tags" } },
      {
        field: "priority",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Low", value: "low" },
              { text: "Normal", value: "normal" },
              { text: "High", value: "high" },
              { text: "Urgent", value: "urgent" },
            ],
          },
          default_value: "normal",
        },
      },
      {
        field: "scheduled_send_date",
        type: "timestamp",
        meta: { interface: "datetime" },
      },
      {
        field: "is_ab_test",
        type: "boolean",
        meta: { interface: "boolean" },
        schema: { default_value: false },
      },
      {
        field: "ab_test_percentage",
        type: "integer",
        meta: { interface: "input" },
      },
      {
        field: "ab_test_subject_b",
        type: "string",
        meta: { interface: "input" },
      },
      {
        field: "open_rate",
        type: "float",
        meta: { interface: "input", readonly: true },
      },
      {
        field: "click_rate",
        type: "float",
        meta: { interface: "input", readonly: true },
      },
      {
        field: "total_opens",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "approval_status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Pending", value: "pending" },
              { text: "Approved", value: "approved" },
              { text: "Rejected", value: "rejected" },
              { text: "Changes Requested", value: "changes_requested" },
            ],
          },
          default_value: "pending",
        },
      },
      {
        field: "approval_notes",
        type: "text",
        meta: { interface: "input-multiline" },
      },
      {
        field: "mailing_list_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o" },
      },
      { field: "test_emails", type: "csv", meta: { interface: "tags" } },
      {
        field: "blocks",
        type: "alias",
        meta: {
          interface: "list-o2m",
          special: ["o2m"],
          options: { template: "{{block_type.name}} (#{{sort}})" },
        },
      },
      {
        field: "template_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o" },
      },
      {
        field: "compiled_mjml",
        type: "text",
        meta: {
          interface: "input-code",
          options: { language: "xml" },
          readonly: true,
        },
      },
      {
        field: "compiled_html",
        type: "text",
        meta: {
          interface: "input-code",
          options: { language: "htmlmixed" },
          readonly: true,
        },
      },
    ];

    for (const field of newsletterFields) {
      await this.createFieldSafely("newsletters", field);
    }

    // Newsletter Blocks fields - Updated
    const blockFields = [
      {
        field: "newsletter_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o", hidden: true },
      },
      {
        field: "block_type",
        type: "integer",
        meta: {
          interface: "select-dropdown-m2o",
          required: true,
          width: "half",
        },
      },
      {
        field: "sort",
        type: "integer",
        meta: { interface: "input", width: "half" },
        schema: { default_value: 1 },
      },
      {
        field: "title",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "subtitle",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "text_content",
        type: "text",
        meta: { interface: "input-rich-text-html" },
      },
      {
        field: "image_url",
        type: "string",
        meta: { interface: "input", width: "full" },
      },
      {
        field: "image_alt_text",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "image_caption",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "button_text",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "button_url",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "background_color",
        type: "string",
        meta: { interface: "select-color", width: "third" },
        schema: { default_value: "#ffffff" },
      },
      {
        field: "text_color",
        type: "string",
        meta: { interface: "select-color", width: "third" },
        schema: { default_value: "#333333" },
      },
      {
        field: "text_align",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "third",
          options: {
            choices: [
              { text: "Left", value: "left" },
              { text: "Center", value: "center" },
              { text: "Right", value: "right" },
            ],
          },
          default_value: "center",
        },
      },
      {
        field: "padding",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: { default_value: "20px 0" },
      },
      {
        field: "font_size",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Small (12px)", value: "12px" },
              { text: "Normal (14px)", value: "14px" },
              { text: "Large (16px)", value: "16px" },
            ],
          },
          default_value: "14px",
        },
      },
      {
        field: "content",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
      {
        field: "mjml_output",
        type: "text",
        meta: {
          interface: "input-code",
          options: { language: "xml" },
          readonly: true,
        },
      },
    ];

    for (const field of blockFields) {
      await this.createFieldSafely("newsletter_blocks", field);
    }

    // Fixed: Added Newsletter Sends fields
    const sendFields = [
      {
        field: "newsletter_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o", required: true },
      },
      {
        field: "mailing_list_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o", required: true },
      },
      {
        field: "status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Scheduled", value: "scheduled" },
              { text: "Sending", value: "sending" },
              { text: "Sent", value: "sent" },
              { text: "Failed", value: "failed" },
              { text: "Paused", value: "paused" },
              { text: "Cancelled", value: "cancelled" },
            ],
          },
          default_value: "scheduled",
        },
      },
      {
        field: "scheduled_at",
        type: "timestamp",
        meta: { interface: "datetime" },
      },
      { field: "sent_at", type: "timestamp", meta: { interface: "datetime" } },
      {
        field: "total_recipients",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "total_sent",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "total_delivered",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "total_bounced",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "total_opened",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "total_clicked",
        type: "integer",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "open_rate",
        type: "float",
        meta: { interface: "input", readonly: true },
      },
      {
        field: "click_rate",
        type: "float",
        meta: { interface: "input", readonly: true },
      },
      {
        field: "sendgrid_batch_id",
        type: "string",
        meta: { interface: "input", readonly: true },
      },
      {
        field: "error_message",
        type: "text",
        meta: { interface: "input-multiline", readonly: true },
      },
    ];

    for (const field of sendFields) {
      await this.createFieldSafely("newsletter_sends", field);
    }

    // Fixed: Added Newsletter Analytics fields
    const analyticsFields = [
      {
        field: "newsletter_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o" },
      },
      {
        field: "subscriber_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o" },
      },
      {
        field: "send_record_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o" },
      },
      {
        field: "event_type",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Delivered", value: "delivered" },
              { text: "Open", value: "open" },
              { text: "Click", value: "click" },
              { text: "Bounce", value: "bounce" },
              { text: "Unsubscribe", value: "unsubscribe" },
              { text: "Spam Report", value: "spamreport" },
              { text: "Dropped", value: "dropped" },
            ],
          },
        },
      },
      { field: "email", type: "string", meta: { interface: "input" } },
      {
        field: "timestamp",
        type: "timestamp",
        meta: { interface: "datetime" },
      },
      { field: "user_agent", type: "string", meta: { interface: "input" } },
      { field: "ip_address", type: "string", meta: { interface: "input" } },
      {
        field: "location",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
      { field: "url_clicked", type: "string", meta: { interface: "input" } },
      { field: "sg_message_id", type: "string", meta: { interface: "input" } },
      { field: "sg_event_id", type: "string", meta: { interface: "input" } },
      { field: "bounce_reason", type: "string", meta: { interface: "input" } },
      {
        field: "metadata",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
    ];

    for (const field of analyticsFields) {
      await this.createFieldSafely("newsletter_analytics", field);
    }

    console.log("✅ Fields created successfully");
  }

  async installRelations() {
    console.log("\n🔗 Installing relationships...");

    const relations = [
      // Newsletter → Blocks (O2M)
      {
        collection: "newsletter_blocks",
        field: "newsletter_id",
        related_collection: "newsletters",
        meta: {
          many_collection: "newsletter_blocks",
          many_field: "newsletter_id",
          one_collection: "newsletters",
          one_field: "blocks",
          sort_field: "sort",
          one_deselect_action: "delete",
        },
        schema: {
          on_delete: "CASCADE",
        },
      },
      // Newsletter Blocks → Block Types (M2O)
      {
        collection: "newsletter_blocks",
        field: "block_type",
        related_collection: "block_types",
        meta: {
          many_collection: "newsletter_blocks",
          many_field: "block_type",
          one_collection: "block_types",
          one_deselect_action: "nullify",
        },
      },
      // Newsletter → Template (M2O)
      {
        collection: "newsletters",
        field: "template_id",
        related_collection: "newsletter_templates",
        meta: {
          many_collection: "newsletters",
          many_field: "template_id",
          one_collection: "newsletter_templates",
          one_deselect_action: "nullify",
        },
      },
      // Newsletter → Mailing List (M2O)
      {
        collection: "newsletters",
        field: "mailing_list_id",
        related_collection: "mailing_lists",
        meta: {
          many_collection: "newsletters",
          many_field: "mailing_list_id",
          one_collection: "mailing_lists",
          one_deselect_action: "nullify",
        },
      },
      // Mailing Lists ↔ Subscribers (M2M)
      {
        collection: "mailing_lists_subscribers",
        field: "mailing_lists_id",
        related_collection: "mailing_lists",
        meta: {
          many_collection: "mailing_lists_subscribers",
          many_field: "mailing_lists_id",
          one_collection: "mailing_lists",
          junction_field: "subscribers",
          one_deselect_action: "delete",
        },
        schema: {
          on_delete: "CASCADE",
        },
      },
      {
        collection: "mailing_lists_subscribers",
        field: "subscribers_id",
        related_collection: "subscribers",
        meta: {
          many_collection: "mailing_lists_subscribers",
          many_field: "subscribers_id",
          one_collection: "subscribers",
          junction_field: "mailing_lists",
          one_deselect_action: "delete",
        },
        schema: {
          on_delete: "CASCADE",
        },
      },
      // Newsletter Sends → Newsletter (M2O)
      {
        collection: "newsletter_sends",
        field: "newsletter_id",
        related_collection: "newsletters",
        meta: {
          many_collection: "newsletter_sends",
          many_field: "newsletter_id",
          one_collection: "newsletters",
          one_deselect_action: "cascade",
        },
        schema: {
          on_delete: "CASCADE",
        },
      },
      // Newsletter Sends → Mailing List (M2O)
      {
        collection: "newsletter_sends",
        field: "mailing_list_id",
        related_collection: "mailing_lists",
        meta: {
          many_collection: "newsletter_sends",
          many_field: "mailing_list_id",
          one_collection: "mailing_lists",
          one_deselect_action: "nullify",
        },
      },
      // Newsletter Analytics → Newsletter (M2O)
      {
        collection: "newsletter_analytics",
        field: "newsletter_id",
        related_collection: "newsletters",
        meta: {
          many_collection: "newsletter_analytics",
          many_field: "newsletter_id",
          one_collection: "newsletters",
          one_deselect_action: "cascade",
        },
        schema: {
          on_delete: "CASCADE",
        },
      },
      // Newsletter Analytics → Subscriber (M2O)
      {
        collection: "newsletter_analytics",
        field: "subscriber_id",
        related_collection: "subscribers",
        meta: {
          many_collection: "newsletter_analytics",
          many_field: "subscriber_id",
          one_collection: "subscribers",
          one_deselect_action: "nullify",
        },
      },
      // Newsletter Analytics → Send Record (M2O)
      {
        collection: "newsletter_analytics",
        field: "send_record_id",
        related_collection: "newsletter_sends",
        meta: {
          many_collection: "newsletter_analytics",
          many_field: "send_record_id",
          one_collection: "newsletter_sends",
          one_deselect_action: "cascade",
        },
        schema: {
          on_delete: "CASCADE",
        },
      },
    ];

    for (const relation of relations) {
      try {
        await this.directus.request(createRelation(relation));
        console.log(
          `✅ Created relation: ${relation.collection}.${relation.field} → ${relation.related_collection}`
        );
        await this.delay(1000);
      } catch (error) {
        if (error.message?.includes("already exists")) {
          console.log(
            `⏭️  Relation already exists: ${relation.collection}.${relation.field}`
          );
        } else {
          console.error(`❌ Failed to create relation: ${error.message}`);
        }
      }
    }

    console.log("✅ Relationships created successfully");
  }

  async installSampleData() {
    console.log("\n🧩 Installing sample data...");

    // Sample block types
    const blockTypes = [
      {
        name: "Hero Section",
        slug: "hero",
        description:
          "Large header section with title, subtitle, and optional button",
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
        field_visibility_config: [
          "title",
          "subtitle",
          "button_text",
          "button_url",
          "background_color",
          "text_color",
          "text_align",
          "padding",
        ],
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
        field_visibility_config: [
          "text_content",
          "background_color",
          "text_color",
          "text_align",
          "padding",
          "font_size",
        ],
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
        field_visibility_config: [
          "image_url",
          "image_alt_text",
          "image_caption",
          "button_url",
          "background_color",
          "text_align",
          "padding",
        ],
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
        field_visibility_config: [
          "button_text",
          "button_url",
          "background_color",
          "text_align",
          "padding",
        ],
      },
    ];

    for (const blockType of blockTypes) {
      try {
        await this.directus.request(createItems("block_types", blockType));
        console.log(`✅ Created block type: ${blockType.name}`);
        await this.delay(300);
      } catch (error) {
        console.log(
          `⚠️  Could not create block type ${blockType.name}: ${error.message}`
        );
      }
    }

    console.log("✅ Sample data installed successfully");
  }

  async run() {
    console.log("🚀 Starting Newsletter System Installation\n");

    if (!(await this.authenticate())) {
      return false;
    }

    try {
      await this.checkExistingCollections();
      await this.installCollections();
      await this.installFields();
      await this.installRelations();
      await this.installSampleData();

      console.log(
        "\n🎉 Newsletter system installation completed successfully!"
      );
      console.log("\n📋 What was installed:");
      console.log("    • 10 Collections for newsletter management");
      console.log("    • All required fields and relationships");
      console.log("    • 4 Basic block types (Hero, Text, Image, Button)");
      console.log("    • Proper O2M and M2M relationships");
      console.log("    • Analytics tracking system");

      console.log("\n📋 Next steps:");
      console.log("1. Install the Nuxt module in your project");
      console.log("2. Configure your environment variables");
      console.log("3. Start creating newsletters!");

      return true;
    } catch (error) {
      console.error("\n❌ Installation failed:", error.message);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log("Newsletter System Installer");
    console.log("");
    console.log(
      "Usage: node install-directus-collections.js <directus-url> <email> <password>"
    );
    console.log("");
    console.log("Examples:");
    console.log(
      "  node install-directus-collections.js https://admin.example.com admin@example.com password123"
    );
    process.exit(1);
  }

  const [directusUrl, email, password] = args;

  const installer = new DirectusNewsletterInstaller(
    directusUrl,
    email,
    password
  );

  const success = await installer.run();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
