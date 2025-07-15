// scripts/fix-block-icons.js
// This script fixes the icon names in your Directus block_types collection

import {
    authentication,
    createDirectus,
    readItems,
    rest,
    updateItem,
} from '@directus/sdk';

// Icon name mapping from invalid to valid Lucide icons
const ICON_FIXES = {
  // Original fixes
  'title': 'lucide:heading',
  'image': 'lucide:image',
  'text_fields': 'lucide:type',
  'button': 'lucide:mouse-pointer-click',
  'storefront': 'lucide:store',
  'person': 'lucide:user',
  'bar_chart': 'lucide:bar-chart',
  'quote': 'lucide:quote',
  'social_media': 'lucide:share-2',
  'divider': 'lucide:minus',
  'spacer': 'lucide:space',
  'footer': 'lucide:layout-footer',
  
  // Additional fixes for icons that just got prefixed
  'smart_button': 'lucide:mouse-pointer-click',
  'share': 'lucide:share-2',
  'event': 'lucide:calendar',
  'checklist': 'lucide:check-square',
  'format_quote': 'lucide:quote',
  'view_column': 'lucide:columns',
  'campaign': 'lucide:megaphone',
  'linear_scale': 'lucide:trending-up',
  
  // Handle the prefixed versions too
  'lucide:smart_button': 'lucide:mouse-pointer-click',
  'lucide:share': 'lucide:share-2',
  'lucide:event': 'lucide:calendar',
  'lucide:checklist': 'lucide:check-square',
  'lucide:format_quote': 'lucide:quote',
  'lucide:view_column': 'lucide:columns',
  'lucide:campaign': 'lucide:megaphone',
  'lucide:linear_scale': 'lucide:trending-up'
};

class DirectusIconFixer {
  constructor(directusUrl, email, password) {
    this.directus = createDirectus(directusUrl)
      .with(rest())
      .with(authentication());
    this.email = email;
    this.password = password;
  }

  async authenticate() {
    try {
      await this.directus.login({ email: this.email, password: this.password });
      console.log('✅ Successfully authenticated with Directus');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async fixBlockIcons() {
    console.log('🔧 Fixing block type icons...');

    try {
      // Read all block types
      const blockTypes = await this.directus.request(
        readItems('block_types', {
          fields: ['id', 'name', 'slug', 'icon'],
          limit: -1
        })
      );

      console.log(`📋 Found ${blockTypes.length} block types`);

      let fixedCount = 0;

      // Update each block type with fixed icon
      for (const blockType of blockTypes) {
        const currentIcon = blockType.icon;
        let fixedIcon = null;
        let updateReason = '';

        // Check if icon needs fixing (direct match)
        if (ICON_FIXES[currentIcon]) {
          fixedIcon = ICON_FIXES[currentIcon];
          updateReason = 'mapped to valid icon';
        } 
        // Check if it's a prefixed icon that still needs fixing
        else if (currentIcon && currentIcon.startsWith('lucide:') && ICON_FIXES[currentIcon]) {
          fixedIcon = ICON_FIXES[currentIcon];
          updateReason = 'fixed invalid prefixed icon';
        }
        // Add prefix to non-prefixed icons (only if not already in fixes)
        else if (currentIcon && !currentIcon.startsWith('lucide:') && !ICON_FIXES[currentIcon]) {
          // Check if the prefixed version would be valid by testing common Lucide icons
          const prefixedIcon = `lucide:${currentIcon}`;
          const commonLucideIcons = [
            'menu', 'settings', 'home', 'users', 'mail', 'phone', 'search', 'heart',
            'star', 'bookmark', 'download', 'upload', 'edit', 'trash', 'save', 'copy',
            'cut', 'paste', 'undo', 'redo', 'play', 'pause', 'stop', 'volume', 'mute',
            'calendar', 'clock', 'map', 'location', 'camera', 'video', 'music', 'folder',
            'file', 'database', 'server', 'cloud', 'wifi', 'bluetooth', 'battery', 'power',
            'lock', 'unlock', 'eye', 'eye-off', 'shield', 'key', 'alert', 'info', 'help',
            'x', 'plus', 'minus', 'check', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right'
          ];
          
          if (commonLucideIcons.includes(currentIcon)) {
            fixedIcon = prefixedIcon;
            updateReason = 'added lucide prefix';
          } else {
            // For unknown icons, use a generic fallback
            fixedIcon = 'lucide:square';
            updateReason = 'unknown icon, using fallback';
          }
        }

        if (fixedIcon && fixedIcon !== currentIcon) {
          console.log(`🔄 Updating ${blockType.name}: ${currentIcon} → ${fixedIcon} (${updateReason})`);

          await this.directus.request(
            updateItem('block_types', blockType.id, {
              icon: fixedIcon
            })
          );

          fixedCount++;
        }
      }

      console.log(`✅ Fixed ${fixedCount} block type icons`);
      
      if (fixedCount === 0) {
        console.log('ℹ️  No icons needed fixing');
      } else {
        console.log('🎉 All block type icons are now using valid Lucide icons');
      }

      return fixedCount;

    } catch (error) {
      console.error('❌ Error fixing block icons:', error);
      throw error;
    }
  }
}

async function main() {
  const [directusUrl, email, password] = process.argv.slice(2);

  if (!directusUrl || !email || !password) {
    console.error(`
❌ Missing required arguments

Usage: node scripts/fix-block-icons.js <directus-url> <email> <password>

Example:
  node scripts/fix-block-icons.js http://localhost:8055 admin@example.com password123

Arguments:
  directus-url    Your Directus instance URL
  email          Admin email address
  password       Admin password
`);
    process.exit(1);
  }

  console.log('🚀 Starting Directus block icon fix...');
  console.log(`📍 Directus URL: ${directusUrl}`);
  console.log(`👤 Email: ${email}`);
  console.log('');

  try {
    const fixer = new DirectusIconFixer(directusUrl, email, password);
    
    const authenticated = await fixer.authenticate();
    if (!authenticated) {
      process.exit(1);
    }

    const fixedCount = await fixer.fixBlockIcons();
    
    console.log('\n🎉 Icon fix completed successfully!');
    console.log(`📊 Total icons fixed: ${fixedCount}`);

  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('💡 Please check your email and password');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Please check your Directus URL and ensure the server is running');
    } else if (error.message.includes('block_types')) {
      console.error('💡 Please ensure the block_types collection exists in your Directus instance');
    }
    
    process.exit(1);
  }
}

// Auto-run when script is executed directly
main();

export { DirectusIconFixer, ICON_FIXES };
