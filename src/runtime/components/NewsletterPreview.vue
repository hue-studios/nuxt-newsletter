<template>
  <div class="newsletter-preview-container" :class="`preview-device-${device}`">
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="lucide:eye" class="w-4 h-4" />
        <span>Preview</span>
        <span v-if="lastRefreshTime" class="last-refresh">
          Last updated: {{ formatTime(lastRefreshTime) }}
        </span>
      </div>
      
      <div class="preview-controls">
        <!-- Device Toggle Controls -->
        <div class="device-switcher">
          <button 
            v-for="deviceOption in deviceOptions" 
            :key="deviceOption.value"
            @click="setDevice(deviceOption.value)"
            :class="['device-button', { active: device === deviceOption.value }]"
            :title="`Preview on ${deviceOption.label}`"
          >
            <Icon :name="deviceOption.icon" class="w-4 h-4" />
            <span class="device-label">{{ deviceOption.label }}</span>
          </button>
        </div>
        
        <div class="divider" />
        
        <!-- Action Controls -->
        <button 
          @click="refreshPreview" 
          :disabled="isCompiling"
          :class="['control-button', 'refresh-button', { 'loading': isCompiling }]" 
          title="Refresh preview (Ctrl+R)"
        >
          <Icon :name="isCompiling ? 'lucide:loader-2' : 'lucide:refresh-cw'" 
                :class="['w-4 h-4', { 'animate-spin': isCompiling }]" />
          <span class="button-text">{{ isCompiling ? 'Updating...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="preview-content">
      <div class="email-preview-frame">
        <div class="preview-iframe-container">
          <!-- Loading State -->
          <div v-if="isCompiling" class="loading-state">
            <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-blue-500" />
            <p>{{ currentStep || 'Compiling newsletter...' }}</p>
            <small>This may take a moment</small>
          </div>

          <!-- Error State -->
          <div v-else-if="compilationError" class="compilation-error">
            <Icon name="lucide:alert-triangle" class="w-8 h-8 text-red-500" />
            <h3>Preview Error</h3>
            <p>{{ compilationError.message }}</p>
            <button @click="refreshPreview" class="btn-retry">
              <Icon name="lucide:refresh-cw" class="w-4 h-4" />
              Try Again
            </button>
          </div>

          <!-- Success State -->
          <iframe
            v-else-if="compiledHtml"
            ref="previewIframe"
            :srcdoc="compiledHtml"
            class="preview-iframe"
            :class="deviceClasses"
            sandbox="allow-same-origin"
            title="Newsletter Preview"
          />

          <!-- Empty State -->
          <div v-else class="empty-preview">
            <Icon name="lucide:mail" class="w-12 h-12 text-gray-400" />
            <h3>No content to preview</h3>
            <p>Add blocks to your newsletter to see the preview here.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface NewsletterData {
  id?: string
  subject?: string
  preheader?: string
  blocks?: any[]
  [key: string]: any
}

interface CompilationError {
  message: string
  step?: string
  originalError?: any
}

interface Props {
  newsletter?: NewsletterData
  blockTypes?: any[]
  devices?: ('mobile' | 'tablet')[]
  defaultDevice?: 'mobile' | 'tablet'
  mjmlApi?: string
  mjmlApiKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  devices: () => ['mobile', 'tablet'],
  defaultDevice: 'mobile'
})

const emit = defineEmits<{
  'error': [error: CompilationError]
}>()

// State
const device = ref(props.defaultDevice)
const compiledHtml = ref<string>('')
const isCompiling = ref(false)
const compilationError = ref<CompilationError | null>(null)
const currentStep = ref<string | null>(null)
const lastRefreshTime = ref<Date | null>(null)
const previewIframe = ref<HTMLIFrameElement>()

// Device options
const deviceOptions = computed(() => {
  return props.devices.map(deviceType => ({
    value: deviceType,
    label: deviceType.charAt(0).toUpperCase() + deviceType.slice(1),
    icon: deviceType === 'mobile' ? 'lucide:smartphone' : 'lucide:tablet'
  }))
})

// Device classes for iframe styling
const deviceClasses = computed(() => {
  return {
    'device-mobile': device.value === 'mobile',
    'device-tablet': device.value === 'tablet'
  }
})

// Methods
const setDevice = (newDevice: 'mobile' | 'tablet') => {
  device.value = newDevice
}

// FIXED: Manual refresh only - no automatic reactive compilation
const refreshPreview = async () => {
  console.log('Manual preview refresh triggered')
  
  if (isCompiling.value) {
    console.log('Already compiling, skipping refresh')
    return
  }

  if (!props.newsletter?.blocks?.length) {
    console.log('No blocks to compile')
    compiledHtml.value = ''
    compilationError.value = null
    return
  }

  await compileNewsletter()
}

const compileNewsletter = async () => {
  isCompiling.value = true
  compilationError.value = null
  currentStep.value = 'Preparing MJML...'

  try {
    // Generate MJML
    currentStep.value = 'Generating MJML...'
    const mjml = generateMjml()
    
    if (!mjml.trim()) {
      throw new Error('Generated MJML is empty')
    }

    // Compile MJML to HTML
    currentStep.value = 'Compiling to HTML...'
    const html = await compileMjmlToHtml(mjml)
    
    if (!html || !html.trim()) {
      throw new Error('Compilation resulted in empty HTML')
    }

    // Update state
    compiledHtml.value = html
    lastRefreshTime.value = new Date()
    currentStep.value = null
    
    console.log('Preview compiled successfully')

  } catch (error: any) {
    console.error('Preview compilation failed:', error)
    
    const compilationErr: CompilationError = {
      message: error?.message || 'Unknown compilation error',
      step: currentStep.value || undefined,
      originalError: error
    }
    
    compilationError.value = compilationErr
    compiledHtml.value = ''
    emit('error', compilationErr)
  } finally {
    isCompiling.value = false
    currentStep.value = null
  }
}

const generateMjml = (): string => {
  if (!props.newsletter?.blocks?.length) {
    return createEmptyMjml()
  }

  console.log('Generating MJML for blocks:', props.newsletter.blocks)

  let bodyContent = ''
  
  props.newsletter.blocks.forEach((block: any) => {
    const blockType = props.blockTypes?.find(bt => 
      bt.id === block.block_type || bt.slug === block.type
    )
    
    if (!blockType?.mjml_template) {
      console.warn(`No MJML template for block type: ${block.type}`, blockType)
      return
    }

    // Replace placeholders with actual content
    let mjml = blockType.mjml_template
    if (block.content) {
      Object.entries(block.content).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g')
        mjml = mjml.replace(placeholder, String(value || ''))
      })
    }
    
    bodyContent += mjml + '\n'
  })

  // Build complete MJML document
  const fullMjml = `
    <mjml>
      <mj-head>
        <mj-title>${props.newsletter.subject || 'Newsletter'}</mj-title>
        <mj-preview>${props.newsletter.preheader || ''}</mj-preview>
        <mj-attributes>
          <mj-all font-family="Arial, sans-serif" />
          <mj-text font-size="14px" line-height="1.6" />
        </mj-attributes>
        <mj-style>
          @media only screen and (max-width: 480px) {
            .mobile-hide { display: none !important; }
            .mobile-center { text-align: center !important; }
          }
        </mj-style>
      </mj-head>
      <mj-body>
        ${bodyContent || '<mj-section><mj-column><mj-text>No content blocks added yet.</mj-text></mj-column></mj-section>'}
      </mj-body>
    </mjml>
  `

  console.log('Generated MJML:', fullMjml)
  return fullMjml
}

const createEmptyMjml = (): string => {
  return `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text align="center" color="#666666">
              Add blocks to your newsletter to see the preview here.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
}

const compileMjmlToHtml = async (mjml: string): Promise<string> => {
  try {
    // Try server-side MJML compilation API first (preferred)
    try {
      console.log('Using server-side MJML compilation')
      const response = await $fetch('/api/newsletter/compile-mjml', {
        method: 'POST',
        body: { mjml }
      })
      
      if (response.errors?.length) {
        console.warn('MJML compilation warnings:', response.errors)
      }
      
      if (response.html) {
        return response.html
      }
    } catch (apiError) {
      console.warn('Server-side compilation failed, trying alternatives:', apiError)
    }

    // Try browser-based MJML compilation
    if (typeof window !== 'undefined' && (window as any).mjml) {
      console.log('Using browser MJML compiler')
      const result = (window as any).mjml(mjml)
      
      if (result.errors?.length) {
        console.warn('MJML browser compilation warnings:', result.errors)
      }
      
      if (result.html) {
        return result.html
      }
    }

    // External API fallback
    if (props.mjmlApi) {
      console.log('Using external MJML API compilation')
      const response = await fetch(props.mjmlApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(props.mjmlApiKey && { 'Authorization': `Bearer ${props.mjmlApiKey}` })
        },
        body: JSON.stringify({ mjml })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.errors?.length) {
        console.warn('External API compilation warnings:', result.errors)
      }

      if (result.html) {
        return result.html
      }
    }

    // Final fallback - generate email-like template
    console.warn('No MJML compiler available, using email template fallback')
    return generateEmailTemplate()

  } catch (error) {
    console.error('MJML compilation failed:', error)
    throw error
  }
}

const generateEmailTemplate = (): string => {
  const subject = props.newsletter?.subject || 'Newsletter'
  const preheader = props.newsletter?.preheader || ''
  
  let emailContent = ''
  
  if (props.newsletter?.blocks?.length) {
    props.newsletter.blocks.forEach((block: any) => {
      const blockType = props.blockTypes?.find(bt => 
        bt.id === block.block_type || bt.slug === block.type
      )
      
      // Create email-like block rendering
      emailContent += `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
      `
      
      // Render block based on type
      if (block.type === 'hero' && block.content) {
        emailContent += `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align: center; background-color: ${block.content.background_color || '#f8fafc'}; padding: 40px 20px; border-radius: 8px;">
                ${block.content.title ? `<h1 style="margin: 0 0 10px 0; color: ${block.content.text_color || '#1a202c'}; font-size: 28px; font-weight: bold;">${block.content.title}</h1>` : ''}
                ${block.content.subtitle ? `<p style="margin: 0 0 20px 0; color: ${block.content.text_color || '#4a5568'}; font-size: 16px; line-height: 1.5;">${block.content.subtitle}</p>` : ''}
                ${block.content.button_text ? `<a href="${block.content.button_url || '#'}" style="display: inline-block; padding: 12px 24px; background-color: ${block.content.button_color || '#3182ce'}; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">${block.content.button_text}</a>` : ''}
              </td>
            </tr>
          </table>
        `
      } else if (block.type === 'text' && block.content?.text_content) {
        emailContent += `
          <div style="color: #2d3748; font-size: 14px; line-height: 1.6;">
            ${block.content.text_content}
          </div>
        `
      } else if (block.type === 'button' && block.content) {
        emailContent += `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align: center; padding: 20px 0;">
                <a href="${block.content.button_url || '#'}" style="display: inline-block; padding: 12px 24px; background-color: ${block.content.button_color || '#3182ce'}; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  ${block.content.button_text || 'Click Here'}
                </a>
              </td>
            </tr>
          </table>
        `
      } else if (block.type === 'image' && block.content) {
        emailContent += `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="text-align: center; padding: 10px 0;">
                ${block.content.image_url ? `<img src="${block.content.image_url}" alt="${block.content.image_alt_text || ''}" style="max-width: 100%; height: auto; border-radius: 4px;" />` : `<div style="background-color: #f7fafc; border: 2px dashed #cbd5e0; padding: 40px; text-align: center; color: #a0aec0;">Image: ${block.content.image_alt_text || 'No image selected'}</div>`}
                ${block.content.caption ? `<p style="margin: 10px 0 0 0; color: #718096; font-size: 12px; font-style: italic;">${block.content.caption}</p>` : ''}
              </td>
            </tr>
          </table>
        `
      } else {
        // Generic block rendering
        emailContent += `
          <div style="border-left: 4px solid #3182ce; padding-left: 16px; margin: 10px 0;">
            <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px; font-weight: 600;">
              ${blockType?.name || block.type} Block
            </h4>
            ${Object.entries(block.content || {}).map(([key, value]) => 
              `<p style="margin: 4px 0; font-size: 12px; color: #4a5568;"><strong>${key}:</strong> ${value}</p>`
            ).join('')}
          </div>
        `
      }
      
      emailContent += `
            </td>
          </tr>
        </table>
      `
    })
  } else {
    emailContent = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="text-align: center; padding: 60px 20px; color: #a0aec0;">
            <div style="font-size: 48px; margin-bottom: 16px;">📧</div>
            <h3 style="margin: 0 0 8px 0; color: #4a5568; font-size: 18px;">No content blocks yet</h3>
            <p style="margin: 0; color: #718096; font-size: 14px;">Add blocks to your newsletter to see the preview here.</p>
          </td>
        </tr>
      </table>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${subject}</title>
      ${preheader ? `<meta name="description" content="${preheader}">` : ''}
      <!--[if mso]>
      <style type="text/css">
        table {border-collapse: collapse;}
      </style>
      <![endif]-->
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; background-color: #f7fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        @media screen and (max-width: 600px) {
          .email-container { width: 100% !important; margin: 0 !important; }
          .stack { width: 100% !important; display: block !important; }
        }
      </style>
    </head>
    <body>
      ${preheader ? `
        <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f7fafc;">
          ${preheader}
        </div>
      ` : ''}
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7fafc;">
        <tr>
          <td>
            <div class="email-container">
              ${emailContent}
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Keyboard shortcuts
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'r':
        event.preventDefault()
        refreshPreview()
        break
    }
  }
}

// Lifecycle
onMounted(() => {
  console.log('NewsletterPreview mounted')
  document.addEventListener('keydown', handleKeyboardShortcuts)
  
  // Initial compilation if there's content
  if (props.newsletter?.blocks?.length) {
    // Small delay to ensure everything is mounted
    setTimeout(() => {
      refreshPreview()
    }, 100)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})

// Expose methods for parent components
defineExpose({
  refreshPreview,
  setDevice,
  getCurrentDevice: () => device.value
})
</script>

<style scoped>
@reference 'tailwindcss';
/* Container */
.newsletter-preview-container {
  @apply h-full flex flex-col bg-white;
}

/* Header */
.preview-header {
  @apply flex items-center justify-between p-3 bg-white border-b border-gray-200;
}

.preview-title {
  @apply flex items-center gap-2 text-sm font-medium text-gray-900;
}

.last-refresh {
  @apply text-xs text-gray-500 ml-2;
}

.preview-controls {
  @apply flex items-center gap-2;
}

.device-switcher {
  @apply flex bg-white border border-gray-300 rounded-lg overflow-hidden;
}

.device-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors;
}

.device-button.active {
  @apply bg-blue-50 text-blue-700;
}

.device-label {
  @apply hidden sm:inline;
}

.divider {
  @apply w-px h-6 bg-gray-300;
}

.control-button {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.refresh-button {
  @apply bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100;
}

.refresh-button.loading {
  @apply opacity-75 cursor-not-allowed;
}

.button-text {
  @apply hidden sm:inline;
}

/* Preview Content */
.preview-content {
  @apply flex-1 bg-gray-100 overflow-auto;
}

.email-preview-frame {
  @apply h-full p-4;
}

.preview-iframe-container {
  @apply h-full;
}

.preview-iframe {
  @apply w-full h-full border-0 bg-white rounded-lg shadow-sm;
}

/* Device Frames */
.preview-iframe.device-mobile {
  @apply max-w-sm mx-auto;
}

.preview-iframe.device-tablet {
  @apply max-w-2xl mx-auto;
}

/* States */
.loading-state {
  @apply flex flex-col items-center justify-center h-full text-gray-600;
}

.loading-state p {
  @apply mt-4 text-lg font-medium;
}

.loading-state small {
  @apply mt-2 text-sm text-gray-500;
}

.compilation-error {
  @apply flex flex-col items-center justify-center h-full text-center p-8;
}

.compilation-error h3 {
  @apply mt-4 text-lg font-semibold text-red-900;
}

.compilation-error p {
  @apply mt-2 text-red-700 max-w-md;
}

.btn-retry {
  @apply mt-4 px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 flex items-center gap-2;
}

.empty-preview {
  @apply flex flex-col items-center justify-center h-full text-center text-gray-500;
}

.empty-preview h3 {
  @apply mt-4 text-lg font-medium text-gray-900;
}

.empty-preview p {
  @apply mt-2 text-gray-600;
}
</style>