// src/runtime/server/utils/mjml.ts
import mjml2html from "mjml";
import Handlebars from "handlebars";
import type { Newsletter, NewsletterBlock } from "~/types/newsletter";

export class MJMLCompiler {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  compileNewsletter(
    newsletter: Newsletter,
    blocks: NewsletterBlock[]
  ): { html: string; mjml: string; warnings: any[] } {
    const sortedBlocks = blocks.sort((a, b) => a.sort - b.sort);
    let compiledBlocks = "";

    // Compile each block
    for (const block of sortedBlocks) {
      if (!block.block_type?.mjml_template) {
        console.warn(`Block ${block.id} has no MJML template`);
        continue;
      }

      const blockData = this.prepareBlockData(block, newsletter);
      const template = this.handlebars.compile(block.block_type.mjml_template);
      const blockMjml = template(blockData);

      compiledBlocks += blockMjml + "\n";
    }

    // Build complete MJML document
    const completeMjml = this.buildMJMLDocument(newsletter, compiledBlocks);

    // Compile MJML to HTML
    const mjmlResult = mjml2html(completeMjml, {
      validationLevel: "soft",
      minify: true,
    });

    return {
      html: mjmlResult.html,
      mjml: completeMjml,
      warnings: mjmlResult.errors,
    };
  }

  private prepareBlockData(block: NewsletterBlock, newsletter: Newsletter) {
    return {
      // Block content
      title: block.title || "",
      subtitle: block.subtitle || "",
      text_content: block.text_content || "",
      image_url: block.image_url || "",
      image_alt_text: block.image_alt_text || "",
      image_caption: block.image_caption || "",
      button_text: block.button_text || "",
      button_url: block.button_url || "",

      // Styling
      background_color: block.background_color || "#ffffff",
      text_color: block.text_color || "#333333",
      text_align: block.text_align || "center",
      padding: block.padding || "20px 0",
      font_size: block.font_size || "14px",

      // Custom fields
      ...(block.content || {}),

      // Newsletter-level variables
      newsletter_title: newsletter.title,
      newsletter_from: newsletter.from_name,
      unsubscribe_url: "{{unsubscribe_url}}",
      preferences_url: "{{preferences_url}}",
      subscriber_name: "{{subscriber_name}}",
      company_name: "{{company_name}}",
    };
  }

  private buildMJMLDocument(newsletter: Newsletter, blocks: string): string {
    return `
      <mjml>
        <mj-head>
          <mj-title>${newsletter.subject_line || newsletter.title}</mj-title>
          <mj-preview>${newsletter.preview_text || ""}</mj-preview>
          <mj-attributes>
            <mj-all font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" />
            <mj-text font-size="14px" color="#333333" line-height="1.6" />
            <mj-section background-color="#ffffff" />
          </mj-attributes>
          <mj-style inline="inline">
            .newsletter-content { max-width: 600px; }
            .button { border-radius: 6px; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </mj-style>
        </mj-head>
        <mj-body background-color="#f8f9fa">
          ${blocks}
          
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
  }

  private registerHelpers() {
    // Date formatting helper
    this.handlebars.registerHelper(
      "formatDate",
      (date: string, format: string = "MMMM D, YYYY") => {
        if (!date) return "";
        return new Date(date).toLocaleDateString();
      }
    );

    // Conditional helper
    this.handlebars.registerHelper(
      "ifEquals",
      function (arg1: any, arg2: any, options: any) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
      }
    );

    // Truncate helper
    this.handlebars.registerHelper(
      "truncate",
      (str: string, length: number = 50) => {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + "...";
      }
    );

    // URL helper
    this.handlebars.registerHelper("url", (path: string) => {
      const baseUrl =
        process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
      return `${baseUrl}${path.startsWith("/") ? path : "/" + path}`;
    });
  }
}
