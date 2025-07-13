# 🚀 Newsletter Module - Quick Start (5 Minutes!)

> **New to newsletters?** Don't worry! This guide will get you up and running in just 5 minutes, even if you're not technical.

## Before You Start

You'll need:
- ✅ A Nuxt 3 project
- ✅ A Directus account (free at [directus.io](https://directus.io))
- ✅ A SendGrid account (free at [sendgrid.com](https://sendgrid.com)) *optional*

## Step 1: Install the Module ⚡

```bash
npm install @hue-studios/nuxt-newsletter
```

## Step 2: Run the Setup Wizard 🧙‍♂️

```bash
npx @hue-studios/nuxt-newsletter setup
```

The wizard will ask you simple questions and set everything up automatically!

## Step 3: Add to Your Page 📄

Create a new page `pages/newsletter.vue`:

```vue
<template>
  <div>
    <h1>Create Newsletter</h1>
    <NewsletterEditor v-model="newsletter" />
  </div>
</template>

<script setup>
const newsletter = ref({
  subject: '',
  blocks: []
})
</script>
```

## Step 4: Start Creating! 🎨

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/newsletter`
3. Click the content blocks to add them
4. Fill in your content
5. See the live preview on the right!

## 🎯 Common Blocks to Try

- **Hero Section** - Great for headers with big text
- **Text Block** - Perfect for paragraphs and articles  
- **Button** - Call-to-action buttons
- **Image** - Add photos and graphics

## 🔧 Need Help?

### "I can't connect to Directus"
- Check your Directus URL is correct
- Make sure your token has the right permissions
- Run: `npm run newsletter:verify`

### "Blocks aren't showing"
- Run the setup wizard again: `npx @hue-studios/nuxt-newsletter setup`
- Or manually: `npm run newsletter:setup [directus-url] [email] [password]`

### "Can't send emails"
- You need a SendGrid account and API key
- Add `SENDGRID_API_KEY=your-key-here` to your `.env` file

## 📚 What's Next?

- [Full Documentation](README.md)
- [Video Tutorials](#) *(coming soon)*
- [Community Discord](#) *(coming soon)*

## 🆘 Still Stuck?

1. Check our [FAQ](FAQ.md)
2. Look at [example projects](examples/)
3. [Open an issue](https://github.com/hue-studios/nuxt-newsletter/issues) - we're here to help!

---

**Remember:** Everyone starts somewhere! Don't be afraid to experiment and try things out. The worst that can happen is you learn something new! 🌟