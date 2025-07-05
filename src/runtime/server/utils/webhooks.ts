// src/runtime/server/utils/webhooks.ts
import crypto from "crypto";
import { createDirectus, rest, createItem } from "@directus/sdk";

export interface WebhookEvent {
  id?: string;
  event_type: string;
  source: string;
  timestamp: number;
  data: Record<string, any>;
  email?: string;
  newsletter_id?: number;
  subscriber_id?: number;
}

export interface WebhookProcessor {
  source: string;
  processor: (event: any) => Promise<WebhookEvent | null>;
  validator?: (signature: string, payload: string, secret: string) => boolean;
}

export interface WebhookLog {
  source: string;
  event_type: string;
  status: "success" | "error" | "skipped";
  processing_time: number;
  error_message?: string;
  event_id?: string;
}

// Webhook manager for handling different email service providers
export class WebhookManager {
  private processors = new Map<string, WebhookProcessor>();
  private logs: WebhookLog[] = [];

  constructor() {
    this.registerDefaultProcessors();
  }

  // Register a webhook processor for a specific source
  registerProcessor(processor: WebhookProcessor): void {
    this.processors.set(processor.source, processor);
  }

  // Process webhook payload
  async processWebhook(
    source: string,
    payload: string,
    signature?: string,
    secret?: string
  ): Promise<{
    success: boolean;
    processed: number;
    errors: number;
    logs: WebhookLog[];
  }> {
    const processor = this.processors.get(source);

    if (!processor) {
      throw new Error(`No processor registered for source: ${source}`);
    }

    // Validate signature if provided
    if (signature && secret && processor.validator) {
      const isValid = processor.validator(signature, payload, secret);
      if (!isValid) {
        throw new Error("Invalid webhook signature");
      }
    }

    // Parse payload
    let events: any[];
    try {
      const parsed = JSON.parse(payload);
      events = Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      throw new Error("Invalid JSON payload");
    }

    const results = {
      success: true,
      processed: 0,
      errors: 0,
      logs: [] as WebhookLog[],
    };

    // Process each event
    for (const rawEvent of events) {
      const startTime = Date.now();

      try {
        const processedEvent = await processor.processor(rawEvent);

        if (processedEvent) {
          await this.saveWebhookEvent(processedEvent);
          results.processed++;

          results.logs.push({
            source,
            event_type: processedEvent.event_type,
            status: "success",
            processing_time: Date.now() - startTime,
            event_id: processedEvent.id,
          });
        } else {
          results.logs.push({
            source,
            event_type: rawEvent.event || "unknown",
            status: "skipped",
            processing_time: Date.now() - startTime,
          });
        }
      } catch (error: any) {
        results.errors++;
        results.logs.push({
          source,
          event_type: rawEvent.event || "unknown",
          status: "error",
          processing_time: Date.now() - startTime,
          error_message: error.message,
        });
      }
    }

    return results;
  }

  // Save webhook event to database
  private async saveWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      const config = useRuntimeConfig();
      const directus = createDirectus(
        config.public.newsletter.directusUrl
      ).with(rest());

      await directus.request(
        createItem("newsletter_events", {
          newsletter_id: event.newsletter_id,
          event_type: event.event_type,
          email: event.email,
          timestamp: new Date(event.timestamp * 1000).toISOString(),
          source: event.source,
          data: JSON.stringify(event.data),
          created_at: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Failed to save webhook event:", error);
      throw error;
    }
  }

  // Register default processors
  private registerDefaultProcessors(): void {
    // SendGrid processor
    this.registerProcessor({
      source: "sendgrid",
      processor: this.processSendGridEvent.bind(this),
      validator: this.validateSendGridSignature.bind(this),
    });

    // Mailgun processor
    this.registerProcessor({
      source: "mailgun",
      processor: this.processMailgunEvent.bind(this),
      validator: this.validateMailgunSignature.bind(this),
    });

    // Postmark processor
    this.registerProcessor({
      source: "postmark",
      processor: this.processPostmarkEvent.bind(this),
      validator: this.validatePostmarkSignature.bind(this),
    });
  }

  // SendGrid event processor
  private async processSendGridEvent(event: any): Promise<WebhookEvent | null> {
    const {
      event: eventType,
      email,
      timestamp,
      newsletter_id,
      subscriber_id,
      url,
      user_agent,
      ip,
      ...additionalData
    } = event;

    if (!eventType || !email || !timestamp) {
      return null;
    }

    const newsletterIdFromEvent =
      newsletter_id || this.extractFromCustomArgs(event, "newsletter_id");

    return {
      event_type: eventType,
      source: "sendgrid",
      timestamp,
      email: email.toLowerCase(),
      newsletter_id: newsletterIdFromEvent
        ? parseInt(newsletterIdFromEvent)
        : undefined,
      subscriber_id: subscriber_id ? parseInt(subscriber_id) : undefined,
      data: {
        url,
        user_agent,
        ip,
        ...additionalData,
      },
    };
  }

  // Mailgun event processor
  private async processMailgunEvent(event: any): Promise<WebhookEvent | null> {
    const {
      event: eventType,
      recipient,
      timestamp,
      "user-variables": userVariables,
      url,
      "client-info": clientInfo,
      ...additionalData
    } = event;

    if (!eventType || !recipient || !timestamp) {
      return null;
    }

    return {
      event_type: this.mapMailgunEvent(eventType),
      source: "mailgun",
      timestamp,
      email: recipient.toLowerCase(),
      newsletter_id: userVariables?.newsletter_id
        ? parseInt(userVariables.newsletter_id)
        : undefined,
      subscriber_id: userVariables?.subscriber_id
        ? parseInt(userVariables.subscriber_id)
        : undefined,
      data: {
        url,
        client_info: clientInfo,
        ...additionalData,
      },
    };
  }

  // Postmark event processor
  private async processPostmarkEvent(event: any): Promise<WebhookEvent | null> {
    const {
      Type: eventType,
      Email: email,
      ReceivedAt: timestamp,
      Metadata: metadata,
      OriginalLink: url,
      Client: clientInfo,
      ...additionalData
    } = event;

    if (!eventType || !email) {
      return null;
    }

    return {
      event_type: this.mapPostmarkEvent(eventType),
      source: "postmark",
      timestamp: new Date(timestamp).getTime() / 1000,
      email: email.toLowerCase(),
      newsletter_id: metadata?.newsletter_id
        ? parseInt(metadata.newsletter_id)
        : undefined,
      subscriber_id: metadata?.subscriber_id
        ? parseInt(metadata.subscriber_id)
        : undefined,
      data: {
        url,
        client_info: clientInfo,
        ...additionalData,
      },
    };
  }

  // Signature validators
  private validateSendGridSignature(
    signature: string,
    payload: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  private validateMailgunSignature(
    signature: string,
    payload: string,
    secret: string
  ): boolean {
    try {
      // Mailgun uses a different signature format
      const [timestamp, token, computedSignature] = signature.split(",");

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(timestamp + token)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  private validatePostmarkSignature(
    signature: string,
    payload: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  // Event type mappers
  private mapMailgunEvent(eventType: string): string {
    const eventMap: Record<string, string> = {
      delivered: "delivered",
      opened: "open",
      clicked: "click",
      bounced: "bounce",
      dropped: "dropped",
      complained: "spamreport",
      unsubscribed: "unsubscribe",
    };

    return eventMap[eventType] || eventType;
  }

  private mapPostmarkEvent(eventType: string): string {
    const eventMap: Record<string, string> = {
      Delivery: "delivered",
      Open: "open",
      Click: "click",
      Bounce: "bounce",
      SpamComplaint: "spamreport",
      SubscriptionChange: "unsubscribe",
    };

    return eventMap[eventType] || eventType.toLowerCase();
  }

  // Utility functions
  private extractFromCustomArgs(event: any, key: string): any {
    const customArgs =
      event.custom_args ||
      event.unique_args ||
      event["user-variables"] ||
      event.Metadata;

    if (typeof customArgs === "object" && customArgs[key]) {
      return customArgs[key];
    }

    return event[key];
  }

  // Get processing logs
  getLogs(): WebhookLog[] {
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }
}

// Global webhook manager instance
export const webhookManager = new WebhookManager();

// Webhook verification utilities
export function verifyWebhookSignature(
  provider: string,
  signature: string,
  payload: string,
  secret: string
): boolean {
  switch (provider.toLowerCase()) {
    case "sendgrid":
      return verifySendGridSignature(signature, payload, secret);
    case "mailgun":
      return verifyMailgunSignature(signature, payload, secret);
    case "postmark":
      return verifyPostmarkSignature(signature, payload, secret);
    default:
      throw new Error(`Unknown webhook provider: ${provider}`);
  }
}

// Provider-specific signature verification
export function verifySendGridSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
}

export function verifyMailgunSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  try {
    const [timestamp, token, computedSignature] = signature.split(",");

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(timestamp + token)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
}

export function verifyPostmarkSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
}

// Webhook event type normalizer
export function normalizeEventType(
  provider: string,
  eventType: string
): string {
  const normalizations: Record<string, Record<string, string>> = {
    sendgrid: {
      delivered: "delivered",
      open: "open",
      click: "click",
      bounce: "bounce",
      dropped: "dropped",
      spamreport: "complaint",
      unsubscribe: "unsubscribe",
      group_unsubscribe: "unsubscribe",
    },
    mailgun: {
      delivered: "delivered",
      opened: "open",
      clicked: "click",
      bounced: "bounce",
      dropped: "dropped",
      complained: "complaint",
      unsubscribed: "unsubscribe",
    },
    postmark: {
      Delivery: "delivered",
      Open: "open",
      Click: "click",
      Bounce: "bounce",
      SpamComplaint: "complaint",
      SubscriptionChange: "unsubscribe",
    },
  };

  const providerMappings = normalizations[provider.toLowerCase()];
  return providerMappings?.[eventType] || eventType.toLowerCase();
}

// Retry mechanism for failed webhook processing
export class WebhookRetryManager {
  private retryQueue: Array<{
    id: string;
    payload: string;
    source: string;
    signature?: string;
    secret?: string;
    attempts: number;
    nextRetry: Date;
  }> = [];

  private maxRetries = 3;
  private retryDelays = [1000, 5000, 30000]; // 1s, 5s, 30s

  async addToRetryQueue(
    payload: string,
    source: string,
    signature?: string,
    secret?: string
  ): Promise<void> {
    const id = crypto.randomUUID();

    this.retryQueue.push({
      id,
      payload,
      source,
      signature,
      secret,
      attempts: 0,
      nextRetry: new Date(Date.now() + this.retryDelays[0]),
    });
  }

  async processRetryQueue(): Promise<void> {
    const now = new Date();
    const itemsToRetry = this.retryQueue.filter(
      (item) => item.nextRetry <= now && item.attempts < this.maxRetries
    );

    for (const item of itemsToRetry) {
      try {
        await webhookManager.processWebhook(
          item.source,
          item.payload,
          item.signature,
          item.secret
        );

        // Remove successful item
        this.retryQueue = this.retryQueue.filter((i) => i.id !== item.id);
      } catch (error) {
        item.attempts++;

        if (item.attempts >= this.maxRetries) {
          // Remove failed item after max retries
          this.retryQueue = this.retryQueue.filter((i) => i.id !== item.id);
          console.error(
            `Webhook retry failed after ${this.maxRetries} attempts:`,
            error
          );
        } else {
          // Schedule next retry
          const delay =
            this.retryDelays[item.attempts - 1] ||
            this.retryDelays[this.retryDelays.length - 1];
          item.nextRetry = new Date(Date.now() + delay);
        }
      }
    }
  }

  getQueueStatus(): { pending: number; failed: number } {
    const pending = this.retryQueue.filter(
      (item) => item.attempts < this.maxRetries
    ).length;
    const failed = this.retryQueue.filter(
      (item) => item.attempts >= this.maxRetries
    ).length;

    return { pending, failed };
  }
}

export const webhookRetryManager = new WebhookRetryManager();

// Start retry processor (run every minute)
if (process.env.NODE_ENV === "production") {
  setInterval(() => {
    webhookRetryManager.processRetryQueue();
  }, 60000);
}
