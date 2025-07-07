#!/usr/bin/env node

/**
 * Setup Verification Script for @hue-studios/nuxt-newsletter
 * Updated for Tailwind CSS 4 support
 *
 * This script verifies that all required dependencies and configurations
 * are properly set up for the newsletter module to work correctly.
 */

const fs = require("fs");
const path = require("path");

class NewsletterSetupVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
    this.projectRoot = process.cwd();
  }

  log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix =
      {
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
      "shadcn-nuxt",
      "@nuxtjs/color-mode",
    ];

    const missingDeps = requiredDeps.filter((dep) => !dependencies[dep]);

    if (missingDeps.length > 0) {
      this.errors.push(
        `Missing required dependencies: ${missingDeps.join(", ")}`
      );
      this.log("error", `Missing dependencies: ${missingDeps.join(", ")}`);
      this.log(
        "info",
        "Run: npm install tailwindcss @tailwindcss/vite shadcn-nuxt @nuxtjs/color-mode"
      );
    } else {
      this.success.push("All required dependencies are installed");
      this.log("success", "All required dependencies found");
    }

    // Check Tailwind CSS version
    if (dependencies.tailwindcss) {
      const tailwindVersion = dependencies.tailwindcss.replace(/[\^\~]/, "");
      if (tailwindVersion.startsWith("4.")) {
        this.success.push(
          `Tailwind CSS 4 detected: ${dependencies.tailwindcss}`
        );
        this.log("success", `Tailwind CSS 4: ${dependencies.tailwindcss}`);
      } else {
        this.warnings.push(
          `Tailwind CSS 3 detected. Consider upgrading to v4 for better performance: ${dependencies.tailwindcss}`
        );
        this.log(
          "warning",
          `Tailwind CSS 3 detected: ${dependencies.tailwindcss}`
        );
      }
    }

    // Check versions
    requiredDeps.forEach((dep) => {
      if (dependencies[dep]) {
        this.log("info", `${dep}: ${dependencies[dep]}`);
      }
    });
  }

  async verifyNuxtConfig() {
    this.log("info", "Checking nuxt.config.ts configuration...");

    const configPaths = [
      path.join(this.projectRoot, "nuxt.config.ts"),
      path.join(this.projectRoot, "nuxt.config.js"),
    ];

    let configPath = null;
    let configContent = null;

    for (const cp of configPaths) {
      if (fs.existsSync(cp)) {
        configPath = cp;
        configContent = fs.readFileSync(cp, "utf8");
        break;
      }
    }

    if (!configPath) {
      this.errors.push("nuxt.config.ts or nuxt.config.js not found");
      return;
    }

    // Updated for Tailwind CSS 4 setup
    const requiredModules = [
      "shadcn-nuxt",
      "@nuxtjs/color-mode",
      "@hue-studios/nuxt-newsletter",
    ];

    const missingModules = requiredModules.filter(
      (module) =>
        !configContent.includes(`'${module}'`) &&
        !configContent.includes(`"${module}"`)
    );

    if (missingModules.length > 0) {
      this.errors.push(
        `Missing modules in nuxt.config: ${missingModules.join(", ")}`
      );
      this.log(
        "error",
        `Missing modules in config: ${missingModules.join(", ")}`
      );
    } else {
      this.success.push("All required modules are configured");
      this.log("success", "All required modules found in config");
    }

    // Check for Tailwind CSS 4 Vite plugin
    if (
      configContent.includes("tailwindcss()") &&
      configContent.includes("vite:")
    ) {
      this.success.push("Tailwind CSS 4 Vite plugin detected");
      this.log("success", "Tailwind CSS 4 Vite plugin configured");
    } else {
      this.warnings.push(
        "Tailwind CSS 4 Vite plugin not detected in nuxt.config"
      );
      this.log("warning", "Tailwind CSS 4 Vite plugin not found");
      this.log("info", "Add to your nuxt.config.ts:");
      this.log("info", "import tailwindcss from '@tailwindcss/vite'");
      this.log("info", "vite: { plugins: [tailwindcss()] }");
    }

    // Check for newsletter config
    if (
      configContent.includes("newsletter:") ||
      configContent.includes("newsletter =")
    ) {
      this.success.push("Newsletter module configuration found");
      this.log("success", "Newsletter configuration found");
    } else {
      this.warnings.push(
        "Newsletter module configuration not found in nuxt.config"
      );
      this.log("warning", "Newsletter configuration section not found");
    }

    // Check for shadcn config
    if (
      configContent.includes("shadcn:") ||
      configContent.includes("shadcn =")
    ) {
      this.success.push("Shadcn configuration found");
      this.log("success", "Shadcn configuration found");
    } else {
      this.warnings.push("Shadcn configuration not found in nuxt.config");
      this.log("warning", "Shadcn configuration section not found");
    }
  }

  async verifyShadcnComponents() {
    this.log("info", "Checking Shadcn components...");

    const componentsPath = path.join(this.projectRoot, "components", "ui");

    if (!fs.existsSync(componentsPath)) {
      this.errors.push("Shadcn components directory not found (components/ui)");
      this.log(
        "error",
        "Shadcn not initialized. Run: npx shadcn-vue@latest init"
      );
      return;
    }

    const requiredComponents = [
      "button.vue",
      "input.vue",
      "label.vue",
      "textarea.vue",
      "dialog.vue",
      "badge.vue",
      "card.vue",
      "sonner.vue",
      "tabs.vue",
      "dropdown-menu.vue",
      "select.vue",
      "switch.vue",
      "slider.vue",
      "toast.vue",
      "alert.vue",
      "separator.vue",
      "progress.vue",
    ];

    const existingComponents = fs.readdirSync(componentsPath);
    const missingComponents = requiredComponents.filter(
      (comp) => !existingComponents.includes(comp)
    );

    if (missingComponents.length > 0) {
      this.warnings.push(
        `Missing Shadcn components: ${missingComponents.join(", ")}`
      );
      this.log(
        "warning",
        `Missing components: ${missingComponents.join(", ")}`
      );
      this.log(
        "info",
        `Run: npx shadcn-vue@latest add ${missingComponents
          .map((c) => c.replace(".vue", ""))
          .join(" ")}`
      );
    } else {
      this.success.push("All required Shadcn components are installed");
      this.log("success", "All required Shadcn components found");
    }
  }

  async verifyTailwindConfig() {
    this.log("info", "Checking Tailwind configuration...");

    const tailwindConfigPaths = [
      path.join(this.projectRoot, "tailwind.config.js"),
      path.join(this.projectRoot, "tailwind.config.ts"),
    ];

    let configPath = null;
    let configContent = null;

    for (const cp of tailwindConfigPaths) {
      if (fs.existsSync(cp)) {
        configPath = cp;
        configContent = fs.readFileSync(cp, "utf8");
        break;
      }
    }

    if (!configPath) {
      this.warnings.push("tailwind.config.js not found");
      this.log("warning", "Tailwind config not found");
      this.log("info", "Create a tailwind.config.js for optimal setup");
      return;
    }

    // Check if module paths are included
    if (configContent.includes("@hue-studios/nuxt-newsletter")) {
      this.success.push("Newsletter module paths included in Tailwind config");
      this.log("success", "Module paths found in Tailwind config");
    } else {
      this.warnings.push(
        "Newsletter module paths not found in Tailwind config"
      );
      this.log("warning", "Add module paths to Tailwind content array");
      this.log(
        "info",
        'Add: "./node_modules/@hue-studios/nuxt-newsletter/dist/**/*.{js,vue,ts}"'
      );
    }
  }

  async verifyEnvironment() {
    this.log("info", "Checking environment variables...");

    const envPath = path.join(this.projectRoot, ".env");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    const requiredEnvVars = ["DIRECTUS_URL", "SENDGRID_API_KEY"];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !envContent.includes(envVar) && !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      this.warnings.push(
        `Missing environment variables: ${missingEnvVars.join(", ")}`
      );
      this.log("warning", `Missing env vars: ${missingEnvVars.join(", ")}`);
    } else {
      this.success.push("Required environment variables are configured");
      this.log("success", "Environment variables configured");
    }
  }

  async verifyDirectusCollections() {
    this.log("info", "Checking for Directus setup script...");

    const scriptPath = path.join(
      this.projectRoot,
      "scripts",
      "install-directus-collections.js"
    );

    if (fs.existsSync(scriptPath)) {
      this.success.push("Directus installation script found");
      this.log("success", "Directus setup script available");
    } else {
      this.warnings.push("Directus installation script not found");
      this.log("warning", "Consider running the Directus setup script");
      this.log(
        "info",
        "Download from: https://github.com/hue-studios/nuxt-newsletter/blob/main/scripts/install-directus-collections.js"
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
          "🎉 Perfect! Your Tailwind CSS 4 setup is complete and ready to go!"
        );
      } else {
        console.log(
          "✅ Setup is functional! Address warnings for optimal experience."
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
    await this.verifyShadcnComponents();
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

if (require.main === module) {
  main().catch(console.error);
}

module.exports = NewsletterSetupVerifier;
