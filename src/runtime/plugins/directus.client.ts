// src/runtime/plugins/directus.client.ts
import { defineNuxtPlugin, useRuntimeConfig } from "#imports";
import {
  createDirectus,
  rest,
  authentication,
  readItem,
  readItems,
  createItem,
  createItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,
  readMe,
} from "@directus/sdk";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  // Create Directus instance with authentication support
  const directus = createDirectus(config.public.newsletter.directusUrl)
    .with(rest())
    .with(authentication());

  // Enhanced directus helpers with batch operations
  const directusHelpers = {
    // Individual operations
    async read(collection: string, id: string | number, query?: any) {
      try {
        const response = await directus.request(
          readItem(collection, id, query)
        );
        return { success: true, item: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async create(collection: string, data: any) {
      try {
        const response = await directus.request(createItem(collection, data));
        return { success: true, item: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async update(collection: string, id: string | number, data: any) {
      try {
        const response = await directus.request(
          updateItem(collection, id, data)
        );
        return { success: true, item: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async delete(collection: string, id: string | number) {
      try {
        await directus.request(deleteItem(collection, id));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async readItems(collection: string, query?: any) {
      try {
        const response = await directus.request(readItems(collection, query));
        return { success: true, items: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    // Batch operations
    async batchCreate(collection: string, items: any[]) {
      try {
        const response = await directus.request(createItems(collection, items));
        return { success: true, items: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async batchUpdate(collection: string, items: any[]) {
      try {
        const response = await directus.request(updateItems(collection, items));
        return { success: true, items: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async batchDelete(collection: string, ids: (string | number)[]) {
      try {
        await directus.request(deleteItems(collection, ids));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    // Newsletter-specific operations
    newsletters: {
      async list(query?: any) {
        return directusHelpers.readItems("newsletters", {
          fields: [
            "*",
            "blocks.id",
            "blocks.sort",
            "blocks.block_type.name",
            "blocks.block_type.slug",
            "blocks.block_type.icon",
            "template_id.name",
            "mailing_list_id.name",
          ],
          sort: ["-updated_at"],
          ...query,
        });
      },

      async get(id: string | number) {
        return directusHelpers.read("newsletters", id, {
          fields: [
            "*",
            "blocks.id",
            "blocks.sort",
            "blocks.title",
            "blocks.subtitle",
            "blocks.text_content",
            "blocks.image_url",
            "blocks.image_alt_text",
            "blocks.image_caption",
            "blocks.button_text",
            "blocks.button_url",
            "blocks.background_color",
            "blocks.text_color",
            "blocks.text_align",
            "blocks.padding",
            "blocks.font_size",
            "blocks.content",
            "blocks.mjml_output",
            "blocks.block_type.name",
            "blocks.block_type.slug",
            "blocks.block_type.description",
            "blocks.block_type.mjml_template",
            "blocks.block_type.icon",
            "blocks.block_type.category",
            "blocks.block_type.field_visibility_config",
            "template_id.name",
            "template_id.category",
            "mailing_list_id.name",
          ],
        });
      },

      async create(data: any) {
        return directusHelpers.create("newsletters", data);
      },

      async update(id: string | number, data: any) {
        return directusHelpers.update("newsletters", id, data);
      },

      async delete(id: string | number) {
        return directusHelpers.delete("newsletters", id);
      },
    },

    // Block operations
    blocks: {
      async list(newsletterId: string | number) {
        return directusHelpers.readItems("newsletter_blocks", {
          filter: { newsletter_id: { _eq: newsletterId } },
          sort: ["sort"],
        });
      },

      async create(data: any) {
        return directusHelpers.create("newsletter_blocks", data);
      },

      async update(id: string | number, data: any) {
        return directusHelpers.update("newsletter_blocks", id, data);
      },

      async delete(id: string | number) {
        return directusHelpers.delete("newsletter_blocks", id);
      },

      async batchUpdate(blocks: any[]) {
        return directusHelpers.batchUpdate("newsletter_blocks", blocks);
      },
    },

    // Authentication
    async login(email: string, password: string) {
      try {
        const response = await directus.login(email, password);
        return { success: true, user: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async logout() {
      try {
        await directus.logout();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async getCurrentUser() {
      try {
        const response = await directus.request(readMe());
        return { success: true, user: response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async testConnection() {
      try {
        await directus.request(readItems("newsletters", { limit: 1 }));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  };

  return {
    provide: {
      directus,
      directusHelpers,
    },
  };
});
