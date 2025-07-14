#!/usr/bin/env node

/**
 * Script to Create Sample Newsletter Templates in Directus
 * This script populates the 'newsletter_templates' collection with predefined templates
 * using the basic and advanced blocks already installed.
 *
 * Usage: node create-newsletter-templates.js <directus-url> <email> <password>
 *
 * Note: Ensure install-directus-collections.js and create-advanced-blocks.js
 * have been run successfully before running this script.
 *
 * New Templates Added:
 * - Economic Development Update
 * - Community & Events Digest
 * - Impact & Insights Summary
 * - Monthly (Comprehensive Template)
 */

import {
  authentication,
  createDirectus,
  createItems,
  rest,
} from "@directus/sdk";

class NewsletterTemplateCreator {
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

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async createTemplates() {
    console.log("\n📝 Creating sample newsletter templates...");

    const sampleTemplates = [
      {
        name: "Welcome Series - First Email",
        description: "A friendly welcome email for new subscribers.",
        category: "welcome",
        default_subject_pattern: "Welcome to {{company_name}}!",
        default_from_name: "Our Team",
        default_from_email: "noreply@yourcompany.com",
        blocks_config: [
          {
            block_type_slug: "hero",
            data: {
              title: "Welcome to Our Community!",
              subtitle: "Thanks for joining us. Here's what you can expect.",
              button_text: "Explore Our Website",
              button_url: "https://yourcompany.com",
              background_color: "#f3f4f6",
              text_color: "#1f2937",
              text_align: "center",
              padding: "40px 0",
            },
          },
          {
            block_type_slug: "text",
            data: {
              text_content:
                "<p>We're thrilled to have you as part of our growing community. Get ready for exclusive updates, special offers, and insightful content delivered straight to your inbox.</p><p>Our mission is to provide you with the best resources to help you succeed. Feel free to reach out if you have any questions!</p>",
              background_color: "#ffffff",
              text_color: "#333333",
              text_align: "left",
              padding: "20px",
              font_size: "14px",
            },
          },
          {
            block_type_slug: "social-links",
            data: {
              title: "Connect with us!",
              facebook_url: "https://facebook.com/yourcompany",
              twitter_url: "https://twitter.com/yourcompany",
              linkedin_url: "https://linkedin.com/company/yourcompany",
              instagram_url: "https://instagram.com/yourcompany",
              background_color: "#f3f4f6",
              text_color: "#1f2937",
              text_align: "center",
              padding: "30px 0",
            },
          },
          {
            block_type_slug: "cta-section",
            data: {
              cta_title: "Ready to Dive Deeper?",
              cta_subtitle: "Check out our most popular content or get in touch!",
              primary_button_text: "Visit Our Blog",
              primary_button_url: "https://yourcompany.com/blog",
              secondary_button_text: "Contact Us",
              secondary_button_url: "https://yourcompany.com/contact",
              background_color: "#ffffff",
              text_color: "#1f2937",
              text_align: "center",
              padding: "40px 0",
            },
          },
        ],
      },
      {
        name: "Weekly Digest - Product Updates",
        description: "Weekly summary of product enhancements and news.",
        category: "product",
        default_subject_pattern: "Weekly Product Digest: New Features & Improvements!",
        default_from_name: "Product Team",
        default_from_email: "product@yourcompany.com",
        blocks_config: [
          {
            block_type_slug: "hero",
            data: {
              title: "Exciting Product Updates This Week!",
              subtitle: "Discover the latest features designed to make your life easier.",
              background_color: "#e0f7fa",
              text_color: "#004d40",
              text_align: "center",
              padding: "30px 0",
            },
          },
          {
            block_type_slug: "product-showcase",
            data: {
              title: "Introducing Feature X",
              text_content:
                "We've launched Feature X, a powerful new tool that allows you to streamline your workflow and boost productivity. Learn how it can transform your daily tasks.",
              image: null, // Placeholder for image UUID
              image_alt_text: "Feature X screenshot",
              price: "Free for all users!",
              button_text: "Learn More About Feature X",
              button_url: "https://yourcompany.com/feature-x",
              background_color: "#ffffff",
              text_color: "#333333",
              padding: "20px",
            },
          },
          {
            block_type_slug: "feature-list",
            data: {
              title: "Key Benefits of Our Latest Update:",
              feature1: "Improved performance and speed",
              feature2: "Enhanced user interface for better experience",
              feature3: "New integrations with popular tools",
              feature4: "Robust security updates",
              background_color: "#f3f4f6",
              text_color: "#1f2937",
              text_align: "left",
              padding: "20px",
            },
          },
          {
            block_type_slug: "testimonial",
            data: {
              testimonial_text:
                "The new updates are fantastic! Our team has seen a significant improvement in efficiency since Feature X was released.",
              testimonial_author: "Jane Doe",
              author_title: "Operations Manager",
              author_company: "Acme Corp.",
              author_avatar: null, // Placeholder for avatar UUID
              background_color: "#ffffff",
              text_color: "#333333",
              text_align: "center",
              padding: "30px",
            },
          },
        ],
      },
      {
        name: "Event Invitation - Webinar",
        description: "Invite subscribers to an upcoming webinar.",
        category: "event",
        default_subject_pattern: "You're Invited! Free Webinar: {{webinar_title}}",
        default_from_name: "Events Team",
        default_from_email: "events@yourcompany.com",
        blocks_config: [
          {
            block_type_slug: "image",
            data: {
              image: null, // Placeholder for image UUID
              image_alt_text: "Webinar banner",
              image_caption: "Join our upcoming webinar!",
              background_color: "#ffffff",
              text_align: "center",
              padding: "0",
            },
          },
          {
            block_type_slug: "event-card",
            data: {
              title: "Mastering Directus: Advanced Techniques",
              text_content:
                "Join our expert panel for an in-depth look at advanced Directus features and best practices. Learn how to optimize your data models, create custom extensions, and scale your projects.",
              event_date: "July 25, 2025",
              event_time: "10:00 AM EDT",
              event_location: "Online Webinar (Link will be sent upon registration)",
              button_text: "Register Now",
              button_url: "https://yourcompany.com/webinar-registration",
              background_color: "#f8f8f8",
              text_color: "#1f2937",
              text_align: "left",
              padding: "30px",
            },
          },
          {
            block_type_slug: "three-column",
            data: {
              column1_title: "Expert Speakers",
              column1_content: "Learn from industry leaders and Directus core contributors.",
              column2_title: "Live Q&A",
              column2_content: "Get your questions answered in real-time by our panelists.",
              column3_title: "Exclusive Content",
              column3_content: "Attendees will receive access to premium resources.",
              background_color: "#ffffff",
              text_color: "#333333",
              padding: "20px",
            },
          },
          {
            block_type_slug: "progress-bar",
            data: {
              title: "Seats Filling Up Fast!",
              progress_label: "Registration Progress",
              progress_percentage: 75,
              background_color: "#f3f4f6",
              text_color: "#1f2937",
              text_align: "center",
              padding: "30px 0",
            },
          },
        ],
      },
      // --- New Templates for Economic Development Organization ---

      {
        name: "Economic Development Update",
        description: "Updates on key projects, regional news, and economic highlights.",
        category: "economic_development",
        default_subject_pattern: "Upstate NY Economic Update: {{month_year}} Projects & News",
        default_from_name: "Upstate NY EDC",
        default_from_email: "info@upstatenyedc.org",
        blocks_config: [
          {
            block_type_slug: "hero",
            data: {
              title: "Upstate NY Economic Development Update",
              subtitle: "Your monthly digest of regional progress and opportunities.",
              image: null, // Placeholder for a hero image
              image_alt_text: "Upstate New York landscape",
              background_color: "#e6f7ff", // Light blue
              text_color: "#0a3d62", // Darker blue
              text_align: "center",
              padding: "40px 0",
            },
          },
          {
            block_type_slug: "text",
            data: {
              title: "Message from the Director",
              text_content:
                "<p>Dear Supporters,</p><p>We are excited to share the latest advancements in economic development across Upstate New York. This month, we've seen significant progress in several key sectors, fostering growth and creating new opportunities for our communities.</p><p>Your continued support is vital to our mission. Read on for more details!</p>",
              background_color: "#ffffff",
              text_color: "#333333",
              text_align: "left",
              padding: "20px",
              font_size: "14px",
            },
          },
          {
            block_type_slug: "product-showcase", // Repurposed for Project Update
            data: {
              title: "Project Spotlight: Advanced Manufacturing Hub",
              text_content:
                "Our new Advanced Manufacturing Hub is officially underway! This initiative is set to bring hundreds of high-tech jobs and significant investment to the region. Construction is progressing rapidly, and we anticipate a grand opening in Q3.",
              image: null, // Placeholder for project image
              image_alt_text: "Advanced Manufacturing Hub construction",
              button_text: "Learn More About This Project",
              button_url: "https://upstatenyedc.org/projects/manufacturing-hub",
              background_color: "#f8f8f8",
              text_color: "#1f2937",
              padding: "30px",
            },
          },
          {
            block_type_slug: "text", // For Regional News Item
            data: {
              title: "Regional News: New Tech Startup Incubator Opens",
              text_content:
                "<p>A groundbreaking tech startup incubator has opened its doors in [City Name], providing crucial resources and mentorship for emerging businesses. This will further solidify Upstate NY's position as a hub for innovation.</p>",
              background_color: "#ffffff",
              text_color: "#333333",
              text_align: "left",
              padding: "20px",
              font_size: "14px",
            },
          },
          {
            block_type_slug: "cta-section",
            data: {
              cta_title: "Get Involved with Upstate NY EDC",
              cta_subtitle: "Partner with us to drive economic prosperity in our region.",
              primary_button_text: "Contact Us",
              primary_button_url: "https://upstatenyedc.org/contact",
              secondary_button_text: "View All Projects",
              secondary_button_url: "https://upstatenyedc.org/projects",
              background_color: "#e6f7ff",
              text_color: "#0a3d62",
              text_align: "center",
              padding: "40px 0",
            },
          },
        ],
      },

      {
        name: "Community & Events Digest",
        description: "Latest events, community news, and board member highlights.",
        category: "community_events",
        default_subject_pattern: "Upcoming Events & Community Highlights from Upstate NY EDC",
        default_from_name: "Upstate NY EDC Events",
        default_from_email: "events@upstatenyedc.org",
        blocks_config: [
          {
            block_type_slug: "hero",
            data: {
              title: "Join Us at Our Next Event!",
              subtitle: "Connecting leaders, fostering growth.",
              background_color: "#fffbe6", // Light yellow
              text_color: "#624d0a", // Darker yellow/brown
              text_align: "center",
              padding: "30px 0",
            },
          },
          {
            block_type_slug: "event-card",
            data: {
              title: "Annual Economic Summit",
              text_content:
                "Our flagship event brings together business leaders, policymakers, and innovators to discuss the future of Upstate New York's economy. Don't miss out!",
              event_date: "September 15-16, 2025",
              event_time: "9:00 AM - 5:00 PM",
              event_location: "Grand Convention Center, [City Name]",
              button_text: "Register for the Summit",
              button_url: "https://upstatenyedc.org/summit",
              background_color: "#ffffff",
              text_color: "#1f2937",
              text_align: "left",
              padding: "30px",
            },
          },
          {
            block_type_slug: "event-card", // Second event card
            data: {
              title: "Local Business Mixer",
              text_content:
                "Network with local entrepreneurs and community leaders. A great opportunity to build connections and explore collaborations.",
              event_date: "August 10, 2025",
              event_time: "6:00 PM - 8:00 PM",
              event_location: "The Community Hub, [Town Name]",
              button_text: "RSVP for Mixer",
              button_url: "https://upstatenyedc.org/mixer",
              background_color: "#f8f8f8",
              text_color: "#1f2937",
              text_align: "left",
              padding: "30px",
            },
          },
          {
            block_type_slug: "team-member", // For Board Member Info / Staff Highlight
            data: {
              title: "Board Member Spotlight: Dr. Emily Chen",
              subtitle: "Chairperson, Innovation Committee",
              text_content:
                "Dr. Chen brings over 20 years of experience in technology and entrepreneurship. Her vision is instrumental in guiding our innovation initiatives and fostering a vibrant tech ecosystem in the region.",
              image: null, // Placeholder for board member photo
              image_alt_text: "Dr. Emily Chen",
              background_color: "#ffffff",
              text_color: "#333333",
              padding: "30px",
            },
          },
          {
            block_type_slug: "social-links",
            data: {
              title: "Follow Our Journey!",
              facebook_url: "https://facebook.com/upstatenyedc",
              twitter_url: "https://twitter.com/upstatenyedc",
              linkedin_url: "https://linkedin.com/company/upstatenyedc",
              background_color: "#fffbe6",
              text_color: "#624d0a",
              text_align: "center",
              padding: "30px 0",
            },
          },
        ],
      },

      {
        name: "Impact & Insights Summary",
        description: "Annual or quarterly summary of organizational impact and key insights.",
        category: "annual_report",
        default_subject_pattern: "Our Impact: Upstate NY EDC {{year}} Summary",
        default_from_name: "Upstate NY EDC",
        default_from_email: "info@upstatenyedc.org",
        blocks_config: [
          {
            block_type_slug: "hero",
            data: {
              title: "Driving Growth: Our {{year}} Impact",
              subtitle: "A look back at a year of significant economic progress.",
              background_color: "#e6ffe6", // Light green
              text_color: "#0a620a", // Darker green
              text_align: "center",
              padding: "40px 0",
            },
          },
          {
            block_type_slug: "statistics",
            data: {
              stat1_number: "$50M+",
              stat1_label: "New Investments",
              stat2_number: "1,500+",
              stat2_label: "Jobs Created",
              stat3_number: "20+",
              stat3_label: "New Businesses",
              stat4_number: "95%",
              stat4_label: "Project Success Rate",
              background_color: "#ffffff",
              text_color: "#1f2937",
              padding: "30px",
            },
          },
          {
            block_type_slug: "testimonial",
            data: {
              testimonial_text:
                "The EDC's support was invaluable in helping us establish our operations here. Their guidance and resources made all the difference.",
              testimonial_author: "John Smith",
              author_title: "CEO",
              author_company: "Innovate Tech Solutions",
              author_avatar: null, // Placeholder for CEO avatar
              background_color: "#f8f8f8",
              text_color: "#333333",
              text_align: "center",
              padding: "30px",
            },
          },
          {
            block_type_slug: "three-column",
            data: {
              column1_title: "Strategic Partnerships",
              column1_content: "Forging alliances with key stakeholders for greater impact.",
              column2_title: "Workforce Development",
              column2_content: "Investing in programs to upskill our regional talent.",
              column3_title: "Infrastructure Modernization",
              column3_content: "Upgrading critical infrastructure to support future growth.",
              background_color: "#ffffff",
              text_color: "#333333",
              padding: "20px",
            },
          },
          {
            block_type_slug: "cta-section",
            data: {
              cta_title: "Download Our Full Annual Report",
              cta_subtitle: "Dive deeper into our achievements and future plans.",
              primary_button_text: "Download Report",
              primary_button_url: "https://upstatenyedc.org/annual-report",
              background_color: "#e6ffe6",
              text_color: "#0a620a",
              text_align: "center",
              padding: "40px 0",
            },
          },
        ],
      },

      {
        name: "Monthly Economic Digest",
        description: "A comprehensive monthly newsletter covering all aspects of economic development.",
        category: "monthly",
        default_subject_pattern: "Monthly Digest: Upstate NY Economic Progress - {{month_year}}",
        default_from_name: "Upstate NY EDC",
        default_from_email: "info@upstatenyedc.org",
        blocks_config: [
          {
            block_type_slug: "hero",
            data: {
              title: "Your Monthly Economic Digest",
              subtitle: "Highlights, insights, and opportunities from across Upstate New York.",
              image: null, // Placeholder for a grand hero image
              image_alt_text: "Upstate New York skyline at sunset",
              background_color: "#f0f8ff", // Alice Blue
              text_color: "#2c3e50", // Darker blue-grey
              text_align: "center",
              padding: "50px 0",
            },
          },
          {
            block_type_slug: "text",
            data: {
              title: "From the Director's Desk",
              text_content:
                "<p>Dear Valued Partners,</p><p>This month has been particularly dynamic for Upstate New York's economic landscape. We've seen remarkable strides in job creation, significant new investments, and the launch of innovative programs designed to support our local businesses and communities.</p><p>We invite you to explore the detailed updates below and join us in celebrating the collective achievements that are shaping our region's prosperous future.</p>",
              background_color: "#ffffff",
              text_color: "#333333",
              text_align: "left",
              padding: "25px",
              font_size: "15px",
            },
          },
          {
            block_type_slug: "statistics",
            data: {
              stat1_number: "750+",
              stat1_label: "New Jobs",
              stat2_number: "$25M",
              stat2_label: "New Capital",
              stat3_number: "12",
              stat3_label: "New Businesses",
              stat4_number: "5",
              stat4_label: "Major Events",
              background_color: "#f8f8f8",
              text_color: "#1f2937",
              padding: "30px",
            },
          },
          {
            block_type_slug: "product-showcase", // Project Update 1
            data: {
              title: "Project Update: Renewable Energy Park Expansion",
              text_content:
                "The expansion of the [Region Name] Renewable Energy Park is ahead of schedule, poised to become one of the largest solar and wind facilities in the state. This project underscores our commitment to sustainable growth and green energy jobs.",
              image: null, // Placeholder for renewable energy image
              image_alt_text: "Renewable Energy Park",
              button_text: "Read Project Case Study",
              button_url: "https://upstatenyedc.org/projects/renewable-energy",
              background_color: "#ffffff",
              text_color: "#333333",
              padding: "30px",
            },
          },
          {
            block_type_slug: "text", // Regional News Item 1
            data: {
              title: "Regional News: Downtown Revitalization Grant Awarded",
              text_content:
                "<p>The city of [Another City Name] has secured a significant state grant for downtown revitalization, promising new businesses, housing, and vibrant public spaces. This is a testament to collaborative community efforts.</p>",
              background_color: "#f8f8f8",
              text_color: "#1f2937",
              text_align: "left",
              padding: "20px",
              font_size: "14px",
            },
          },
          {
            block_type_slug: "event-card",
            data: {
              title: "Upcoming: Innovation & Tech Expo",
              text_content:
                "Discover the latest technological advancements and connect with innovators at our annual Tech Expo. Featuring keynote speakers, startup pitches, and networking opportunities.",
              event_date: "October 10-11, 2025",
              event_time: "9:00 AM - 4:00 PM",
              event_location: "Tech Hub Conference Center, [City Name]",
              button_text: "Secure Your Spot",
              button_url: "https://upstatenyedc.org/tech-expo",
              background_color: "#ffffff",
              text_color: "#1f2937",
              text_align: "left",
              padding: "30px",
            },
          },
          {
            block_type_slug: "team-member", // Staff Highlight
            data: {
              title: "Staff Highlight: Sarah Jenkins",
              subtitle: "Senior Economic Development Specialist",
              text_content:
                "Sarah is a driving force behind our small business support programs. Her dedication has helped countless local entrepreneurs navigate challenges and achieve sustainable growth. We appreciate her tireless efforts!",
              image: null, // Placeholder for staff photo
              image_alt_text: "Sarah Jenkins",
              background_color: "#f8f8f8",
              text_color: "#333333",
              padding: "30px",
            },
          },
          {
            block_type_slug: "feature-list",
            data: {
              title: "Key Initiatives This Month:",
              feature1: "Launched new workforce training program for advanced manufacturing.",
              feature2: "Secured funding for rural broadband expansion project.",
              feature3: "Hosted successful investor roundtable event.",
              feature4: "Provided technical assistance to 15+ local businesses.",
              background_color: "#ffffff",
              text_color: "#1f2937",
              text_align: "left",
              padding: "20px",
            },
          },
          {
            block_type_slug: "testimonial",
            data: {
              testimonial_text:
                "The EDC's team is incredibly responsive and knowledgeable. They've been a crucial resource for our company's expansion plans.",
              testimonial_author: "Michael Lee",
              author_title: "Founder",
              author_company: "Global Logistics Inc.",
              author_avatar: null, // Placeholder for testimonial avatar
              background_color: "#f0f8ff",
              text_color: "#2c3e50",
              text_align: "center",
              padding: "30px",
            },
          },
          {
            block_type_slug: "three-column",
            data: {
              column1_title: "Policy Updates",
              column1_content: "Brief on new state economic policies affecting the region.",
              column2_title: "Funding Opportunities",
              column2_content: "New grants and loan programs available for businesses.",
              column3_title: "Success Stories",
              column3_content: "Read about businesses thriving with EDC support.",
              background_color: "#ffffff",
              text_color: "#333333",
              padding: "20px",
            },
          },
          {
            block_type_slug: "cta-section",
            data: {
              cta_title: "Stay Connected & Get Involved!",
              cta_subtitle: "Your partnership fuels our region's growth. Explore more or reach out.",
              primary_button_text: "Visit Our Website",
              primary_button_url: "https://upstatenyedc.org",
              secondary_button_text: "Subscribe to Updates",
              secondary_button_url: "https://upstatenyedc.org/subscribe",
              background_color: "#f0f8ff",
              text_color: "#2c3e50",
              text_align: "center",
              padding: "40px 0",
            },
          },
          {
            block_type_slug: "social-links",
            data: {
              title: "Follow Us on Social Media",
              facebook_url: "https://facebook.com/upstatenyedc",
              twitter_url: "https://twitter.com/upstatenyedc",
              linkedin_url: "https://linkedin.com/company/upstatenyedc",
              youtube_url: "https://youtube.com/upstatenyedc",
              background_color: "#ffffff",
              text_color: "#1f2937",
              text_align: "center",
              padding: "30px 0",
            },
          },
        ],
      },
    ];

    for (const template of sampleTemplates) {
      try {
        await this.directus.request(createItems("newsletter_templates", template));
        console.log(`✅ Created template: ${template.name}`);
        await this.delay(500);
      } catch (error) {
        if (
          error.message?.includes("duplicate") ||
          error.message?.includes("unique")
        ) {
          console.log(`⏭️  Template "${template.name}" already exists`);
        } else {
          console.error(
            `❌ Failed to create template ${template.name}:`,
            error.message
          );
        }
      }
    }

    console.log("\n🎉 Sample newsletter templates created successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Log in to your Directus admin panel.");
    console.log("2. Navigate to the 'Newsletter System' folder in Data Studio.");
    console.log("3. Go to the 'Newsletter Templates' collection.");
    console.log("4. Review the newly created templates.");
    console.log("5. For templates with image placeholders, upload images to the File Library and link them in the template's blocks.");
    console.log("6. Start creating newsletters based on these templates!");
  }

  async run() {
    console.log("🚀 Starting Newsletter Template Creation\n");

    if (!(await this.authenticate())) {
      return false;
    }

    try {
      await this.createTemplates();
      return true;
    } catch (error) {
      console.error("\n❌ Template creation failed:", error.message);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log("Directus Newsletter Template Creator");
    console.log("");
    console.log(
      "Usage: node create-newsletter-templates.js <directus-url> <email> <password>"
    );
    console.log("");
    console.log("Examples:");
    console.log(
      "  node create-newsletter-templates.js https://admin.example.com admin@example.com password123"
    );
    console.log("");
    console.log(
      "📋 Note: Run this AFTER installing basic and advanced collections/blocks."
    );
    process.exit(1);
  }

  const [directusUrl, email, password] = args;

  const creator = new NewsletterTemplateCreator(directusUrl, email, password);

  const success = await creator.run();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
