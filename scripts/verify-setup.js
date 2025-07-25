#!/usr/bin/env node

/**
 * Setup Verification Script for @hue-studios/nuxt-newsletter
 * Updated for ES modules and Tailwind CSS 4 support
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NewsletterSetupVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
    this.projectRoot = process.cwd();
  }

  log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      error: "❌",
      warning: "⚠️ ",
      success: "✅",
      info: "ℹ️ ",
    }[type] || "ℹ️ ";

    console.log(`${prefix} ${message}`);
  }

  async verifyPackageJson() {
    this.log("info", "Checking package.json dependencies...");

    const packageJsonPath = path.join(this.projectRoot, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      this.errors.push("package.json not found in project root");
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Updated for Tailwind CSS 4
    const requiredDeps = [
      "@hue-studios/nuxt-newsletter",
      "tailwindcss",
      "@tailwindcss/vite",
      "@nuxt/icon",
      "@vueuse/nuxt",
    ];

    const missingDeps = requiredDeps.filter((dep) => !dependencies[dep]);

    if (missingDeps.length > 0) {
      this.errors.push(
        `Missing required dependencies: ${missingDeps.join(", ")}`,
      );
      this.log("error", `Missing dependencies: ${missingDeps.join(", ")}`);
      this.log(
        "info",
        "Run: npm install tailwindcss@^4.0.0 @tailwindcss/vite @nuxt/icon @vueuse/nuxt",
      );
    } else {
      this.success.push("All required dependencies are installed");
      this.log("success", "All required dependencies found");
    }

    // Check Tailwind CSS version
    if (dependencies.tailwindcss) {
      const tailwindVersion = dependencies.tailwindcss.replace(/[\^~]/, "");
      if (tailwindVersion.startsWith("4.")) {
        this.success.push(
          `Tailwind CSS 4 detected: ${dependencies.tailwindcss}`,
        );
        this.log("success", `Tailwind CSS 4: ${dependencies.tailwindcss}`);
      } else {
        this.warnings.push(
          `Tailwind CSS 3 detected. Consider upgrading to v4 for best experience.`,
        );
        this.log("warning", `Consider upgrading to Tailwind CSS 4`);
      }
    }
  }

  async verifyNuxtConfig() {
    this.log("info", "Checking Nuxt configuration...");

    const configPaths = [
      "nuxt.config.ts",
      "nuxt.config.js",
      "nuxt.config.mjs",
    ];

    const configPath = configPaths.find((p) =>
      fs.existsSync(path.join(this.projectRoot, p)),
    );

    if (!configPath) {
      this.errors.push("Nuxt config file not found");
      return;
    }

    const configContent = fs.readFileSync(
      path.join(this.projectRoot, configPath),
      "utf8",
    );

    // Check for newsletter module
    if (configContent.includes("@hue-studios/nuxt-newsletter")) {
      this.success.push("Newsletter module is configured in Nuxt config");
      this.log("success", "Newsletter module found in config");
    } else {
      this.errors.push("Newsletter module not found in Nuxt modules array");
      this.log("error", "Add '@hue-studios/nuxt-newsletter' to modules");
    }

    // Check for basic newsletter config
    if (configContent.includes("newsletter:")) {
      this.success.push("Newsletter configuration block found");
      this.log("success", "Newsletter config block found");
    } else {
      this.warnings.push("No newsletter configuration block found");
      this.log("warning", "Consider adding newsletter config block");
    }
  }

  async verifyTailwindConfig() {
    this.log("info", "Checking Tailwind CSS configuration...");

    const configPaths = [
      "tailwind.config.ts",
      "tailwind.config.js",
      "tailwind.config.mjs",
    ];

    const configPath = configPaths.find((p) =>
      fs.existsSync(path.join(this.projectRoot, p)),
    );

    if (!configPath) {
      this.warnings.push("Tailwind config file not found");
      this.log("warning", "Tailwind config not found - module will auto-configure");
      return;
    }

    const configContent = fs.readFileSync(
      path.join(this.projectRoot, configPath),
      "utf8",
    );

    // Check for content paths
    if (configContent.includes("content:")) {
      this.success.push("Content paths configured");
      this.log("success", "Content paths found in config");
    } else {
      this.errors.push("No content paths found in Tailwind config");
      this.log("error", "Content paths are required for Tailwind CSS 4");
    }

    // Check for theme extensions
    if (configContent.includes("extend:")) {
      this.success.push("Theme extensions detected");
      this.log("success", "Custom theme extensions found");
    }
  }

  async verifyEnvironment() {
    this.log("info", "Checking environment variables...");

    const envPath = path.join(this.projectRoot, ".env");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    const requiredEnvVars = ["DIRECTUS_URL"];
    const optionalEnvVars = ["DIRECTUS_TOKEN", "SENDGRID_API_KEY", "SENDGRID_WEBHOOK_SECRET"];

    const missingRequired = requiredEnvVars.filter(
      (envVar) => !envContent.includes(envVar) && !process.env[envVar],
    );

    const missingOptional = optionalEnvVars.filter(
      (envVar) => !envContent.includes(envVar) && !process.env[envVar],
    );

    if (missingRequired.length > 0) {
      this.errors.push(
        `Missing required environment variables: ${missingRequired.join(", ")}`,
      );
      this.log("error", `Missing required env vars: ${missingRequired.join(", ")}`);
    } else {
      this.success.push("Required environment variables are configured");
      this.log("success", "Required environment variables found");
    }

    if (missingOptional.length > 0) {
      this.warnings.push(
        `Missing optional environment variables: ${missingOptional.join(", ")}`,
      );
      this.log("warning", `Optional env vars: ${missingOptional.join(", ")}`);
    }
  }

  async verifyDirectusCollections() {
    this.log("info", "Checking for Directus setup script...");

    const scriptPath = path.join(
      this.projectRoot,
      "scripts",
      "install-directus-collections.js",
    );

    if (fs.existsSync(scriptPath)) {
      this.success.push("Directus installation script found");
      this.log("success", "Directus setup script available");
    } else {
      this.warnings.push("Directus installation script not found");
      this.log("warning", "Consider running the Directus setup script");
      this.log(
        "info",
        "Download from: https://github.com/hue-studios/nuxt-newsletter/blob/main/scripts/install-directus-collections.js",
      );
    }
  }

  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📋 NEWSLETTER MODULE SETUP VERIFICATION");
    console.log("=".repeat(60));

    if (this.success.length > 0) {
      console.log("\n✅ SUCCESS:");
      this.success.forEach((item) => console.log(`   • ${item}`));
    }

    if (this.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      this.warnings.forEach((item) => console.log(`   • ${item}`));
    }

    if (this.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      this.errors.forEach((item) => console.log(`   • ${item}`));
    }

    console.log("\n" + "=".repeat(60));

    if (this.errors.length === 0) {
      if (this.warnings.length === 0) {
        console.log(
          "🎉 Perfect! Your Newsletter module setup is complete and ready to go!",
        );
      } else {
        console.log(
          "✅ Setup is functional! Address warnings for optimal experience.",
        );
      }
    } else {
      console.log("❌ Setup has critical issues that need to be resolved.");
      console.log("\n📚 For help, see:");
      console.log("   • README.md - Complete setup instructions");
      console.log("   • GitHub Issues - Report problems");
      console.log("   • https://github.com/hue-studios/nuxt-newsletter");
    }

    console.log("");
  }

  async run() {
    console.log("🔍 Verifying @hue-studios/nuxt-newsletter setup...");
    console.log("🚀 Tailwind CSS 4 support enabled!\n");

    await this.verifyPackageJson();
    await this.verifyNuxtConfig();
    await this.verifyTailwindConfig();
    await this.verifyEnvironment();
    await this.verifyDirectusCollections();

    this.printSummary();

    return this.errors.length === 0;
  }
}

// CLI Interface
async function main() {
  const verifier = new NewsletterSetupVerifier();
  const success = await verifier.run();
  process.exit(success ? 0 : 1);
}

// Check if this script is being run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export default NewsletterSetupVerifier;