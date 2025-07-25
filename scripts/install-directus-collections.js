#!/usr/bin/env node

/**
 * Enhanced Directus Collections Installer for Newsletter System (Complete ES Module)
 * This script sets up all required collections, fields, relationships
 * and organizes them into a "Newsletter System" folder for better UX
 *
 * Updates:
 * - Converted to ES modules while preserving ALL original functionality
 * - Adds 'sort', 'date_created', 'date_updated' default fields to all collections
 * - 'date_created' is auto-populated with current timestamp
 * - 'id' fields are set back to integers (auto-incrementing)
 * - Relationship field types are adjusted to match integer IDs
 * - 'sort', 'date_created', 'date_updated' fields are now hidden on detail views
 * - 'status' field is moved to the top of each relevant collection's detail view
 * - 'image_url' field in 'newsletter_blocks' now uses Directus File Library interface (UUID) and is renamed to 'image'
 * - Added explicit default values for all 'status' fields
 * - Moved 'slug' field to the bottom of the 'newsletters' collection
 * - Complete field definitions for all collections
 * - Full relationship setup
 * - Sample data installation
 * - Analytics and subscriber management
 */

import {
  authentication,
  createCollection,
  createDirectus,
  createField,
  createFolder,
  createItems,
  createRelation,
  readCollections,
  readFolders,
  rest
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
    this.folderId = null;
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
      const folders = await this.directus.request(readFolders());
      const existingFolder = folders.find(f => f.name === this.folderName);

      if (existingFolder) {
        this.folderId = existingFolder.id;
        console.log(`✅ Folder "${this.folderName}" already exists`);
        return this.folderId;
      }

      // Create new folder
      const folder = await this.directus.request(
        createFolder({
          name: this.folderName,
        })
      );

      this.folderId = folder.id;
      console.log(`✅ Created folder: ${this.folderName}`);
      return this.folderId;
    } catch (error) {
      console.error(`❌ Failed to create folder: ${error.message}`);
      return null;
    }
  }

  async createCollectionSafely(collectionConfig, folderId = null) {
    try {
      if (folderId) {
        collectionConfig.meta.group = folderId;
      }
      await this.directus.request(createCollection(collectionConfig));
      console.log(`✅ Created collection: ${collectionConfig.collection}`);
      await this.delay(1000);
      return true;
    } catch (error) {
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate")
      ) {
        console.log(`⏭️  Collection ${collectionConfig.collection} already exists`);
        return true;
      }
      console.error(
        `❌ Failed to create collection ${collectionConfig.collection}:`,
        error.message
      );
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

  async createRelationSafely(relationConfig) {
    try {
      await this.directus.request(createRelation(relationConfig));
      console.log(`✅ Created relation: ${relationConfig.field} -> ${relationConfig.related_collection}`);
      await this.delay(500);
      return true;
    } catch (error) {
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate")
      ) {
        console.log(`⏭️  Relation ${relationConfig.field} already exists`);
        return true;
      }
      console.error(
        `❌ Failed to create relation ${relationConfig.field}:`,
        error.message
      );
      return false;
    }
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async installCollections() {
    console.log("\n📋 Creating newsletter collections...");

    const folderId = await this.createNewsletterFolder();

    const collections = [
      {
        collection: "newsletter_templates",
        meta: {
          accountability: "all",
          collection: "newsletter_templates",
          hidden: false,
          icon: "description",
          note: "Reusable newsletter templates",
          display_template: "{{name}}",
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
          icon: "library_books",
          note: "Reusable content snippets",
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
          display_template: "{{newsletter.title}} to {{mailing_list.name}} - {{status}}",
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
          options: {
            choices: [
              { text: "Active", value: "active" },
              { text: "Unsubscribed", value: "unsubscribed" },
              { text: "Bounced", value: "bounced" },
              { text: "Pending", value: "pending" },
            ],
          },
          default_value: "active", // Explicit default
          width: "full", // Make it full width for top placement
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
        meta: { interface: "input", width: "half" },
      },
      {
        field: "last_name",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "phone",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "company",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "title",
        type: "string",
        meta: { interface: "input", width: "half" },
      },
      {
        field: "source",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Website Signup", value: "website" },
              { text: "Manual Import", value: "import" },
              { text: "API", value: "api" },
              { text: "Social Media", value: "social" },
              { text: "Event", value: "event" },
              { text: "Referral", value: "referral" },
            ],
          },
        },
      },
      {
        field: "subscribed_date",
        type: "timestamp",
        meta: { interface: "datetime", width: "half" },
        schema: { default_value: "$NOW" },
      },
      {
        field: "unsubscribed_date",
        type: "timestamp",
        meta: { interface: "datetime", width: "half" },
      },
      {
        field: "double_opt_in",
        type: "boolean",
        meta: { interface: "boolean", width: "half" },
        schema: { default_value: false },
      },
      {
        field: "email_verified",
        type: "boolean",
        meta: { interface: "boolean", width: "half" },
        schema: { default_value: false },
      },
      {
        field: "engagement_score",
        type: "integer",
        meta: { interface: "input", width: "half", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "total_opens",
        type: "integer",
        meta: { interface: "input", width: "third", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "total_clicks",
        type: "integer",
        meta: { interface: "input", width: "third", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "last_engagement",
        type: "timestamp",
        meta: { interface: "datetime", width: "third", readonly: true },
      },
      { field: "tags", type: "csv", meta: { interface: "tags" } },
      {
        field: "notes",
        type: "text",
        meta: { interface: "input-multiline" },
      },
      {
        field: "custom_fields",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
      {
        field: "mailing_lists",
        type: "alias",
        meta: {
          interface: "list-m2m",
          special: ["m2m"],
        },
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
              { text: "Paused", value: "paused" },
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
        field: "type",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
          options: {
            choices: [
              { text: "Newsletter", value: "newsletter" },
              { text: "Promotional", value: "promotional" },
              { text: "Announcements", value: "announcements" },
              { text: "Updates", value: "updates" },
            ],
          },
        },
      },
      {
        field: "auto_subscribe",
        type: "boolean",
        meta: { interface: "boolean", width: "half" },
        schema: { default_value: false },
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
              { text: "Newsletter", value: "newsletter" },
              { text: "Promotional", value: "promotional" },
              { text: "Announcement", value: "announcement" },
              { text: "Update", value: "update" },
              { text: "Event", value: "event" },
            ],
          },
        },
      },
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
        meta: { interface: "datetime", width: "half" },
      },
      {
        field: "send_immediately",
        type: "boolean",
        meta: { interface: "boolean", width: "half" },
        schema: { default_value: false },
      },
      {
        field: "approval_status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          width: "half",
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

    // Newsletter Blocks fields - COMPLETE with all possible content fields
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
      {
        field: "content",
        type: "json",
        meta: {
          interface: "input-code",
          options: { language: "json" },
          readonly: true,
        },
      },
      
      // ALL CONTENT FIELDS - This is what enables rich text editing!
      {
        field: "text_content",
        type: "text",
        meta: {
          interface: "wysiwyg", // CRITICAL: This enables rich text editing!
          display_name: "Text Content",
          width: "full",
          note: "Rich text content with formatting options",
          options: {
            toolbar: [
              "bold", "italic", "underline", "strikethrough",
              "h1", "h2", "h3", "h4", "h5", "h6",
              "blockquote", "code_block",
              "ordered_list", "bullet_list",
              "link", "email", "image",
              "align_left", "align_center", "align_right"
            ]
          }
        }
      },
      
      // Basic text fields
      {
        field: "title",
        type: "string",
        meta: { interface: "input", display_name: "Title", width: "half" }
      },
      {
        field: "subtitle",
        type: "string",
        meta: { interface: "input", display_name: "Subtitle", width: "half" }
      },
      
      // Button fields
      {
        field: "button_text",
        type: "string",
        meta: { interface: "input", display_name: "Button Text", width: "half" }
      },
      {
        field: "button_url",
        type: "string",
        meta: { interface: "input", display_name: "Button URL", width: "half" }
      },
      
      // Color fields
      {
        field: "background_color",
        type: "string",
        meta: { 
          interface: "select-color", 
          display_name: "Background Color", 
          width: "half",
          options: { defaultValue: "#ffffff" }
        }
      },
      {
        field: "text_color",
        type: "string",
        meta: { 
          interface: "select-color", 
          display_name: "Text Color", 
          width: "half",
          options: { defaultValue: "#000000" }
        }
      },
      
      // Layout fields
      {
        field: "text_align",
        type: "string",
        meta: {
          interface: "select-dropdown",
          display_name: "Text Alignment",
          width: "half",
          options: {
            choices: [
              { text: "Left", value: "left" },
              { text: "Center", value: "center" },
              { text: "Right", value: "right" },
              { text: "Justify", value: "justify" }
            ]
          }
        }
      },
      {
        field: "padding",
        type: "string",
        meta: { 
          interface: "input", 
          display_name: "Padding", 
          width: "half",
          note: "CSS padding (e.g., '20px' or '20px 10px')"
        }
      },
      {
        field: "font_size",
        type: "string",
        meta: { 
          interface: "input", 
          display_name: "Font Size", 
          width: "half",
          note: "CSS font size (e.g., '16px', '1.2em')"
        }
      },
      
      // Image fields
      {
        field: "image",
        type: "uuid",
        meta: { 
          interface: "file-image", 
          display_name: "Image", 
          width: "half" 
        }
      },
      {
        field: "image_alt_text",
        type: "string",
        meta: { 
          interface: "input", 
          display_name: "Image Alt Text", 
          width: "half" 
        }
      },
      {
        field: "image_caption",
        type: "string",
        meta: { 
          interface: "input", 
          display_name: "Image Caption", 
          width: "full" 
        }
      },
      
      // Advanced fields for complex blocks
      {
        field: "price",
        type: "string",
        meta: { interface: "input", display_name: "Price", width: "half" }
      },
      
      // Statistics fields
      {
        field: "stat1_number",
        type: "string",
        meta: { interface: "input", display_name: "Stat 1 Number", width: "quarter" }
      },
      {
        field: "stat1_label",
        type: "string",
        meta: { interface: "input", display_name: "Stat 1 Label", width: "quarter" }
      },
      {
        field: "stat2_number",
        type: "string",
        meta: { interface: "input", display_name: "Stat 2 Number", width: "quarter" }
      },
      {
        field: "stat2_label",
        type: "string",
        meta: { interface: "input", display_name: "Stat 2 Label", width: "quarter" }
      },
      {
        field: "stat3_number",
        type: "string",
        meta: { interface: "input", display_name: "Stat 3 Number", width: "quarter" }
      },
      {
        field: "stat3_label",
        type: "string",
        meta: { interface: "input", display_name: "Stat 3 Label", width: "quarter" }
      },
      {
        field: "stat4_number",
        type: "string",
        meta: { interface: "input", display_name: "Stat 4 Number", width: "quarter" }
      },
      {
        field: "stat4_label",
        type: "string",
        meta: { interface: "input", display_name: "Stat 4 Label", width: "quarter" }
      },
      
      // Social media fields
      {
        field: "facebook_url",
        type: "string",
        meta: { interface: "input", display_name: "Facebook URL", width: "half" }
      },
      {
        field: "twitter_url",
        type: "string",
        meta: { interface: "input", display_name: "Twitter URL", width: "half" }
      },
      {
        field: "instagram_url",
        type: "string",
        meta: { interface: "input", display_name: "Instagram URL", width: "half" }
      },
      {
        field: "linkedin_url",
        type: "string",
        meta: { interface: "input", display_name: "LinkedIn URL", width: "half" }
      },
      {
        field: "youtube_url",
        type: "string",
        meta: { interface: "input", display_name: "YouTube URL", width: "half" }
      },
      
      // Event fields
      {
        field: "event_date",
        type: "string",
        meta: { interface: "input", display_name: "Event Date", width: "third" }
      },
      {
        field: "event_time",
        type: "string",
        meta: { interface: "input", display_name: "Event Time", width: "third" }
      },
      {
        field: "event_location",
        type: "string",
        meta: { interface: "input", display_name: "Event Location", width: "third" }
      },
      
      // Testimonial fields
      {
        field: "testimonial_text",
        type: "text",
        meta: { interface: "input-multiline", display_name: "Testimonial Text", width: "full" }
      },
      {
        field: "testimonial_author",
        type: "string",
        meta: { interface: "input", display_name: "Author", width: "third" }
      },
      {
        field: "author_title",
        type: "string",
        meta: { interface: "input", display_name: "Author Title", width: "third" }
      },
      {
        field: "author_company",
        type: "string",
        meta: { interface: "input", display_name: "Author Company", width: "third" }
      },
      {
        field: "author_avatar",
        type: "uuid",
        meta: { interface: "file-image", display_name: "Author Avatar", width: "half" }
      },
      
      // Column layout fields
      {
        field: "column1_title",
        type: "string",
        meta: { interface: "input", display_name: "Column 1 Title", width: "third" }
      },
      {
        field: "column1_content",
        type: "text",
        meta: { interface: "input-multiline", display_name: "Column 1 Content", width: "third" }
      },
      {
        field: "column2_title",
        type: "string",
        meta: { interface: "input", display_name: "Column 2 Title", width: "third" }
      },
      {
        field: "column2_content",
        type: "text",
        meta: { interface: "input-multiline", display_name: "Column 2 Content", width: "third" }
      },
      {
        field: "column3_title",
        type: "string",
        meta: { interface: "input", display_name: "Column 3 Title", width: "third" }
      },
      {
        field: "column3_content",
        type: "text",
        meta: { interface: "input-multiline", display_name: "Column 3 Content", width: "third" }
      },
      
      // CTA fields
      {
        field: "cta_title",
        type: "string",
        meta: { interface: "input", display_name: "CTA Title", width: "half" }
      },
      {
        field: "cta_subtitle",
        type: "text",
        meta: { interface: "input-multiline", display_name: "CTA Subtitle", width: "half" }
      },
      {
        field: "primary_button_text",
        type: "string",
        meta: { interface: "input", display_name: "Primary Button Text", width: "half" }
      },
      {
        field: "primary_button_url",
        type: "string",
        meta: { interface: "input", display_name: "Primary Button URL", width: "half" }
      },
      {
        field: "secondary_button_text",
        type: "string",
        meta: { interface: "input", display_name: "Secondary Button Text", width: "half" }
      },
      {
        field: "secondary_button_url",
        type: "string",
        meta: { interface: "input", display_name: "Secondary Button URL", width: "half" }
      },
      
      // Progress bar fields
      {
        field: "progress_label",
        type: "string",
        meta: { interface: "input", display_name: "Progress Label", width: "half" }
      },
      {
        field: "progress_percentage",
        type: "integer",
        meta: { 
          interface: "slider", 
          display_name: "Progress Percentage", 
          width: "half",
          options: { min: 0, max: 100, step: 1 }
        }
      },
      
      // Feature list fields
      {
        field: "feature1",
        type: "string",
        meta: { interface: "input", display_name: "Feature 1", width: "half" }
      },
      {
        field: "feature2",
        type: "string",
        meta: { interface: "input", display_name: "Feature 2", width: "half" }
      },
      {
        field: "feature3",
        type: "string",
        meta: { interface: "input", display_name: "Feature 3", width: "half" }
      },
      {
        field: "feature4",
        type: "string",
        meta: { interface: "input", display_name: "Feature 4", width: "half" }
      },
      {
        field: "feature5",
        type: "string",
        meta: { interface: "input", display_name: "Feature 5", width: "half" }
      },
      {
        field: "feature6",
        type: "string",
        meta: { interface: "input", display_name: "Feature 6", width: "half" }
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
        type: "decimal",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "click_rate",
        type: "decimal",
        meta: { interface: "input", readonly: true },
        schema: { default_value: 0 },
      },
      {
        field: "sendgrid_message_id",
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
        field: "event_type",
        type: "string",
        meta: {
          interface: "select-dropdown",
          required: true,
          options: {
            choices: [
              { text: "Delivered", value: "delivered" },
              { text: "Opened", value: "opened" },
              { text: "Clicked", value: "clicked" },
              { text: "Bounced", value: "bounced" },
              { text: "Spam Report", value: "spamreport" },
              { text: "Unsubscribed", value: "unsubscribe" },
              { text: "Dropped", value: "dropped" },
            ],
          },
        },
      },
      {
        field: "email",
        type: "string",
        meta: { interface: "input", required: true },
      },
      {
        field: "timestamp",
        type: "timestamp",
        meta: { interface: "datetime", required: true },
        schema: { default_value: "$NOW" },
      },
      {
        field: "newsletter_send_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o" },
      },
      {
        field: "subscriber_id",
        type: "integer",
        meta: { interface: "select-dropdown-m2o" },
      },
      {
        field: "sendgrid_event_id",
        type: "string",
        meta: { interface: "input" },
      },
      {
        field: "user_agent",
        type: "string",
        meta: { interface: "input" },
      },
      {
        field: "ip_address",
        type: "string",
        meta: { interface: "input" },
      },
      {
        field: "url",
        type: "string",
        meta: { interface: "input" },
      },
      {
        field: "event_data",
        type: "json",
        meta: { interface: "input-code", options: { language: "json" } },
      },
    ];

    for (const field of analyticsFields) {
      await this.createFieldSafely("newsletter_analytics", field);
    }

    console.log("✅ All fields created successfully");
  }

  async installRelations() {
    console.log("\n🔗 Setting up relationships...");

    const relations = [
      // Mailing Lists <-> Subscribers (Many-to-Many)
      {
        collection: "mailing_lists_subscribers",
        field: "mailing_lists_id",
        related_collection: "mailing_lists",
        meta: {
          many_collection: "mailing_lists_subscribers",
          many_field: "mailing_lists_id",
          one_collection: "mailing_lists",
          one_field: "subscribers",
          junction_field: "subscribers_id",
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
          one_field: "mailing_lists",
          junction_field: "mailing_lists_id",
        },
      },
      
      // Newsletter Blocks -> Newsletter (Many-to-One)
      {
        collection: "newsletter_blocks",
        field: "newsletter_id",
        related_collection: "newsletters",
        meta: {
          many_collection: "newsletter_blocks",
          many_field: "newsletter_id",
          one_collection: "newsletters",
          one_field: "blocks",
        },
      },
      
      // Newsletter Blocks -> Block Types (Many-to-One)
      {
        collection: "newsletter_blocks",
        field: "block_type",
        related_collection: "block_types",
        meta: {
          many_collection: "newsletter_blocks",
          many_field: "block_type",
          one_collection: "block_types",
          one_field: null,
        },
      },
      
      // Newsletter Sends -> Newsletter (Many-to-One)
      {
        collection: "newsletter_sends",
        field: "newsletter_id",
        related_collection: "newsletters",
        meta: {
          many_collection: "newsletter_sends",
          many_field: "newsletter_id",
          one_collection: "newsletters",
          one_field: null,
        },
      },
      
      // Newsletter Sends -> Mailing List (Many-to-One)
      {
        collection: "newsletter_sends",
        field: "mailing_list_id",
        related_collection: "mailing_lists",
        meta: {
          many_collection: "newsletter_sends",
          many_field: "mailing_list_id",
          one_collection: "mailing_lists",
          one_field: null,
        },
      },
      
      // Newsletter Analytics -> Newsletter Send (Many-to-One)
      {
        collection: "newsletter_analytics",
        field: "newsletter_send_id",
        related_collection: "newsletter_sends",
        meta: {
          many_collection: "newsletter_analytics",
          many_field: "newsletter_send_id",
          one_collection: "newsletter_sends",
          one_field: null,
        },
      },
      
      // Newsletter Analytics -> Subscriber (Many-to-One)
      {
        collection: "newsletter_analytics",
        field: "subscriber_id",
        related_collection: "subscribers",
        meta: {
          many_collection: "newsletter_analytics",
          many_field: "subscriber_id",
          one_collection: "subscribers",
          one_field: null,
        },
      },
    ];

    for (const relation of relations) {
      await this.createRelationSafely(relation);
    }

    console.log("✅ All relationships created successfully");
  }

  async installSampleData() {
    console.log("\n🎨 Installing sample data...");

    // Create block types with your exact configuration
    const blockTypes = [
      {
        name: "Hero Section",
        slug: "hero",
        description: "Large header section with title, subtitle, and optional button",
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
        field_visibility_config: [
          "title",
          "subtitle",
          "button_text",
          "button_url",
          "background_color",
          "text_color",
          "text_align",
          "padding"
        ],
        icon: "lucide:heading",
        category: "content",
        status: "published"
      },
      {
        name: "Text Block",
        slug: "text",
        description: "Simple text content with formatting options",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-text align="{{text_align}}" font-size="{{font_size}}" color="{{text_color}}">
      {{{text_content}}}
    </mj-text>
  </mj-column>
</mj-section>`,
        field_visibility_config: [
          "text_content",
          "background_color",
          "text_color",
          "text_align",
          "padding",
          "font_size"
        ],
        icon: "lucide:type",
        category: "content",
        status: "published"
      },
      {
        name: "Image Block",
        slug: "image",
        description: "Image with optional caption and link",
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
        field_visibility_config: [
          "image",
          "image_alt_text",
          "image_caption",
          "button_url",
          "background_color",
          "text_align",
          "padding"
        ],
        icon: "lucide:image",
        category: "media",
        status: "published"
      },
      {
        name: "Button",
        slug: "button",
        description: "Call-to-action button",
        mjml_template: `<mj-section background-color="{{background_color}}" padding="{{padding}}">
  <mj-column>
    <mj-button background-color="#007bff" color="#ffffff" href="{{button_url}}" align="{{text_align}}">
      {{button_text}}
    </mj-button>
  </mj-column>
</mj-section>`,
        field_visibility_config: [
          "button_text",
          "button_url",
          "background_color",
          "text_align",
          "padding"
        ],
        icon: "lucide:mouse-pointer-click",
        category: "interactive",
        status: "published"
      }
    ];

    try {
      await this.directus.request(createItems("block_types", blockTypes));
      console.log(`✅ Created ${blockTypes.length} block types`);
    } catch (error) {
      console.error("❌ Failed to create block types:", error.message);
    }

    // Create sample mailing list
    const mailingLists = [
      {
        name: "General Newsletter",
        description: "Main newsletter for all subscribers",
        type: "newsletter",
        status: "active",
        subscriber_count: 0,
        auto_subscribe: true,
      }
    ];

    try {
      await this.directus.request(createItems("mailing_lists", mailingLists));
      console.log("✅ Created sample mailing list");
    } catch (error) {
      console.error("❌ Failed to create mailing list:", error.message);
    }

    console.log("✅ Sample data installed successfully");
  }

  async run() {
    const authenticated = await this.authenticate();
    if (!authenticated) {
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
      console.log("    • Rich text fields configured for content editing");

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