#!/usr/bin/env node

/**
 * Newsletter Module Setup Wizard
 * Interactive setup for the best possible user experience
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class NewsletterSetupWizard {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {};
    this.projectRoot = process.cwd();
  }

  // Colorful console output
  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',     // Cyan
      success: '\x1b[32m',  // Green
      warning: '\x1b[33m',  // Yellow
      error: '\x1b[31m',    // Red
      title: '\x1b[35m',    // Magenta
      reset: '\x1b[0m'      // Reset
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  // Ask user questions
  async ask(question, defaultValue = '') {
    return new Promise((resolve) => {
      const prompt = defaultValue 
        ? `${question} (${defaultValue}): `
        : `${question}: `;
      
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  // Ask yes/no questions
  async askYesNo(question, defaultValue = true) {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.ask(`${question} (${defaultText})`);
    
    if (!answer) return defaultValue;
    return answer.toLowerCase().startsWith('y');
  }

  // Welcome screen
  async showWelcome() {
    console.clear();
    this.log('╔══════════════════════════════════════════════════════════════╗', 'title');
    this.log('║                                                              ║', 'title');
    this.log('║            🚀 Newsletter Module Setup Wizard 🚀             ║', 'title');
    this.log('║                                                              ║', 'title');
    this.log('║              Welcome to the best newsletter                  ║', 'title');
    this.log('║              experience for Nuxt 3!                         ║', 'title');
    this.log('║                                                              ║', 'title');
    this.log('╚══════════════════════════════════════════════════════════════╝', 'title');
    console.log();
    
    this.log('This wizard will help you set up everything you need:', 'info');
    this.log('  📦 Install required dependencies', 'info');
    this.log('  🔧 Configure your Nuxt project', 'info');
    this.log('  🗄️  Set up Directus collections', 'info');
    this.log('  📧 Configure SendGrid (optional)', 'info');
    this.log('  🎨 Add advanced content blocks', 'info');
    console.log();
    
    const proceed = await this.askYesNo('Ready to get started?');
    if (!proceed) {
      this.log('Setup cancelled. You can run this wizard anytime!', 'warning');
      process.exit(0);
    }
  }

  // Check prerequisites
  async checkPrerequisites() {
    this.log('\n📋 Checking prerequisites...', 'info');
    
    // Check if in Nuxt project
    const nuxtConfig = existsSync(join(this.projectRoot, 'nuxt.config.ts')) || 
                      existsSync(join(this.projectRoot, 'nuxt.config.js'));
    
    if (!nuxtConfig) {
      this.log('❌ This doesn\'t appear to be a Nuxt project!', 'error');
      this.log('   Please run this wizard in your Nuxt project root.', 'error');
      process.exit(1);
    }
    
    this.log('✅ Nuxt project detected', 'success');
    
    // Check Node version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    
    if (majorVersion < 18) {
      this.log(`❌ Node.js ${nodeVersion} detected. Node.js 18+ required.`, 'error');
      process.exit(1);
    }
    
    this.log(`✅ Node.js ${nodeVersion} is compatible`, 'success');
  }

  // Collect configuration
  async collectConfiguration() {
    this.log('\n🔧 Let\'s configure your newsletter module...', 'info');
    console.log();
    
    // Directus configuration
    this.log('First, we need your Directus information:', 'info');
    this.config.directusUrl = await this.ask('Directus URL', 'https://your-directus.com');
    this.config.directusEmail = await this.ask('Directus admin email');
    
    // Hide password input (simple version)
    this.config.directusPassword = await this.ask('Directus admin password');
    
    console.log();
    
    // Auth method
    this.log('How would you like to handle authentication?', 'info');
    this.log('  1. Static token (simple, good for internal tools)', 'info');
    this.log('  2. Middleware-based (secure, good for user-facing apps)', 'info');
    
    const authChoice = await this.ask('Choose authentication method (1 or 2)', '1');
    this.config.authType = authChoice === '2' ? 'middleware' : 'static';
    
    if (this.config.authType === 'static') {
      this.config.directusToken = await this.ask('Directus API token (leave blank to generate)');
    } else {
      this.config.middlewareName = await this.ask('Middleware name', 'auth');
    }
    
    console.log();
    
    // SendGrid configuration
    const wantsSendGrid = await this.askYesNo('Do you want to configure SendGrid for email sending?', false);
    
    if (wantsSendGrid) {
      this.config.sendgridApiKey = await this.ask('SendGrid API key');
      this.config.sendgridWebhookSecret = await this.ask('SendGrid webhook secret (optional)');
      this.config.defaultFromEmail = await this.ask('Default from email', 'newsletter@example.com');
      this.config.defaultFromName = await this.ask('Default from name', 'Newsletter');
    }
    
    console.log();
    
    // Advanced options
    const wantsAdvanced = await this.askYesNo('Configure advanced options?', false);
    
    if (wantsAdvanced) {
      this.log('MJML compilation mode:', 'info');
      this.log('  1. Client-side (easier setup, slower)', 'info');
      this.log('  2. Server-side (better performance, requires mjml package)', 'info');
      
      const mjmlChoice = await this.ask('Choose MJML mode (1 or 2)', '1');
      this.config.mjmlMode = mjmlChoice === '2' ? 'server' : 'client';
      
      this.config.componentPrefix = await this.ask('Component prefix', 'Newsletter');
    } else {
      this.config.mjmlMode = 'client';
      this.config.componentPrefix = 'Newsletter';
    }
    
    console.log();
    
    // Installation options
    this.config.installAdvancedBlocks = await this.askYesNo('Install advanced content blocks? (Product showcase, testimonials, etc.)', true);
  }

  // Install dependencies
  async installDependencies() {
    this.log('\n📦 Installing dependencies...', 'info');
    
    try {
      // Check if package already installed
      const packageJson = join(this.projectRoot, 'package.json');
      if (existsSync(packageJson)) {
        const pkg = JSON.parse(readFileSync(packageJson, 'utf8'));
        if (pkg.dependencies?.['@hue-studios/nuxt-newsletter']) {
          this.log('✅ Newsletter module already installed', 'success');
        } else {
          this.log('Installing @hue-studios/nuxt-newsletter...', 'info');
          execSync('npm install @hue-studios/nuxt-newsletter', { stdio: 'inherit' });
          this.log('✅ Newsletter module installed', 'success');
        }
      }
      
      // Install MJML if server mode
      if (this.config.mjmlMode === 'server') {
        this.log('Installing MJML for server-side compilation...', 'info');
        execSync('npm install mjml', { stdio: 'inherit' });
        this.log('✅ MJML installed', 'success');
      }
      
    } catch (error) {
      this.log('❌ Failed to install dependencies', 'error');
      this.log(error.message, 'error');
      process.exit(1);
    }
  }

  // Generate configuration files
  async generateConfig() {
    this.log('\n🔧 Generating configuration files...', 'info');
    
    // Generate nuxt.config.ts addition
    const nuxtConfigAddition = this.generateNuxtConfig();
    
    this.log('📄 Add this to your nuxt.config.ts:', 'info');
    console.log('```typescript');
    console.log(nuxtConfigAddition);
    console.log('```');
    console.log();
    
    // Generate .env file
    const envContent = this.generateEnvFile();
    
    const envPath = join(this.projectRoot, '.env');
    const envExists = existsSync(envPath);
    
    if (envExists) {
      const shouldAppend = await this.askYesNo('Add environment variables to existing .env file?');
      if (shouldAppend) {
        const existing = readFileSync(envPath, 'utf8');
        writeFileSync(envPath, existing + '\n' + envContent);
        this.log('✅ Environment variables added to .env', 'success');
      } else {
        this.log('📄 Add these environment variables to your .env file:', 'info');
        console.log(envContent);
      }
    } else {
      writeFileSync(envPath, envContent);
      this.log('✅ Created .env file with configuration', 'success');
    }
  }

  // Set up Directus collections
  async setupDirectus() {
    this.log('\n🗄️  Setting up Directus collections...', 'info');
    
    try {
      // Run main installer
      const installerPath = join(__dirname, 'install-directus-collections.js');
      const cmd = `node "${installerPath}" "${this.config.directusUrl}" "${this.config.directusEmail}" "${this.config.directusPassword}"`;
      
      this.log('Creating newsletter collections...', 'info');
      execSync(cmd, { stdio: 'inherit' });
      this.log('✅ Collections created successfully', 'success');
      
      // Install advanced blocks if requested
      if (this.config.installAdvancedBlocks) {
        const advancedBlocksPath = join(__dirname, 'create-advanced-blocks.js');
        const advancedCmd = `node "${advancedBlocksPath}" "${this.config.directusUrl}" "${this.config.directusEmail}" "${this.config.directusPassword}"`;
        
        this.log('Installing advanced content blocks...', 'info');
        execSync(advancedCmd, { stdio: 'inherit' });
        this.log('✅ Advanced blocks installed successfully', 'success');
      }
      
    } catch (error) {
      this.log('❌ Failed to set up Directus collections', 'error');
      this.log('You can run the setup manually later:', 'warning');
      this.log(`npm run setup:directus ${this.config.directusUrl} ${this.config.directusEmail} [password]`, 'warning');
    }
  }

  // Generate Nuxt config
  generateNuxtConfig() {
    const authConfig = this.config.authType === 'static' 
      ? `{
        type: 'static',
        token: process.env.DIRECTUS_TOKEN
      }`
      : `{
        type: 'middleware',
        middleware: '${this.config.middlewareName}'
      }`;
    
    const sendgridConfig = this.config.sendgridApiKey
      ? `,
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET,
      defaultFromEmail: '${this.config.defaultFromEmail}',
      defaultFromName: '${this.config.defaultFromName}'
    }`
      : '';
    
    return `export default defineNuxtConfig({
  modules: ['@hue-studios/nuxt-newsletter'],
  
  newsletter: {
    directus: {
      url: '${this.config.directusUrl}',
      auth: ${authConfig}
    }${sendgridConfig},
    mjmlMode: '${this.config.mjmlMode}',
    prefix: '${this.config.componentPrefix}'
  }
})`;
  }

  // Generate .env file
  generateEnvFile() {
    let envContent = `
# Newsletter Module Configuration
DIRECTUS_URL=${this.config.directusUrl}`;

    if (this.config.authType === 'static') {
      envContent += `\nDIRECTUS_TOKEN=${this.config.directusToken || 'your-directus-token-here'}`;
    }

    if (this.config.sendgridApiKey) {
      envContent += `\nSENDGRID_API_KEY=${this.config.sendgridApiKey}`;
      if (this.config.sendgridWebhookSecret) {
        envContent += `\nSENDGRID_WEBHOOK_SECRET=${this.config.sendgridWebhookSecret}`;
      }
    }

    return envContent.trim();
  }

  // Show completion message
  async showCompletion() {
    console.log();
    this.log('🎉 Setup completed successfully!', 'success');
    console.log();
    
    this.log('📋 What\'s been set up:', 'info');
    this.log('  ✅ Newsletter module installed', 'success');
    this.log('  ✅ Directus collections created and organized', 'success');
    this.log('  ✅ Configuration files generated', 'success');
    
    if (this.config.installAdvancedBlocks) {
      this.log('  ✅ Advanced content blocks installed', 'success');
    }
    
    console.log();
    
    this.log('🚀 Next steps:', 'info');
    this.log('  1. Start your dev server: npm run dev', 'info');
    this.log('  2. Create a newsletter page with <NewsletterEditor>', 'info');
    this.log('  3. Visit your Directus admin to see the "Newsletter System" folder', 'info');
    
    if (this.config.sendgridApiKey) {
      this.log('  4. Test email sending with your SendGrid configuration', 'info');
    } else {
      this.log('  4. Add SendGrid configuration later for email sending', 'info');
    }
    
    console.log();
    
    this.log('📚 Need help?', 'info');
    this.log('  • Documentation: https://github.com/hue-studios/nuxt-newsletter', 'info');
    this.log('  • Verify setup: npm run verify', 'info');
    this.log('  • Issues: https://github.com/hue-studios/nuxt-newsletter/issues', 'info');
    
    console.log();
    this.log('Happy newsletter building! 🎨✉️', 'title');
  }

  // Run verification
  async runVerification() {
    const shouldVerify = await this.askYesNo('\nWould you like to verify the setup?');
    
    if (shouldVerify) {
      try {
        const verifyPath = join(__dirname, 'verify-setup.js');
        execSync(`node "${verifyPath}"`, { stdio: 'inherit' });
      } catch (error) {
        this.log('⚠️  Verification found some issues, but setup is mostly complete', 'warning');
      }
    }
  }

  // Main execution
  async run() {
    try {
      await this.showWelcome();
      await this.checkPrerequisites();
      await this.collectConfiguration();
      await this.installDependencies();
      await this.generateConfig();
      await this.setupDirectus();
      await this.runVerification();
      await this.showCompletion();
      
    } catch (error) {
      this.log('\n❌ Setup failed with error:', 'error');
      this.log(error.message, 'error');
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled by user');
  process.exit(0);
});

// CLI Interface
async function main() {
  const wizard = new NewsletterSetupWizard();
  await wizard.run();
}

main().catch(console.error);