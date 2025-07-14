// scripts/install-sample-content.js
async function installPlaceholderContent() {
  console.log('📦 Installing placeholder content for blocks...')
  
  const placeholderContent = {
    hero: {
      title: 'Welcome to Our Newsletter!',
      subtitle: 'Stay updated with the latest news and insights',
      button_text: 'Learn More',
      button_url: 'https://example.com',
      background_color: '#f8fafc',
      text_color: '#1f2937'
    },
    text: {
      text_content: 'Add your main content here. You can use <strong>HTML formatting</strong> to make text <em>italic</em> or <a href="#">add links</a>.',
      background_color: '#ffffff',
      text_color: '#374151'
    },
    'cta-section': {
      cta_title: 'Ready to Get Started?',
      cta_subtitle: 'Join thousands of satisfied customers',
      primary_button_text: 'Get Started',
      primary_button_url: 'https://example.com/signup',
      secondary_button_text: 'Learn More',
      secondary_button_url: 'https://example.com/about'
    },
    'product-showcase': {
      title: 'Featured Product',
      subtitle: 'Perfect for your needs',
      price: '$99.99',
      button_text: 'Shop Now',
      button_url: 'https://example.com/product'
    }
  }
  
  // Update addBlockFromType in NewsletterEditor.vue to use these defaults
  // Instead of minimal content, use rich placeholder content
}