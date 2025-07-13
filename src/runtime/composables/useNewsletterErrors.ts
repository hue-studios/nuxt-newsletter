// src/runtime/composables/useNewsletterErrors.ts
import { readonly, ref } from 'vue'

interface NewsletterError {
  code: string
  message: string
  solution: string
  severity: 'error' | 'warning' | 'info'
  docs?: string
}

// Common error patterns and their user-friendly explanations
const ERROR_PATTERNS: Record<string, NewsletterError> = {
  // Directus Connection Errors
  'directus_url_missing': {
    code: 'DIRECTUS_URL_MISSING',
    message: 'Cannot connect to Directus',
    solution: 'Please check your Directus URL in nuxt.config.ts or run the setup wizard',
    severity: 'error',
    docs: '#directus-setup'
  },
  'directus_auth_failed': {
    code: 'DIRECTUS_AUTH_FAILED',
    message: 'Directus authentication failed',
    solution: 'Check your token in the .env file or verify your credentials',
    severity: 'error',
    docs: '#authentication'
  },
  'directus_collections_missing': {
    code: 'DIRECTUS_COLLECTIONS_MISSING',
    message: 'Newsletter collections not found in Directus',
    solution: 'Run the setup script: npm run newsletter:setup',
    severity: 'error',
    docs: '#collections-setup'
  },
  
  // SendGrid Errors
  'sendgrid_key_missing': {
    code: 'SENDGRID_KEY_MISSING',
    message: 'Cannot send emails - no SendGrid API key',
    solution: 'Add SENDGRID_API_KEY to your .env file',
    severity: 'warning',
    docs: '#sendgrid-setup'
  },
  'sendgrid_invalid_key': {
    code: 'SENDGRID_INVALID_KEY',
    message: 'SendGrid API key is invalid',
    solution: 'Check your API key in SendGrid dashboard',
    severity: 'error',
    docs: '#sendgrid-api-key'
  },
  
  // MJML Compilation Errors
  'mjml_syntax_error': {
    code: 'MJML_SYNTAX_ERROR',
    message: 'Email template has formatting errors',
    solution: 'Check your block content for invalid HTML or missing required fields',
    severity: 'error',
    docs: '#mjml-troubleshooting'
  },
  'mjml_missing': {
    code: 'MJML_MISSING',
    message: 'MJML compiler not available',
    solution: 'Install MJML: npm install mjml or switch to client mode',
    severity: 'error',
    docs: '#mjml-installation'
  },
  
  // Content Validation Errors
  'newsletter_incomplete': {
    code: 'NEWSLETTER_INCOMPLETE',
    message: 'Newsletter is missing required information',
    solution: 'Make sure you have a subject line, from email, and at least one content block',
    severity: 'warning',
    docs: '#newsletter-requirements'
  },
  'invalid_email': {
    code: 'INVALID_EMAIL',
    message: 'Email address format is not valid',
    solution: 'Please enter a valid email address (example@domain.com)',
    severity: 'error'
  },
  
  // General Errors
  'network_error': {
    code: 'NETWORK_ERROR',
    message: 'Network connection problem',
    solution: 'Check your internet connection and try again',
    severity: 'error'
  }
}

export function useNewsletterErrors() {
  const currentError = ref<NewsletterError | null>(null)
  const errorHistory = ref<NewsletterError[]>([])

  // Parse error and return user-friendly version
  const parseError = (error: any): NewsletterError => {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    const errorStatus = error?.status || error?.statusCode

    // Check for specific error patterns
    if (errorMessage.includes('Directus URL not configured')) {
      return ERROR_PATTERNS.directus_url_missing
    }
    
    if (errorMessage.includes('Authentication failed') || errorStatus === 401) {
      return ERROR_PATTERNS.directus_auth_failed
    }
    
    if (errorMessage.includes('newsletters') && errorStatus === 403) {
      return ERROR_PATTERNS.directus_collections_missing
    }
    
    if (errorMessage.includes('SendGrid API key not configured')) {
      return ERROR_PATTERNS.sendgrid_key_missing
    }
    
    if (errorMessage.includes('Forbidden') && errorMessage.includes('SendGrid')) {
      return ERROR_PATTERNS.sendgrid_invalid_key
    }
    
    if (errorMessage.includes('MJML') && errorMessage.includes('syntax')) {
      return ERROR_PATTERNS.mjml_syntax_error
    }
    
    if (errorMessage.includes('MJML not installed')) {
      return ERROR_PATTERNS.mjml_missing
    }
    
    if (errorMessage.includes('Invalid email') || errorMessage.includes('email address')) {
      return ERROR_PATTERNS.invalid_email
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      return ERROR_PATTERNS.network_error
    }

    // Default error for unmatched patterns
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong',
      solution: 'Try refreshing the page or check the browser console for more details',
      severity: 'error'
    }
  }

  // Handle error with user-friendly message
  const handleError = (error: any, context?: string) => {
    const friendlyError = parseError(error)
    
    // Add context if provided
    if (context) {
      friendlyError.message = `${context}: ${friendlyError.message}`
    }
    
    currentError.value = friendlyError
    errorHistory.value.unshift(friendlyError)
    
    // Keep only last 10 errors
    if (errorHistory.value.length > 10) {
      errorHistory.value = errorHistory.value.slice(0, 10)
    }
    
    // Log technical details for developers
    if (import.meta.dev) {
      console.group(`[Newsletter Error] ${friendlyError.code}`)
      console.error('User message:', friendlyError.message)
      console.error('Solution:', friendlyError.solution)
      console.error('Original error:', error)
      console.groupEnd()
    }
    
    return friendlyError
  }

  // Clear current error
  const clearError = () => {
    currentError.value = null
  }

  // Check if error is critical (blocks functionality)
  const isCritical = (error: NewsletterError) => {
    return error.severity === 'error' && [
      'DIRECTUS_URL_MISSING',
      'DIRECTUS_AUTH_FAILED',
      'DIRECTUS_COLLECTIONS_MISSING'
    ].includes(error.code)
  }

  // Get setup suggestions based on error
  const getSetupSuggestions = (error: NewsletterError): string[] => {
    const suggestions: string[] = []
    
    switch (error.code) {
      case 'DIRECTUS_URL_MISSING':
      case 'DIRECTUS_AUTH_FAILED':
        suggestions.push('Run the setup wizard: npx @hue-studios/nuxt-newsletter setup')
        suggestions.push('Check your nuxt.config.ts newsletter configuration')
        suggestions.push('Verify your .env file has the correct values')
        break
        
      case 'DIRECTUS_COLLECTIONS_MISSING':
        suggestions.push('Run: npm run newsletter:setup [directus-url] [email] [password]')
        suggestions.push('Make sure you have admin access to Directus')
        break
        
      case 'SENDGRID_KEY_MISSING':
        suggestions.push('Get API key from SendGrid dashboard')
        suggestions.push('Add SENDGRID_API_KEY=your-key to .env file')
        suggestions.push('Restart your dev server after adding the key')
        break
        
      case 'MJML_MISSING':
        suggestions.push('Install MJML: npm install mjml')
        suggestions.push('Or switch to client mode in nuxt.config.ts')
        break
    }
    
    return suggestions
  }

  return {
    currentError: readonly(currentError),
    errorHistory: readonly(errorHistory),
    handleError,
    clearError,
    parseError,
    isCritical,
    getSetupSuggestions
  }
}

// Error boundary component for better error handling
export const NewsletterErrorBoundary = {
  name: 'NewsletterErrorBoundary',
  props: {
    fallback: {
      type: String,
      default: 'Something went wrong with the newsletter module'
    }
  },
  setup(props, { slots }) {
    const { currentError, handleError, clearError, isCritical, getSetupSuggestions } = useNewsletterErrors()
    
    const onError = (error: any) => {
      const friendlyError = handleError(error, 'Newsletter Module')
      
      // For critical errors, we might want to prevent further rendering
      if (isCritical(friendlyError)) {
        return false // Stop error propagation
      }
      
      return true // Allow error to bubble up
    }
    
    return {
      currentError,
      clearError,
      getSetupSuggestions,
      onError,
      slots
    }
  },
  template: `
    <div>
      <div v-if="currentError" class="newsletter-error-boundary">
        <div class="error-container" :class="currentError.severity">
          <div class="error-header">
            <h3>{{ currentError.message }}</h3>
            <button @click="clearError" class="error-close">×</button>
          </div>
          
          <div class="error-body">
            <p class="error-solution">{{ currentError.solution }}</p>
            
            <div v-if="getSetupSuggestions(currentError).length > 0" class="error-suggestions">
              <p><strong>Try these steps:</strong></p>
              <ol>
                <li v-for="suggestion in getSetupSuggestions(currentError)" :key="suggestion">
                  {{ suggestion }}
                </li>
              </ol>
            </div>
            
            <div v-if="currentError.docs" class="error-docs">
              <a :href="'#' + currentError.docs" class="error-link">
                📚 View documentation
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <slot v-else />
    </div>
  `,
  style: `
    .newsletter-error-boundary {
      margin: 1rem 0;
    }
    
    .error-container {
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid;
    }
    
    .error-container.error {
      background: #fef2f2;
      border-color: #dc2626;
      color: #991b1b;
    }
    
    .error-container.warning {
      background: #fffbeb;
      border-color: #d97706;
      color: #92400e;
    }
    
    .error-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .error-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .error-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.7;
    }
    
    .error-solution {
      margin: 0.5rem 0;
      font-weight: 500;
    }
    
    .error-suggestions {
      margin: 1rem 0;
    }
    
    .error-suggestions ol {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }
    
    .error-suggestions li {
      margin: 0.25rem 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
    }
    
    .error-docs {
      margin-top: 1rem;
    }
    
    .error-link {
      color: inherit;
      text-decoration: underline;
      font-weight: 500;
    }
  `
}