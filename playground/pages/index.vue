<template>
  <div class="editor-page">
    <div class="page-header">
      <h2>Create Newsletter</h2>
      <div class="actions">
        <button @click="saveDraft" :disabled="saving" class="btn btn-secondary">
          {{ saving ? 'Saving...' : 'Save Draft' }}
        </button>
        <button @click="sendTest" class="btn btn-primary">
          Send Test
        </button>
      </div>
    </div>

    <NewsletterEditor v-model="newsletter" :show-preview="true" />

    <!-- Debug Panel (dev only) -->
    <details v-if="$config.public.newsletter.dev" class="debug-panel">
      <summary>Debug Data</summary>
      <pre>{{ JSON.stringify(newsletter, null, 2) }}</pre>
    </details>
  </div>
</template>

<script setup>
const newsletter = ref({
  subject: 'Welcome to our Newsletter!',
  preheader: 'Check out our latest updates',
  blocks: []
})

const saving = ref(false)
const { createNewsletter, sendTestEmail } = useDirectusNewsletter()

const saveDraft = async () => {
  saving.value = true
  try {
    const result = await createNewsletter(newsletter.value)
    console.log('Newsletter saved:', result)
    // Show success message
    alert('Newsletter saved successfully!')
  } catch (error) {
    console.error('Error saving newsletter:', error)
    alert('Error saving newsletter')
  } finally {
    saving.value = false
  }
}

const sendTest = async () => {
  const email = prompt('Enter email address for test:')
  if (!email) return
  
  try {
    await sendTestEmail(newsletter.value.id || 'draft', email)
    alert('Test email sent!')
  } catch (error) {
    console.error('Error sending test:', error)
    alert('Error sending test email')
  }
}
</script>

<style>
.editor-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.debug-panel {
  margin: 2rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 4px;
}

.debug-panel summary {
  cursor: pointer;
  font-weight: bold;
}

.debug-panel pre {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  overflow-x: auto;
}
</style>