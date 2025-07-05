import type { NewsletterSend, Subscriber } from "~/types/newsletter";

export interface WebhookEvent {
  event: string;
  email: string;
  timestamp: number;
  newsletter_id?: string;
  subscriber_id?: string;
  send_record_id?: string;
  url?: string;
  user_agent?: string;
  ip?: string;
}

export class WebhookProcessor {
  async processEvent(event: WebhookEvent, directus: any): Promise<void> {
    switch (event.event) {
      case "delivered":
        await this.handleDelivered(event, directus);
        break;
      case "open":
        await this.handleOpen(event, directus);
        break;
      case "click":
        await this.handleClick(event, directus);
        break;
      case "bounce":
      case "dropped":
        await this.handleBounce(event, directus);
        break;
      case "unsubscribe":
        await this.handleUnsubscribe(event, directus);
        break;
      case "spam_report":
        await this.handleSpamReport(event, directus);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }
  }

  private async handleDelivered(event: WebhookEvent, directus: any) {
    // Update send record
    if (event.send_record_id) {
      await this.incrementSendRecordCounter(
        directus,
        event.send_record_id,
        "delivered_count"
      );
    }

    // Log delivery event
    await this.logEvent(directus, event, "delivered");
  }

  private async handleOpen(event: WebhookEvent, directus: any) {
    // Update newsletter opens
    if (event.newsletter_id) {
      await this.incrementNewsletterCounter(
        directus,
        event.newsletter_id,
        "total_opens"
      );
    }

    // Update send record opens
    if (event.send_record_id) {
      await this.incrementSendRecordCounter(
        directus,
        event.send_record_id,
        "open_count"
      );
    }

    // Update subscriber engagement
    if (event.subscriber_id) {
      await this.updateSubscriberEngagement(
        directus,
        event.subscriber_id,
        "open"
      );
    }

    // Log open event
    await this.logEvent(directus, event, "open");
  }

  private async handleClick(event: WebhookEvent, directus: any) {
    // Update newsletter clicks
    if (event.newsletter_id) {
      await this.incrementNewsletterCounter(
        directus,
        event.newsletter_id,
        "total_clicks"
      );
    }

    // Update send record clicks
    if (event.send_record_id) {
      await this.incrementSendRecordCounter(
        directus,
        event.send_record_id,
        "click_count"
      );
    }

    // Update subscriber engagement
    if (event.subscriber_id) {
      await this.updateSubscriberEngagement(
        directus,
        event.subscriber_id,
        "click"
      );
    }

    // Log click event with URL
    await this.logEvent(directus, event, "click", { url: event.url });
  }

  private async handleBounce(event: WebhookEvent, directus: any) {
    // Update subscriber status
    if (event.subscriber_id) {
      await directus.request(
        updateItem("subscribers", event.subscriber_id, {
          status: "bounced",
          last_bounce_at: new Date().toISOString(),
        })
      );
    }

    // Log bounce event
    await this.logEvent(directus, event, "bounce");
  }

  private async handleUnsubscribe(event: WebhookEvent, directus: any) {
    // Update subscriber status
    if (event.subscriber_id) {
      await directus.request(
        updateItem("subscribers", event.subscriber_id, {
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
        })
      );
    }

    // Log unsubscribe event
    await this.logEvent(directus, event, "unsubscribe");
  }

  private async handleSpamReport(event: WebhookEvent, directus: any) {
    // Update subscriber status
    if (event.subscriber_id) {
      await directus.request(
        updateItem("subscribers", event.subscriber_id, {
          status: "suppressed",
          suppressed_at: new Date().toISOString(),
          suppression_reason: "spam_complaint",
        })
      );
    }

    // Log spam report
    await this.logEvent(directus, event, "spam_report");
  }

  private async incrementNewsletterCounter(
    directus: any,
    newsletterId: string,
    field: string
  ) {
    try {
      const newsletter = await directus.request(
        readItem("newsletters", newsletterId)
      );
      if (newsletter) {
        await directus.request(
          updateItem("newsletters", newsletterId, {
            [field]: (newsletter[field] || 0) + 1,
          })
        );
      }
    } catch (error) {
      console.error(`Failed to update newsletter ${field}:`, error);
    }
  }

  private async incrementSendRecordCounter(
    directus: any,
    sendRecordId: string,
    field: string
  ) {
    try {
      const sendRecord = await directus.request(
        readItem("newsletter_sends", sendRecordId)
      );
      if (sendRecord) {
        await directus.request(
          updateItem("newsletter_sends", sendRecordId, {
            [field]: (sendRecord[field] || 0) + 1,
          })
        );
      }
    } catch (error) {
      console.error(`Failed to update send record ${field}:`, error);
    }
  }

  private async updateSubscriberEngagement(
    directus: any,
    subscriberId: string,
    eventType: string
  ) {
    try {
      const subscriber = await directus.request(
        readItem("subscribers", subscriberId)
      );
      if (subscriber) {
        const currentScore = subscriber.engagement_score || 0;
        const increment = eventType === "open" ? 1 : 2; // Clicks worth more than opens

        await directus.request(
          updateItem("subscribers", subscriberId, {
            engagement_score: Math.min(100, currentScore + increment),
            last_activity: new Date().toISOString(),
            ...(eventType === "open" && {
              last_email_opened: new Date().toISOString(),
            }),
          })
        );
      }
    } catch (error) {
      console.error("Failed to update subscriber engagement:", error);
    }
  }

  private async logEvent(
    directus: any,
    event: WebhookEvent,
    eventType: string,
    metadata: any = {}
  ) {
    try {
      await directus.request(
        createItem("newsletter_events", {
          event_type: eventType,
          email: event.email,
          newsletter_id: event.newsletter_id
            ? parseInt(event.newsletter_id)
            : null,
          subscriber_id: event.subscriber_id
            ? parseInt(event.subscriber_id)
            : null,
          send_record_id: event.send_record_id
            ? parseInt(event.send_record_id)
            : null,
          timestamp: new Date(event.timestamp * 1000).toISOString(),
          user_agent: event.user_agent,
          ip_address: event.ip,
          metadata: JSON.stringify(metadata),
        })
      );
    } catch (error) {
      console.error("Failed to log event:", error);
    }
  }
}
