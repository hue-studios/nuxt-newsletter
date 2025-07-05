// server/api/newsletter/compile-mjml.post.ts
import mjml2html from "mjml";
import Handlebars from "handlebars";
import {
  createDirectus,
  rest,
  readItem,
  updateItem,
  readItems,
} from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);

    const { newsletter_id } = body;

    if (!newsletter_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Newsletter ID is required",
      });
    }

    // Initialize Directus client
    const directus = createDirectus(config.public.directusUrl as string).with(
      rest()
    );

    // Fetch newsletter with blocks and block types
    const newsletter = await directus.request(
      readItem("newsletters", newsletter_id, {
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
          "blocks.block_type.id",
          "blocks.block_type.name",
          "blocks.block_type.slug",
          "blocks.block_type.mjml_template",
          "blocks.block_type.field_visibility_config",
        ],
      })
    );

    if (!newsletter) {
      throw createError({
        statusCode: 404,
        statusMessage: "Newsletter not found",
      });
    }

    // Sort blocks by sort order
    const sortedBlocks =
      newsletter.blocks?.sort((a: any, b: any) => a.sort - b.sort) || [];

    // Compile each block with MJML
    let compiledBlocks = "";

    for (const block of sortedBlocks) {
      if (!block.block_type?.mjml_template) {
        console.warn(`Block ${block.id} has no MJML template`);
        continue;
      }

      try {
        // Prepare block data for Handlebars
        const blockData = {
          // Content fields
          title: block.title || "",
          subtitle: block.subtitle || "",
          text_content: block.text_content || "",

          // Image fields
          image_url: block.image_url || "",
          image_alt_text: block.image_alt_text || "",
          image_caption: block.image_caption || "",

          // Button fields
          button_text: block.button_text || "",
          button_url: block.button_url || "",

          // Styling fields
          background_color: block.background_color || "#ffffff",
          text_color: block.text_color || "#333333",
          text_align: block.text_align || "center",
          padding: block.padding || "20px 0",
          font_size: block.font_size || "14px",

          // Newsletter-level variables
          newsletter_title: newsletter.title,
          newsletter_from: newsletter.from_name,
          unsubscribe_url: "{{unsubscribe_url}}",
          preferences_url: "{{preferences_url}}",
          subscriber_name: "{{subscriber_name}}",
          company_name: "{{company_name}}",
        };

        // Compile Handlebars template
        const template = Handlebars.compile(block.block_type.mjml_template);
        const blockMjml = template(blockData);

        // Store compiled MJML for this block
        await directus.request(
          updateItem("newsletter_blocks", block.id, {
            mjml_output: blockMjml,
          })
        );

        compiledBlocks += blockMjml + "\n";
      } catch (error) {
        console.error(`Error compiling block ${block.id}:`, error);
        throw createError({
          statusCode: 500,
          statusMessage: `Error compiling block ${block.id}: ${error.message}`,
        });
      }
    }

    // Build complete MJML document
    const completeMjml = `
      <mjml>
        <mj-head>
          <mj-title>${newsletter.subject_line || newsletter.title}</mj-title>
          <mj-preview>${newsletter.preview_text || ""}</mj-preview>
          <mj-attributes>
            <mj-all font-family="system-ui, -apple-system, sans-serif" />
            <mj-text font-size="14px" color="#333333" line-height="1.6" />
            <mj-section background-color="#ffffff" />
          </mj-attributes>
          <mj-style inline="inline">
            .newsletter-content { max-width: 600px; }
            .button { border-radius: 6px; }
          </mj-style>
        </mj-head>
        <mj-body>
          ${compiledBlocks}
          
          <!-- Footer -->
          <mj-section background-color="#f8f9fa" padding="40px 20px">
            <mj-column>
              <mj-text align="center" font-size="12px" color="#666666">
                <p>You received this email because you subscribed to our newsletter.</p>
                <p>
                  <a href="{{unsubscribe_url}}" style="color: #666666;">Unsubscribe</a> |
                  <a href="{{preferences_url}}" style="color: #666666;">Update Preferences</a>
                </p>
                <p>© ${new Date().getFullYear()} ${
      newsletter.from_name || "Newsletter"
    }. All rights reserved.</p>
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;

    // Compile MJML to HTML
    const mjmlResult = mjml2html(completeMjml, {
      validationLevel: "soft",
      minify: true,
    });

    if (mjmlResult.errors.length > 0) {
      console.warn("MJML compilation warnings:", mjmlResult.errors);
    }

    // Update newsletter with compiled content
    await directus.request(
      updateItem("newsletters", newsletter_id, {
        compiled_mjml: completeMjml,
        compiled_html: mjmlResult.html,
      })
    );

    return {
      success: true,
      message: "MJML compiled successfully",
      warnings: mjmlResult.errors.length > 0 ? mjmlResult.errors : null,
      blocks_compiled: sortedBlocks.length,
      html_size: mjmlResult.html.length,
    };
  } catch (error: any) {
    console.error("MJML compilation error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "MJML compilation failed",
    });
  }
});
