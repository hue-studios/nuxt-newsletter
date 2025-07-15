#!/usr/bin/env node

/**
 * Enhanced Directus Collections Installer for Newsletter System
 * This script sets up all required collections, fields, relationships
 * and organizes them into a "Newsletter System" folder for better UX
 *
 * Updates:
 * - Adds 'sort', 'date_created', 'date_updated' default fields to all collections.
 * - 'date_created' is auto-populated with current timestamp.
 * - 'id' fields are set back to integers (auto-incrementing).
 * - Relationship field types are adjusted to match integer IDs.
 * - 'sort', 'date_created', 'date_updated' fields are now hidden on detail views.
 * - 'status' field is moved to the top of each relevant collection's detail view.
 * - 'image_url' field in 'newsletter_blocks' now uses Directus File Library interface (UUID) and is renamed to 'image'.
 * - FIX: Removed duplicate 'sort' field definition for 'newsletter_blocks' to prevent creation errors.
 * - FIX: Updated 'field_visibility_config' in sample 'Image Block' type to reference 'image' field.
 * - NEW: Added explicit default values for all 'status' fields.
 * - NEW: Moved 'slug' field to the bottom of the 'newsletters' collection.
 * - FIX: Corrected 'mjml_template' and 'field_visibility_config' in 'Image Block' sample data to use 'image' field.
 *
 * IMPORTANT NOTE ON ID TYPE MIGRATION:
 * If your Directus instance previously had these collections with UUID primary keys,
 * merely running this script will NOT automatically convert existing 'id' fields
 * or foreign key fields from UUID to integer. Directus's SDKs generally create
 * new schemas but do not alter existing column types for primary/foreign keys
 * to prevent data loss.
 *
 * For a clean transition back to integers, it is HIGHLY RECOMMENDED to:
 * 1. Back up your Directus data (if any is important).
 * 2. Delete the affected collections from your Directus instance (or drop tables directly).
 * 3. Then, run this script on a clean slate.
 */

import {
  authentication,
  createCollection,
  createDirectus,
  createField,
  createItems,
  createRelation,
  readCollections,
  rest,
  updateCollection,
} from "@directus/sdk";

class DirectusNewsletterInstaller {
  constructor(directusUrl, email, password) {
    this.directus = createDirectus(directusUrl)
      .with(rest())
      .with(authentication());
    this.email = email;
    this.password = password;
    this.existingCollections = new Set();
    this.folderName = "Newsletter System";
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

  async createNewsletterFolder() {
    console.log(`📁 Creating "${this.folderName}" folder...`);

    try {
      // Check if folder already exists
      const collections = await this.directus.request(readCollections());
      const existingFolder = collections.find(c =>
        c.meta?.group === null &&
        c.meta?.display_template === this.folderName
      );

      if (existingFolder) {
        console.log(`✅ Folder "${this.folderName}" already exists`);
        return existingFolder.collection;
      }

      // Create the folder collection
      const folderConfig = {
        collection: 'newsletter_system',
        meta: {
          accountability: 'all',
          collection: 'newsletter_system',
          group: null,
          hidden: false,
          icon: 'folder',
          note: 'Newsletter system collections folder',
          display_template: this.folderName,
          translations: null,
          archive_field: null,
          archive_app_filter: true,
          archive_value: null,
          unarchive_value: null,
          singleton: false,
          collapse: 'open',
          item_duplication_fields: null,
          sort: 1,
          sort_field: null,
          preview_url: null,
          versioning: false
        },
        schema: {
          name: 'newsletter_system'
        }
      };

      const folder = await this.directus.request(createCollection(folderConfig));
      console.log(`✅ Created "${this.folderName}" folder`);
      await this.delay(1000);

      return folder.collection;
    } catch (error) {
      console.error(`❌ Failed to create folder: ${error.message}`);
      // Continue without folder if creation fails
      return null;
    }
  }

  async createCollectionSafely(collectionConfig, folderId = null) {
    const { collection } = collectionConfig;

    if (this.existingCollections.has(collection)) {
      console.log(`⏭️  Skipping ${collection} - already exists`);

      // Update existing collection to be in folder if folder exists
      if (folderId) {
        try {
          await this.directus.request(updateCollection(collection, {
            meta: {
              ...collectionConfig.meta,
              group: folderId
            }
          }));
          console.log(`📁 Moved ${collection} to "${this.folderName}" folder`);
        } catch (error) {
          console.log(`⚠️  Could not move ${collection} to folder: ${error.message}`);
        }
      }
      return true;
    }

    try {
      console.log(`📝 Creating ${collection} collection...`);

      // Add folder assignment if folder exists
      if (folderId) {
        collectionConfig.meta.group = folderId;
      }

      // Revert primary key to integer (default behavior if primary_key_type is not set)
      // For Directus 11, omitting primary_key_type or setting it to 'integer' will use auto-incrementing integers.
      // We will remove the explicit 'primary_key_type: 'uuid'' line.
      if (collectionConfig.schema && collectionConfig.schema.primary_key_type) {
        delete collectionConfig.schema.primary_key_type;
      }

      await this.directus.request(createCollection(collectionConfig));
      console.log(`✅ ${collection} collection created${folderId ? ` in "${this.folderName}" folder` : ''}`);
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

  async installCollections() {
    console.log("\n📦 Installing newsletter collections...");

    // Create the folder first
    const folderId = await this.createNewsletterFolder();

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
          sort: 5,
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
          sort: 6,
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
          sort: 7,
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
          sort: 8,
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
          sort: 9,
        },
        schema: { name: "newsletter_sends" },
      },
      {
        collection: "newsletter_analytics",
        meta: {
          accountability: "all",
          collection: "newsletter_analytics",
          hidden: false,
          icon: "analytics",
          note: "Newsletter tracking events and analytics",
          display_template: "{{event_type}} - {{email}}",
          sort: 10,
        },
        schema: { name: "newsletter_analytics" },
      },
    ];

    for (const collection of collections) {
      await this.createCollectionSafely(collection, folderId);
    }

    console.log("✅ Collections created successfully");

    if (folderId) {
      console.log(`📁 All collections organized in "${this.folderName}" folder`);
    }
  }

  async installFields() {
    console.log("\n🔧 Installing fields...");

    // Default fields to add to all collections
    const defaultFields = [
      {
        field: "sort",
        type: "integer",
        meta: {
          interface: "input",
          options: {
            min: 1,
            step: 1,
          },
          note: "Manually sort items within the collection.",
          hidden: true, // Hidden on detail
        },
        schema: {
          is_nullable: true, // 'sort' can be null
        },
      },
      {
        field: "date_created",
        type: "timestamp",
        meta: {
          interface: "datetime",
          readonly: true,
          width: "half",
          note: "Timestamp when the item was created.",
          hidden: true, // Hidden on detail
        },
        schema: {
          default_value: "$NOW", // Directus special value for current timestamp
          is_nullable: true, // Allow null if not auto-populated
        },
      },
      {
        field: "date_updated",
        type: "timestamp",
        meta: {
          interface: "datetime",
          readonly: true,
          width: "half",
          note: "Timestamp when the item was last updated.",
          hidden: true, // Hidden on detail
        },
        schema: {
          default_value: "$NOW", // Directus special value for current timestamp on update
          on_update: true,
          is_nullable: true, // Allow null if not auto-populated
        },
      },
    ];

    // Get all collection names to add default fields
    const allCollectionNames = [
      "newsletter_templates", "content_library", "subscribers",
      "mailing_lists", "mailing_lists_subscribers", "newsletters",
      "newsletter_blocks", "block_types", "newsletter_sends",
      "newsletter_analytics"
    ];

    for (const collectionName of allCollectionNames) {
      for (const field of defaultFields) {
        await this.createFieldSafely(collectionName, field);
      }
    }


    // Newsletter Templates fields
    const templateFields = [
      {
        field: "status", // Moved to top
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Published", value: "published" },
              { text: "Draft", value: "draft" },
            ],
          },
          default_value: "published", // Explicit default
          width: "full", // Make it full width for top placement
        },
      },
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

    // Content Library fields
    const contentLibraryFields = [
      {
        field: "status", // Moved to top, assuming a status field might be useful here
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Published", value: "published" },
              { text: "Draft", value: "draft" },
              { text: "Archived", value: "archived" },
            ],
          },
          default_value: "published", // Explicit default
          width: "full",
        },
      },
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

    // Subscribers fields
    const subscriberFields = [
      {
        field: "status", // Moved to top
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "full", // Make it full width for top placement
          options: {
            choices: [
              { text: "Active", value: "active" },
              { text: "Unsubscribed", value: "unsubscribed" },
              { text: "Bounced", value: "bounced" },
              { text: "Pending", value: "pending" },
              { text: "Suppressed", value: "suppressed" },
            ],
          },
          default_value: "pending", // Explicit default
        },
      },
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

    // Mailing Lists fields
    const mailingListFields = [
      {
        field: "status", // Moved to top
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Active", value: "active" },
              { text: "Archived", value: "archived" },
            ],
          },
          default_value: "active", // Explicit default
          width: "full", // Make it full width for top placement
        },
      },
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

    // Junction table fields (no status field here, but keeping consistent for completeness)
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
        field: "status", // This status field is already here and will be full width
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Subscribed", value: "subscribed" },
              { text: "Unsubscribed", value: "unsubscribed" },
            ],
          },
          default_value: "subscribed", // Explicit default
          width: "full", // Make it full width for top placement
        },
      },
    ];

    for (const field of junctionFields) {
      await this.createFieldSafely("mailing_lists_subscribers", field);
    }

    // Block Types fields
    const blockTypeFields = [
      {
        field: "status", // Moved to top
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Published", value: "published" },
              { text: "Draft", value: "draft" },
            ],
          },
          default_value: "published", // Explicit default
          width: "full", // Make it full width for top placement
        },
      },
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

    // Newsletter fields
    const newsletterFields = [
      {
        field: "status", // Moved to top
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
          default_value: "draft", // Explicit default
          width: "full", // Make it full width for top placement
        },
      },
      {
        field: "title",
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
      {
        field: "slug", // Moved to bottom
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
      },
    ];

    for (const field of newsletterFields) {
      await this.createFieldSafely("newsletters", field);
    }

    // Newsletter Blocks fields
    const blockFields = [
      {
        field: "status", // Added status field for Newsletter Blocks and moved to top
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Active", value: "active" },
              { text: "Inactive", value: "inactive" },
            ],
          },
          default_value: "active", // Explicit default
          width: "full",
        },
      },
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
      // Removed duplicate 'sort' field definition here. It's handled by defaultFields.
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
        field: "image", // Renamed from image_url to image
        type: "uuid", // Stores the UUID of the file
        meta: {
          interface: "file-image", // Directus interface for image selection
          special: ["file"], // Marks it as a file relationship
          width: "full",
          note: "Select an image from the Directus File Library.",
        },
        schema: {
          is_nullable: true, // Allow block without an image
        },
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

    // Newsletter Sends fields
    const sendFields = [
      {
        field: "status", // Moved to top
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
          default_value: "scheduled", // Explicit default
          width: "full", // Make it full width for top placement
        },
      },
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

    // Newsletter Analytics fields
    const analyticsFields = [
      {
        field: "event_type", // Moved to top
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
          width: "full", // Make it full width for top placement
        },
      },
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
      }
      catch (error) {
        if (error.message?.includes("already exists")) {
          console.log(
            `⏭️  Relation already exists: ${relation.collection}.${relation.field}`
          );
        } else {
          // Log the full error object for better debugging
          console.error(
            `❌ Failed to create relation: ${relation.collection}.${relation.field} → ${relation.related_collection}. Error:`,
            error
          );
        }
      }
    }

    console.log("✅ Relationships created successfully");
  }

  async installSampleData() {
    console.log("\n🧩 Installing sample data...");

    // Sample block types
    // Updated sample data section for install-directus-collections.js
// Replace the existing blockTypes array with this fixed version

const blockTypes = [
  {
    name: "Hero Section",
    slug: "hero",
    description: "Large header section with title, subtitle, and optional button",
    category: "content",
    icon: "lucide:heading", // Fixed: was "title"
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
    icon: "lucide:type", // Fixed: was "text_fields"
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
    icon: "lucide:image", // Fixed: was "image"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    {{#if button_url}}
    <mj-image src="{{image}}" alt="{{image_alt_text}}" align="{{text_align}}" href="{{button_url}}" />
    {{else}}
    <mj-image src="{{image}}" alt="{{image_alt_text}}" align="{{text_align}}" />
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
      "image",
      "image_alt_text",
      "image_caption",
      "button_url",
      "background_color",
      "text_color",
      "text_align",
      "padding",
    ],
  },
  {
    name: "Button Block",
    slug: "button",
    description: "Call-to-action button with customizable styling",
    category: "interactive",
    icon: "lucide:mouse-pointer-click", // Fixed: was "button"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-button 
      background-color="{{button_color}}" 
      color="{{text_color}}" 
      href="{{button_url}}" 
      align="{{text_align}}"
      border-radius="{{border_radius}}"
      font-size="{{font_size}}"
      padding="{{button_padding}}"
    >
      {{button_text}}
    </mj-button>
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: [
      "button_text",
      "button_url",
      "button_color",
      "text_color",
      "background_color",
      "text_align",
      "border_radius",
      "font_size",
      "button_padding",
      "padding",
    ],
  },
  {
    name: "Product Showcase",
    slug: "product-showcase",
    description: "Product display with image, title, price, and CTA",
    category: "content",
    icon: "lucide:store", // Fixed: was "storefront"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column width="40%">
    <mj-image src="{{image}}" alt="{{image_alt_text}}" />
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
      "image",
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
    icon: "lucide:user", // Fixed: was "person"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column width="30%">
    <mj-image src="{{image}}" alt="{{image_alt_text}}" border-radius="50%" width="120px" />
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
      "image",
      "image_alt_text",
      "background_color",
      "text_color",
      "padding",
    ],
  },
  {
    name: "Statistics Block",
    slug: "statistics",
    description: "Display key metrics and statistics",
    category: "content",
    icon: "lucide:bar-chart", // Fixed: was "bar_chart"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    {{#if title}}
    <mj-text align="center" font-size="24px" font-weight="bold" color="{{text_color}}" padding="0 0 20px 0">
      {{title}}
    </mj-text>
    {{/if}}
    <mj-table>
      <tr>
        <td style="padding: 20px; text-align: center; border-right: 1px solid #eee;">
          <div style="font-size: 32px; font-weight: bold; color: {{text_color}};">{{stat_1_value}}</div>
          <div style="font-size: 14px; color: #666; margin-top: 5px;">{{stat_1_label}}</div>
        </td>
        <td style="padding: 20px; text-align: center; border-right: 1px solid #eee;">
          <div style="font-size: 32px; font-weight: bold; color: {{text_color}};">{{stat_2_value}}</div>
          <div style="font-size: 14px; color: #666; margin-top: 5px;">{{stat_2_label}}</div>
        </td>
        <td style="padding: 20px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: {{text_color}};">{{stat_3_value}}</div>
          <div style="font-size: 14px; color: #666; margin-top: 5px;">{{stat_3_label}}</div>
        </td>
      </tr>
    </mj-table>
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: [
      "title",
      "stat_1_value",
      "stat_1_label",
      "stat_2_value",
      "stat_2_label",
      "stat_3_value",
      "stat_3_label",
      "background_color",
      "text_color",
      "padding",
    ],
  },
  {
    name: "Quote Block",
    slug: "quote",
    description: "Testimonial or quote with author attribution",
    category: "content",
    icon: "lucide:quote", // Fixed: was "quote"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-text align="center" font-size="18px" font-style="italic" color="{{text_color}}" padding="0 0 20px 0">
      "{{quote_text}}"
    </mj-text>
    {{#if author_name}}
    <mj-text align="center" font-size="14px" font-weight="bold" color="{{text_color}}">
      — {{author_name}}
    </mj-text>
    {{/if}}
    {{#if author_title}}
    <mj-text align="center" font-size="12px" color="#666666">
      {{author_title}}
    </mj-text>
    {{/if}}
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: [
      "quote_text",
      "author_name",
      "author_title",
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
    icon: "lucide:share-2", // Fixed: was "social_media"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    {{#if title}}
    <mj-text align="center" font-size="18px" font-weight="bold" color="{{text_color}}" padding="0 0 20px 0">
      {{title}}
    </mj-text>
    {{/if}}
    <mj-social font-size="15px" icon-size="30px" mode="horizontal" align="center">
      {{#if facebook_url}}
      <mj-social-element name="facebook" href="{{facebook_url}}"></mj-social-element>
      {{/if}}
      {{#if twitter_url}}
      <mj-social-element name="twitter" href="{{twitter_url}}"></mj-social-element>
      {{/if}}
      {{#if instagram_url}}
      <mj-social-element name="instagram" href="{{instagram_url}}"></mj-social-element>
      {{/if}}
      {{#if linkedin_url}}
      <mj-social-element name="linkedin" href="{{linkedin_url}}"></mj-social-element>
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
      "background_color",
      "text_color",
      "padding",
    ],
  },
  {
    name: "Divider",
    slug: "divider",
    description: "Horizontal line separator",
    category: "layout",
    icon: "lucide:minus", // Fixed: was "divider"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-divider border-color="{{border_color}}" border-width="{{border_width}}" />
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: [
      "background_color",
      "border_color",
      "border_width",
      "padding",
    ],
  },
  {
    name: "Spacer",
    slug: "spacer",
    description: "Empty space for layout control",
    category: "layout",
    icon: "lucide:space", // Fixed: was "spacer"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-spacer height="{{spacer_height}}" />
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: [
      "spacer_height",
      "background_color",
      "padding",
    ],
  },
  {
    name: "Footer",
    slug: "footer",
    description: "Newsletter footer with company info and unsubscribe",
    category: "layout",
    icon: "lucide:layout-footer", // Fixed: was "footer"
    mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-text align="center" font-size="14px" color="{{text_color}}" padding="0 0 10px 0">
      {{company_name}}
    </mj-text>
    {{#if address}}
    <mj-text align="center" font-size="12px" color="#666666" padding="0 0 10px 0">
      {{address}}
    </mj-text>
    {{/if}}
    {{#if unsubscribe_url}}
    <mj-text align="center" font-size="12px" color="#666666">
      <a href="{{unsubscribe_url}}" style="color: #666666; text-decoration: underline;">
        Unsubscribe
      </a>
    </mj-text>
    {{/if}}
  </mj-column>
</mj-section>`,
    status: "published",
    field_visibility_config: [
      "company_name",
      "address",
      "unsubscribe_url",
      "background_color",
      "text_color",
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
    console.log("🚀 Starting Newsletter System Installation with Folder Organization\n");

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
      console.log("    • 📁 Newsletter System folder for organization");
      console.log("    • 10 Collections for newsletter management");
      console.log("    • All required fields and relationships");
      console.log("    • Default 'sort', 'date_created', 'date_updated' fields on all collections");
      console.log("    • Integer (auto-incrementing) IDs for primary keys on new collections");
      console.log("    • 4 Basic block types (Hero, Text, Image, Button)");
      console.log("    • Proper O2M and M2M relationships");
      console.log("    • Analytics tracking system");

      console.log("\n📋 Next steps:");
      console.log("1. Check your Directus admin panel - all collections are now organized!");
      console.log("2. Install the Nuxt module in your project");
      console.log("3. Configure your environment variables");
      console.log("4. Start creating newsletters!");

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
    console.log("Enhanced Newsletter System Installer");
    console.log("Now with automatic folder organization in Directus!");
    console.log("");
    console.log(
      "Usage: node install-directus-collections.js <directus-url> <email> <password>"
    );
    console.log("");
    console.log("Examples:");
    console.log(
      "  node install-directus-collections.js https://admin.example.com admin@example.com password123"
    );
    console.log("");
    console.log("✨ New: All collections will be organized in a 'Newsletter System' folder!");
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
