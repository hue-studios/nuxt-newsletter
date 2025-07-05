// src/runtime/server/utils/mjml.ts
import mjml from "mjml";
import Handlebars from "handlebars";
import { sanitizeHtml } from "~/utils/security/sanitization";

export interface MJMLCompileOptions {
  validationLevel?: "strict" | "soft" | "skip";
  beautify?: boolean;
  minify?: boolean;
  fonts?: Record<string, string>;
  keepComments?: boolean;
  preprocessing?: boolean;
}

export interface MJMLCompileResult {
  html: string;
  errors: Array<{
    line: number;
    message: string;
    tagName: string;
    formattedMessage: string;
  }>;
  warnings: string[];
  metadata: {
    compilationTime: number;
    htmlSize: number;
    mjmlSize: number;
    blocksProcessed: number;
  };
}

export interface BlockData {
  id: string | number;
  type: string;
  data: Record<string, any>;
  template: string;
  sort: number;
}

// MJML Service for newsletter compilation
export class MJMLService {
  private handlebars: typeof Handlebars;
  private defaultOptions: MJMLCompileOptions;

  constructor(options: MJMLCompileOptions = {}) {
    this.defaultOptions = {
      validationLevel: "soft",
      beautify: true,
      minify: false,
      keepComments: false,
      preprocessing: true,
      fonts: {
        Inter:
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
        Roboto:
          "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
      },
      ...options,
    };

    this.handlebars = Handlebars.create();
    this.registerDefaultHelpers();
  }

  // Compile newsletter blocks to MJML and then to HTML
  async compileNewsletter(
    blocks: BlockData[],
    newsletterData: Record<string, any> = {},
    options: MJMLCompileOptions = {}
  ): Promise<MJMLCompileResult> {
    const startTime = Date.now();
    const compileOptions = { ...this.defaultOptions, ...options };

    try {
      // Sort blocks by sort order
      const sortedBlocks = [...blocks].sort(
        (a, b) => (a.sort || 0) - (b.sort || 0)
      );

      // Build MJML structure
      const mjmlContent = this.buildMJMLStructure(sortedBlocks, newsletterData);

      // Compile MJML to HTML
      const mjmlResult = mjml(mjmlContent, {
        validationLevel: compileOptions.validationLevel,
        beautify: compileOptions.beautify,
        minify: compileOptions.minify,
        keepComments: compileOptions.keepComments,
        fonts: compileOptions.fonts,
      });

      const compilationTime = Date.now() - startTime;

      // Process warnings
      const warnings: string[] = [];
      if (mjmlResult.errors.length > 0) {
        mjmlResult.errors.forEach((error) => {
          warnings.push(`MJML Error: ${error.message} (Line ${error.line})`);
        });
      }

      return {
        html: mjmlResult.html,
        errors: mjmlResult.errors,
        warnings,
        metadata: {
          compilationTime,
          htmlSize: mjmlResult.html.length,
          mjmlSize: mjmlContent.length,
          blocksProcessed: sortedBlocks.length,
        },
      };
    } catch (error: any) {
      throw new Error(`MJML compilation failed: ${error.message}`);
    }
  }

  // Build the complete MJML structure
  private buildMJMLStructure(
    blocks: BlockData[],
    newsletterData: Record<string, any>
  ): string {
    const {
      title = "Newsletter",
      subject = title,
      previewText = "",
      fromName = "Newsletter",
      fromEmail = "newsletter@example.com",
      backgroundColor = "#ffffff",
      fontFamily = "Inter, Arial, sans-serif",
      primaryColor = "#2563eb",
      textColor = "#374151",
    } = newsletterData;

    // Build head section
    const head = this.buildMJMLHead(title, subject, previewText, {
      backgroundColor,
      fontFamily,
      primaryColor,
      textColor,
    });

    // Process blocks into MJML sections
    const bodyContent = blocks
      .map((block) => this.processBlock(block, newsletterData))
      .join("\n");

    // Add footer
    const footer = this.buildFooter(fromName, fromEmail);

    return `
      <mjml>
        ${head}
        <mj-body background-color="${backgroundColor}">
          ${bodyContent}
          ${footer}
        </mj-body>
      </mjml>
    `;
  }

  // Build MJML head section
  private buildMJMLHead(
    title: string,
    subject: string,
    previewText: string,
    styles: any
  ): string {
    const fontLinks = Object.values(this.defaultOptions.fonts || {})
      .map((url) => `<link href="${url}" rel="stylesheet">`)
      .join("\n");

    return `
      <mj-head>
        <mj-title>${this.escapeHtml(title)}</mj-title>
        <mj-preview>${this.escapeHtml(previewText || subject)}</mj-preview>
        
        <!-- Font imports -->
        <mj-raw>
          ${fontLinks}
        </mj-raw>
        
        <!-- Default attributes -->
        <mj-attributes>
          <mj-all font-family="${styles.fontFamily}" />
          <mj-text font-size="16px" color="${
            styles.textColor
          }" line-height="1.6" />
          <mj-section padding="20px 0" />
          <mj-column padding="0 20px" />
          <mj-button background-color="${
            styles.primaryColor
          }" border-radius="6px" />
        </mj-attributes>
        
        <!-- Custom styles -->
        <mj-style>
          .newsletter-wrapper { max-width: 600px; margin: 0 auto; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .rounded { border-radius: 8px; }
          .shadow { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .link { color: ${styles.primaryColor}; text-decoration: none; }
          .link:hover { text-decoration: underline; }
          .footer-link { color: #9ca3af; font-size: 14px; text-decoration: none; }
          .footer-link:hover { color: #6b7280; }
        </mj-style>
        
        <!-- Media queries -->
        <mj-style inline="inline">
          @media only screen and (max-width: 600px) {
            .mobile-hide { display: none !important; }
            .mobile-center { text-align: center !important; }
            .mobile-full { width: 100% !important; }
          }
        </mj-style>
      </mj-head>
    `;
  }

  // Process individual block
  private processBlock(
    block: BlockData,
    newsletterData: Record<string, any>
  ): string {
    try {
      // Prepare template data
      const templateData = {
        ...block.data,
        block: {
          id: block.id,
          type: block.type,
          sort: block.sort,
        },
        newsletter: newsletterData,
        // Add utility functions
        utils: {
          formatDate: (date: string) => new Date(date).toLocaleDateString(),
          formatCurrency: (amount: number, currency = "USD") =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(amount),
          truncate: (text: string, length = 100) =>
            text.length > length ? text.substring(0, length) + "..." : text,
        },
      };

      // Compile template
      const template = this.handlebars.compile(block.template);
      const compiledMjml = template(templateData);

      // Sanitize if needed
      return this.sanitizeBlockContent(compiledMjml);
    } catch (error: any) {
      console.error(`Error processing block ${block.id}:`, error);
      return `<!-- Block ${block.id} error: ${error.message} -->`;
    }
  }

  // Build newsletter footer
  private buildFooter(fromName: string, fromEmail: string): string {
    return `
      <mj-section background-color="#f9fafb" padding="40px 20px">
        <mj-column>
          <mj-divider border-color="#e5e7eb" border-width="1px" />
          
          <mj-text align="center" font-size="14px" color="#6b7280" padding="20px 0 10px">
            <p style="margin: 0;">
              You received this email because you're subscribed to our newsletter.
            </p>
          </mj-text>
          
          <mj-text align="center" font-size="14px" color="#6b7280" padding="0">
            <p style="margin: 0;">
              <a href="{{unsubscribe_url}}" class="footer-link">Unsubscribe</a> | 
              <a href="{{preferences_url}}" class="footer-link">Update preferences</a>
            </p>
          </mj-text>
          
          <mj-text align="center" font-size="12px" color="#9ca3af" padding="20px 0 0">
            <p style="margin: 0;">
              <strong>${this.escapeHtml(fromName)}</strong><br>
              ${this.escapeHtml(fromEmail)}
            </p>
          </mj-text>
        </mj-column>
      </mj-section>
    `;
  }

  // Register default Handlebars helpers
  private registerDefaultHelpers(): void {
    // Safe string helper
    this.handlebars.registerHelper("safe", function (value: any) {
      return new this.handlebars.SafeString(value || "");
    });

    // URL helper
    this.handlebars.registerHelper(
      "url",
      function (path: string, base?: string) {
        const config = useRuntimeConfig();
        const baseUrl =
          base || config.public.siteUrl || "http://localhost:3000";

        if (path.startsWith("http")) {
          return path;
        }

        return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
      }
    );

    // Asset URL helper (for Directus)
    this.handlebars.registerHelper(
      "asset",
      function (fileId: string, transform?: any) {
        if (!fileId) return "";

        const config = useRuntimeConfig();
        let url = `${config.public.newsletter.directusUrl}/assets/${fileId}`;

        if (transform) {
          const params = new URLSearchParams();
          Object.entries(transform).forEach(([key, value]) => {
            params.set(key, String(value));
          });
          url += `?${params.toString()}`;
        }

        return url;
      }
    );

    // Date formatting helper
    this.handlebars.registerHelper(
      "formatDate",
      function (date: string | Date, format?: string) {
        const d = typeof date === "string" ? new Date(date) : date;

        if (!d || isNaN(d.getTime())) {
          return "";
        }

        const options: Intl.DateTimeFormatOptions = {};

        switch (format) {
          case "short":
            options.dateStyle = "short";
            break;
          case "medium":
            options.dateStyle = "medium";
            break;
          case "long":
            options.dateStyle = "long";
            break;
          case "full":
            options.dateStyle = "full";
            break;
          default:
            options.year = "numeric";
            options.month = "long";
            options.day = "numeric";
        }

        return d.toLocaleDateString("en-US", options);
      }
    );

    // Conditional helpers
    this.handlebars.registerHelper(
      "if_eq",
      function (a: any, b: any, options: any) {
        return a === b ? options.fn(this) : options.inverse(this);
      }
    );

    this.handlebars.registerHelper(
      "if_ne",
      function (a: any, b: any, options: any) {
        return a !== b ? options.fn(this) : options.inverse(this);
      }
    );

    this.handlebars.registerHelper(
      "if_gt",
      function (a: any, b: any, options: any) {
        return a > b ? options.fn(this) : options.inverse(this);
      }
    );

    this.handlebars.registerHelper(
      "if_lt",
      function (a: any, b: any, options: any) {
        return a < b ? options.fn(this) : options.inverse(this);
      }
    );

    // Loop helpers
    this.handlebars.registerHelper(
      "each_with_index",
      function (array: any[], options: any) {
        let result = "";

        for (let i = 0; i < array.length; i++) {
          result += options.fn({
            ...array[i],
            index: i,
            first: i === 0,
            last: i === array.length - 1,
            even: i % 2 === 0,
            odd: i % 2 === 1,
          });
        }

        return result;
      }
    );

    // String helpers
    this.handlebars.registerHelper("uppercase", function (str: string) {
      return str ? str.toUpperCase() : "";
    });

    this.handlebars.registerHelper("lowercase", function (str: string) {
      return str ? str.toLowerCase() : "";
    });

    this.handlebars.registerHelper(
      "truncate",
      function (str: string, length: number = 100) {
        if (!str) return "";
        return str.length > length ? str.substring(0, length) + "..." : str;
      }
    );

    // Math helpers
    this.handlebars.registerHelper("add", function (a: number, b: number) {
      return (a || 0) + (b || 0);
    });

    this.handlebars.registerHelper("subtract", function (a: number, b: number) {
      return (a || 0) - (b || 0);
    });

    this.handlebars.registerHelper("multiply", function (a: number, b: number) {
      return (a || 0) * (b || 0);
    });

    this.handlebars.registerHelper("divide", function (a: number, b: number) {
      return b !== 0 ? (a || 0) / b : 0;
    });
  }

  // Register custom helper
  registerHelper(name: string, helper: Function): void {
    this.handlebars.registerHelper(name, helper);
  }

  // Register custom partial
  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template);
  }

  // Sanitize block content
  private sanitizeBlockContent(content: string): string {
    // Basic sanitization for MJML content
    // You can customize this based on your security requirements
    return content;
  }

  // HTML escape utility
  private escapeHtml(unsafe: string): string {
    if (typeof unsafe !== "string") {
      return "";
    }

    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Validate MJML syntax
  validateMJML(mjmlContent: string): { valid: boolean; errors: any[] } {
    try {
      const result = mjml(mjmlContent, { validationLevel: "strict" });
      return {
        valid: result.errors.length === 0,
        errors: result.errors,
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [{ message: error.message }],
      };
    }
  }

  // Get available components
  getAvailableComponents(): string[] {
    return [
      "mj-body",
      "mj-section",
      "mj-column",
      "mj-text",
      "mj-button",
      "mj-image",
      "mj-divider",
      "mj-spacer",
      "mj-raw",
      "mj-hero",
      "mj-wrapper",
      "mj-group",
      "mj-navbar",
      "mj-social",
      "mj-accordion",
      "mj-carousel",
    ];
  }
}

// Default instance
export const mjmlService = new MJMLService();

// Utility functions
export function compileMJMLToHTML(
  mjmlContent: string,
  options?: MJMLCompileOptions
): string {
  const result = mjml(mjmlContent, options);

  if (result.errors.length > 0) {
    console.warn("MJML compilation warnings:", result.errors);
  }

  return result.html;
}

export function createMJMLTemplate(
  blocks: string[],
  options: {
    title?: string;
    backgroundColor?: string;
    fontFamily?: string;
  } = {}
): string {
  const {
    title = "Newsletter",
    backgroundColor = "#ffffff",
    fontFamily = "Arial, sans-serif",
  } = options;

  return `
    <mjml>
      <mj-head>
        <mj-title>${title}</mj-title>
        <mj-attributes>
          <mj-all font-family="${fontFamily}" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="${backgroundColor}">
        ${blocks.join("\n")}
      </mj-body>
    </mjml>
  `;
}
