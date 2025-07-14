#!/usr/bin/env node

/**
 * Post-install script to guide users through next steps
 * Only runs when installed as a dependency, not during development
 */

const path = require('path');
const fs = require('fs');

function isInDevelopment() {
  // Check if we're in the module's own directory (development)
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return pkg.name === '@hue-studios/nuxt-newsletter';
  }
  return false;
}

function isInNuxtProject() {
  // Check if the parent project has nuxt.config
  const nuxtConfig = fs.existsSync('nuxt.config.ts') || fs.existsSync('nuxt.config.js');
  return nuxtConfig;
}

function showWelcomeMessage() {
  const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m'
  };

  console.log(`
${colors.magenta}╔══════════════════════════════════════════════════════════════╗${colors.reset}
${colors.magenta}║                                                              ║${colors.reset}
${colors.magenta}║       🎉 Newsletter Module Installed Successfully! 🎉       ║${colors.reset}
${colors.magenta}║                                                              ║${colors.reset}
${colors.magenta}╚══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.cyan}🚀 Quick Start (2 minutes):${colors.reset}

${colors.green}1. Run the setup wizard:${colors.reset}
   ${colors.yellow}npm run newsletter:setup-wizard${colors.reset}

${colors.green}2. Add to your page:${colors.reset}
   ${colors.yellow}<NewsletterEditor v-model="newsletter" />${colors.reset}

${colors.green}3. Start your dev server:${colors.reset}
   ${colors.yellow}npm run dev${colors.reset}

${colors.cyan}📚 Other helpful commands:${colors.reset}
   ${colors.yellow}npm run newsletter:verify${colors.reset}          # Check your setup
   ${colors.yellow}npm run newsletter:advanced-blocks${colors.reset}  # Add more block types

${colors.cyan}🆘 Need help?${colors.reset}
   • Docs: https://github.com/hue-studios/nuxt-newsletter
   • Issues: https://github.com/hue-studios/nuxt-newsletter/issues

${colors.green}Happy newsletter building! ✉️${colors.reset}
`);
}

// Only show message if installed as dependency in a Nuxt project
if (!isInDevelopment() && isInNuxtProject()) {
  showWelcomeMessage();
}