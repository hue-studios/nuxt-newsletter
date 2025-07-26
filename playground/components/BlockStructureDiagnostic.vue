<!-- Add this component to your page to diagnose block structure issues -->
<template>
  <div class="diagnostic-panel">
    <h3>🔍 Block Structure Diagnostic</h3>
    
    <div class="diagnostic-section">
      <h4>Current Blocks ({{ blocks.length }})</h4>
      <div v-for="(block, index) in blocks" :key="block.id" class="block-diagnostic">
        <div class="block-header">
          Block {{ index + 1 }}: {{ block.type || 'No type' }}
        </div>
        <div class="block-details">
          <div><strong>ID:</strong> {{ block.id }}</div>
          <div><strong>Type (slug):</strong> {{ block.type || 'MISSING' }}</div>
          <div><strong>Block Type (UUID):</strong> {{ block.block_type || 'MISSING' }}</div>
          <div><strong>Sort:</strong> {{ block.sort }}</div>
          <div><strong>Content Keys:</strong> {{ Object.keys(block.content || {}).join(', ') || 'None' }}</div>
          
          <!-- Check if block type exists -->
          <div v-if="blockTypes.length > 0">
            <strong>Block Type Match:</strong>
            <span v-if="findBlockType(block)" class="success">
              ✅ Found: {{ findBlockType(block).name }}
            </span>
            <span v-else class="error">
              ❌ Not found for slug "{{ block.type }}"
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="diagnostic-section">
      <h4>Available Block Types ({{ blockTypes.length }})</h4>
      <div v-for="bt in blockTypes" :key="bt.id" class="block-type-item">
        <strong>{{ bt.slug }}</strong> → {{ bt.id }} ({{ bt.name }})
      </div>
    </div>

    <div class="diagnostic-section">
      <button @click="runDiagnostic" class="diagnostic-button">
        Run Full Diagnostic
      </button>
      <button @click="fixBlocks" class="fix-button">
        Attempt Auto-Fix
      </button>
    </div>

    <div v-if="diagnosticResults" class="diagnostic-results">
      <h4>Diagnostic Results:</h4>
      <pre>{{ diagnosticResults }}</pre>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  newsletter: Object,
  blockTypes: Array
})

const emit = defineEmits(['update:newsletter'])

const blocks = computed(() => props.newsletter?.blocks || [])
const diagnosticResults = ref('')

const findBlockType = (block) => {
  if (!props.blockTypes) return null
  
  // Try to find by slug
  if (block.type) {
    return props.blockTypes.find(bt => bt.slug === block.type)
  }
  
  // Try to find by UUID
  if (block.block_type) {
    return props.blockTypes.find(bt => bt.id === block.block_type)
  }
  
  return null
}

const runDiagnostic = async () => {
  const results = []
  
  results.push('=== NEWSLETTER DIAGNOSTIC ===')
  results.push(`Newsletter ID: ${props.newsletter.id || 'Not saved'}`)
  results.push(`Title: ${props.newsletter.title || 'Not set'}`)
  results.push(`Subject: ${props.newsletter.subject_line || 'Not set'}`)
  results.push(`Total Blocks: ${blocks.value.length}`)
  results.push('')
  
  results.push('=== BLOCK ANALYSIS ===')
  blocks.value.forEach((block, index) => {
    results.push(`\nBlock ${index + 1}:`)
    results.push(`  ID: ${block.id}`)
    results.push(`  Type (slug): ${block.type || 'MISSING'}`)
    results.push(`  Block Type (UUID): ${block.block_type || 'MISSING'}`)
    
    const blockType = findBlockType(block)
    if (blockType) {
      results.push(`  ✅ Matched to: ${blockType.name} (${blockType.id})`)
    } else {
      results.push(`  ❌ No matching block type found`)
      results.push(`     Available slugs: ${props.blockTypes.map(bt => bt.slug).join(', ')}`)
    }
    
    if (!block.type && !block.block_type) {
      results.push(`  ⚠️  CRITICAL: Block has no type identifiers`)
    }
  })
  
  results.push('\n=== RECOMMENDATIONS ===')
  
  const missingTypes = blocks.value.filter(b => !findBlockType(b))
  if (missingTypes.length > 0) {
    results.push(`❌ ${missingTypes.length} blocks have invalid types`)
    results.push('   Run "Attempt Auto-Fix" to resolve')
  } else {
    results.push('✅ All blocks have valid types')
  }
  
  const missingUUIDs = blocks.value.filter(b => !b.block_type)
  if (missingUUIDs.length > 0) {
    results.push(`⚠️  ${missingUUIDs.length} blocks missing block_type UUID`)
  }
  
  diagnosticResults.value = results.join('\n')
}

const fixBlocks = () => {
  const fixed = blocks.value.map(block => {
    const blockType = findBlockType(block)
    
    if (blockType && !block.block_type) {
      // Add missing block_type UUID
      return {
        ...block,
        block_type: blockType.id,
        type: blockType.slug
      }
    }
    
    return block
  })
  
  // Emit updated newsletter
  emit('update:newsletter', {
    ...props.newsletter,
    blocks: fixed
  })
  
  // Run diagnostic again to show results
  setTimeout(runDiagnostic, 100)
}
</script>

<style scoped>
.diagnostic-panel {
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.diagnostic-section {
  margin-bottom: 20px;
}

.diagnostic-section h4 {
  margin-bottom: 10px;
  color: #495057;
}

.block-diagnostic {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.block-header {
  font-weight: bold;
  margin-bottom: 5px;
}

.block-details {
  font-size: 14px;
  color: #6c757d;
}

.block-details div {
  margin: 2px 0;
}

.success {
  color: #28a745;
}

.error {
  color: #dc3545;
}

.block-type-item {
  font-size: 14px;
  padding: 2px 0;
  font-family: monospace;
}

.diagnostic-button,
.fix-button {
  padding: 8px 16px;
  margin-right: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.diagnostic-button {
  background: #007bff;
  color: white;
}

.fix-button {
  background: #28a745;
  color: white;
}

.diagnostic-results {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-top: 20px;
}

.diagnostic-results pre {
  margin: 0;
  font-size: 13px;
  white-space: pre-wrap;
}
</style>