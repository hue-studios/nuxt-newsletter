<template>
  <div class="drag-drop-block-list" :class="{ 'is-dragging': isDragging }">
    <!-- Empty State -->
    <div v-if="blocks.length === 0" class="empty-state">
      <div class="empty-icon">
        <Icon name="lucide:layout" />
      </div>
      <h3>No blocks added yet</h3>
      <p>Drag blocks from the toolbar above to start building your newsletter.</p>
      <div class="empty-visual">
        <div class="empty-block" v-for="i in 3" :key="i" :style="{ animationDelay: `${i * 0.2}s` }">
          <div class="empty-block-icon">
            <Icon :name="['lucide:type', 'lucide:image', 'lucide:link'][i - 1]" />
          </div>
          <div class="empty-block-content">
            <div class="empty-block-line"></div>
            <div class="empty-block-line short"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Block List -->
    <div v-else class="blocks-container" ref="scrollContainer">
      <TransitionGroup
        name="block-list"
        tag="div"
        class="blocks-list"
        @before-enter="onBlockEnter"
        @enter="onBlockEnter"
        @leave="onBlockLeave"
      >
        <div
          v-for="(block, index) in blocks"
          :key="block.id"
          class="block-item"
          :class="getDragClasses(index)"
          v-bind="getDragAttributes(index)"
          :style="getBlockStyle(index)"
        >
          <!-- Drag Handle -->
          <div class="drag-handle" :class="{ 'active': draggedIndex === index }">
            <div class="drag-handle-dots">
              <div class="dot" v-for="i in 6" :key="i"></div>
            </div>
            <div class="drag-handle-line"></div>
          </div>

          <!-- Block Content -->
          <div class="block-content">
            <!-- Block Header -->
            <div class="block-header">
              <div class="block-info">
                <div class="block-icon" :class="getBlockIconClass(block.type)">
                  <Icon :name="getBlockIcon(block.type)" />
                </div>
                <div class="block-details">
                  <h4 class="block-title">{{ getBlockName(block.type) }}</h4>
                  <p class="block-description">{{ getBlockDescription(block.type) }}</p>
                </div>
              </div>

              <!-- Block Actions -->
              <div class="block-actions" :class="{ 'visible': hoveredIndex === index || draggedIndex === index }">
                <button
                  @click="toggleBlockCollapse(index)"
                  class="action-button"
                  :class="{ 'active': expandedBlocks.has(index) }"
                  :aria-label="expandedBlocks.has(index) ? 'Collapse block' : 'Expand block'"
                >
                  <Icon :name="expandedBlocks.has(index) ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
                </button>
                
                <button
                  @click="duplicateBlock(index)"
                  class="action-button"
                  aria-label="Duplicate block"
                >
                  <Icon name="lucide:copy" />
                </button>
                
                <button
                  @click="deleteBlock(index)"
                  class="action-button delete-button"
                  aria-label="Delete block"
                >
                  <Icon name="lucide:trash-2" />
                </button>
              </div>
            </div>

            <!-- Block Editor (Collapsible) -->
            <Transition name="block-expand" @enter="onExpandEnter" @leave="onExpandLeave">
              <div v-if="expandedBlocks.has(index)" class="block-editor">
                <NewsletterBlock
                  :block="block"
                  :block-type="getBlockType(block.type)"
                  @update="updateBlock"
                  @duplicate="duplicateBlock"
                  @remove="deleteBlock"
                />
              </div>
            </Transition>
          </div>

          <!-- Drop Zone Indicator -->
          <div class="drop-zone-indicator" :class="{ 'active': dragOverIndex === index }">
            <div class="drop-zone-line"></div>
            <div class="drop-zone-label">Drop here</div>
          </div>
        </div>
      </TransitionGroup>

      <!-- Final Drop Zone -->
      <div
        v-if="isDragging"
        class="final-drop-zone"
        :class="{ 'active': dragOverIndex === blocks.length }"
        :data-drop-zone="blocks.length"
      >
        <div class="drop-zone-line"></div>
        <div class="drop-zone-label">Drop at end</div>
      </div>
    </div>

    <!-- Drag Feedback -->
    <div v-if="isDragging" class="drag-feedback">
      <div class="drag-feedback-content">
        <Icon name="lucide:move" class="drag-feedback-icon" />
        <span class="drag-feedback-text">
          Moving "{{ getBlockName(blocks[draggedIndex!]?.type) }}" block
        </span>
      </div>
      <div class="drag-feedback-instructions">
        <kbd>ESC</kbd> to cancel
      </div>
    </div>

    <!-- Accessibility Announcements -->
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      {{ accessibilityAnnouncement }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAdvancedDragDrop } from './useAdvancedDragDrop'

interface Props {
  blocks: any[]
  blockTypes: any[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:blocks': [blocks: any[]]
  'block:update': [index: number, block: any]
  'block:duplicate': [index: number]
  'block:delete': [index: number]
}>()

// Refs
const scrollContainer = ref<HTMLElement>()
const hoveredIndex = ref<number | null>(null)
const expandedBlocks = ref<Set<number>>(new Set())
const accessibilityAnnouncement = ref('')

// Drag and drop setup
const {
  isActive: isDragging,
  draggedIndex,
  dragOverIndex,
  getDragAttributes,
  getDragClasses,
  cancelDrag,
  triggerHapticFeedback
} = useAdvancedDragDrop({
  onMove: handleBlockMove,
  onStart: handleDragStart,
  onEnd: handleDragEnd,
  onCancel: handleDragCancel,
  disabled: computed(() => props.disabled),
  scrollContainer: scrollContainer,
  hapticFeedback: true,
  autoScroll: true,
  smoothAnimations: true,
  longPressDelay: 300,
  minimumDistance: 8,
  accessibilityMode: true
})

// Computed
const localBlocks = computed({
  get: () => props.blocks,
  set: (value) => emit('update:blocks', value)
})

// Methods
const handleBlockMove = (fromIndex: number, toIndex: number) => {
  const blocks = [...localBlocks.value]
  const [movedBlock] = blocks.splice(fromIndex, 1)
  blocks.splice(toIndex, 0, movedBlock)
  
  // Update sort order
  blocks.forEach((block, index) => {
    block.sort = index
  })
  
  localBlocks.value = blocks
  
  // Accessibility announcement
  accessibilityAnnouncement.value = `Moved ${getBlockName(movedBlock.type)} from position ${fromIndex + 1} to position ${toIndex + 1}`
  
  // Haptic feedback for successful move
  triggerHapticFeedback('heavy')
}

const handleDragStart = (index: number) => {
  const blockName = getBlockName(props.blocks[index]?.type)
  accessibilityAnnouncement.value = `Started dragging ${blockName} block`
  
  // Expand the dragged block for better visibility
  expandedBlocks.value.add(index)
  
  // Add drag class to body for global styles
  document.body.classList.add('drag-active')
}

const handleDragEnd = () => {
  accessibilityAnnouncement.value = 'Drag operation completed'
  document.body.classList.remove('drag-active')
}

const handleDragCancel = () => {
  accessibilityAnnouncement.value = 'Drag operation cancelled'
  document.body.classList.remove('drag-active')
}

const toggleBlockCollapse = (index: number) => {
  if (expandedBlocks.value.has(index)) {
    expandedBlocks.value.delete(index)
  } else {
    expandedBlocks.value.add(index)
  }
  
  // Haptic feedback
  triggerHapticFeedback('light')
}

const duplicateBlock = (index: number) => {
  emit('block:duplicate', index)
  
  // Expand the new block
  nextTick(() => {
    expandedBlocks.value.add(index + 1)
  })
  
  // Haptic feedback
  triggerHapticFeedback('medium')
  
  // Accessibility announcement
  const blockName = getBlockName(props.blocks[index]?.type)
  accessibilityAnnouncement.value = `Duplicated ${blockName} block`
}

const deleteBlock = (index: number) => {
  const blockName = getBlockName(props.blocks[index]?.type)
  
  if (confirm(`Are you sure you want to delete the ${blockName} block?`)) {
    emit('block:delete', index)
    
    // Remove from expanded blocks
    expandedBlocks.value.delete(index)
    
    // Update other expanded indices
    const newExpanded = new Set<number>()
    expandedBlocks.value.forEach(i => {
      if (i > index) {
        newExpanded.add(i - 1)
      } else if (i < index) {
        newExpanded.add(i)
      }
    })
    expandedBlocks.value = newExpanded
    
    // Haptic feedback
    triggerHapticFeedback('heavy')
    
    // Accessibility announcement
    accessibilityAnnouncement.value = `Deleted ${blockName} block`
  }
}

const updateBlock = (blockId: string, updates: any) => {
  const index = props.blocks.findIndex(b => b.id === blockId)
  if (index !== -1) {
    emit('block:update', index, { ...props.blocks[index], ...updates })
  }
}

// Block utilities
const getBlockType = (slug: string) => {
  return props.blockTypes.find(bt => bt.slug === slug)
}

const getBlockIcon = (slug: string) => {
  const blockType = getBlockType(slug)
  return blockType?.icon || 'lucide:square'
}

const getBlockName = (slug: string) => {
  const blockType = getBlockType(slug)
  return blockType?.name || slug
}

const getBlockDescription = (slug: string) => {
  const blockType = getBlockType(slug)
  return blockType?.description || 'Edit block content'
}

const getBlockIconClass = (slug: string) => {
  const blockType = getBlockType(slug)
  const category = blockType?.category || 'content'
  
  const categoryClasses = {
    content: 'bg-blue-100 text-blue-600',
    layout: 'bg-green-100 text-green-600',
    media: 'bg-purple-100 text-purple-600',
    interactive: 'bg-orange-100 text-orange-600'
  }
  
  return categoryClasses[category] || categoryClasses.content
}

const getBlockStyle = (index: number) => {
  const style: any = {}
  
  // Stagger animation for initial load
  if (!isDragging.value) {
    style.animationDelay = `${index * 0.05}s`
  }
  
  // Smooth position transitions
  style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  
  return style
}

// Transition handlers
const onBlockEnter = (el: HTMLElement) => {
  el.style.opacity = '0'
  el.style.transform = 'translateY(20px) scale(0.95)'
  
  nextTick(() => {
    el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    el.style.opacity = '1'
    el.style.transform = 'translateY(0) scale(1)'
  })
}

const onBlockLeave = (el: HTMLElement) => {
  el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  el.style.opacity = '0'
  el.style.transform = 'translateY(-20px) scale(0.95)'
}

const onExpandEnter = (el: HTMLElement) => {
  el.style.height = '0'
  el.style.opacity = '0'
  el.style.overflow = 'hidden'
  
  nextTick(() => {
    el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    el.style.height = el.scrollHeight + 'px'
    el.style.opacity = '1'
    
    const onTransitionEnd = () => {
      el.style.height = 'auto'
      el.style.overflow = 'visible'
      el.removeEventListener('transitionend', onTransitionEnd)
    }
    
    el.addEventListener('transitionend', onTransitionEnd)
  })
}

const onExpandLeave = (el: HTMLElement) => {
  el.style.height = el.scrollHeight + 'px'
  el.style.overflow = 'hidden'
  
  nextTick(() => {
    el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    el.style.height = '0'
    el.style.opacity = '0'
  })
}

// Mouse events for hover effects
const handleMouseEnter = (index: number) => {
  hoveredIndex.value = index
}

const handleMouseLeave = () => {
  hoveredIndex.value = null
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isDragging.value) {
    cancelDrag()
  }
}

// Auto-expand first block on mount
onMounted(() => {
  if (props.blocks.length > 0) {
    expandedBlocks.value.add(0)
  }
  
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// Watch for block changes
watch(() => props.blocks.length, (newLength, oldLength) => {
  // Auto-expand newly added blocks
  if (newLength > oldLength) {
    expandedBlocks.value.add(newLength - 1)
  }
})
</script>

<style scoped>
@reference 'tailwindcss';
.drag-drop-block-list {
  @apply relative;
}

/* Empty State */
.empty-state {
  @apply text-center py-12 px-6;
}

.empty-icon {
  @apply w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center;
}

.empty-icon svg {
  @apply w-8 h-8 text-slate-400;
}

.empty-state h3 {
  @apply text-lg font-semibold text-slate-900 mb-2;
}

.empty-state p {
  @apply text-slate-600 mb-8 max-w-md mx-auto;
}

.empty-visual {
  @apply space-y-3 max-w-sm mx-auto;
}

.empty-block {
  @apply flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg opacity-50;
  animation: emptyPulse 2s ease-in-out infinite;
}

.empty-block-icon {
  @apply w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center;
}

.empty-block-icon svg {
  @apply w-4 h-4 text-slate-500;
}

.empty-block-content {
  @apply flex-1 space-y-2;
}

.empty-block-line {
  @apply h-2 bg-slate-200 rounded;
}

.empty-block-line.short {
  @apply w-2/3;
}

/* Blocks Container */
.blocks-container {
  @apply space-y-4 overflow-y-auto max-h-screen;
}

.blocks-list {
  @apply space-y-4;
}

/* Block Item */
.block-item {
  @apply relative bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md;
  animation: blockSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.block-item:hover {
  @apply border-slate-300 shadow-md;
}

.block-item.is-dragging {
  @apply opacity-50 scale-98 shadow-lg;
}

.block-item.is-drag-over {
  @apply border-blue-300 shadow-lg;
  transform: scale(1.02);
}

.block-item.drop-zone-active {
  @apply border-blue-400 bg-blue-50;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Drag Handle */
.drag-handle {
  @apply absolute -left-8 top-0 h-full w-6 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200;
  opacity: 0;
  transform: translateX(-4px);
}

.block-item:hover .drag-handle {
  opacity: 1;
  transform: translateX(0);
}

.drag-handle.active {
  @apply cursor-grabbing;
  opacity: 1;
  transform: translateX(0);
}

.drag-handle-dots {
  @apply grid grid-cols-2 gap-0.5 mb-2;
}

.dot {
  @apply w-1 h-1 bg-slate-400 rounded-full;
}

.drag-handle-line {
  @apply flex-1 w-0.5 bg-gradient-to-b from-slate-300 to-transparent;
}

/* Block Content */
.block-content {
  @apply relative overflow-hidden;
}

.block-header {
  @apply flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200;
}

.block-info {
  @apply flex items-center gap-3;
}

.block-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center;
}

.block-icon svg {
  @apply w-5 h-5;
}

.block-details {
  @apply min-w-0;
}

.block-title {
  @apply text-sm font-semibold text-slate-900;
}

.block-description {
  @apply text-xs text-slate-600;
}

.block-actions {
  @apply flex items-center gap-1 opacity-0 transition-opacity duration-200;
}

.block-actions.visible {
  @apply opacity-100;
}

.action-button {
  @apply p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors;
}

.action-button.active {
  @apply text-blue-600 bg-blue-100;
}

.action-button.delete-button {
  @apply hover:text-red-600 hover:bg-red-100;
}

/* Block Editor */
.block-editor {
  @apply p-4 bg-white;
}

/* Drop Zone Indicator */
.drop-zone-indicator {
  @apply absolute -top-2 left-0 right-0 h-4 flex items-center justify-center opacity-0 transition-opacity duration-200;
}

.drop-zone-indicator.active {
  @apply opacity-100;
}

.drop-zone-line {
  @apply h-0.5 bg-blue-500 rounded-full flex-1 shadow-sm;
}

.drop-zone-label {
  @apply px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full shadow-sm;
}

.final-drop-zone {
  @apply h-12 flex items-center justify-center mt-4 border-2 border-dashed border-slate-300 rounded-lg opacity-0 transition-all duration-200;
}

.final-drop-zone.active {
  @apply opacity-100 border-blue-400 bg-blue-50;
}

/* Drag Feedback */
.drag-feedback {
  @apply fixed top-4 right-4 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-50 max-w-xs;
}

.drag-feedback-content {
  @apply flex items-center gap-3 mb-2;
}

.drag-feedback-icon {
  @apply w-5 h-5 text-blue-600;
}

.drag-feedback-text {
  @apply text-sm font-medium text-slate-900;
}

.drag-feedback-instructions {
  @apply text-xs text-slate-600;
}

.drag-feedback kbd {
  @apply px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-xs;
}

/* Transitions */
.block-list-enter-active,
.block-list-leave-active {
  @apply transition-all duration-300;
}

.block-list-enter-from,
.block-list-leave-to {
  @apply opacity-0 scale-95;
}

.block-list-move {
  @apply transition-transform duration-300;
}

.block-expand-enter-active,
.block-expand-leave-active {
  @apply transition-all duration-300;
}

.block-expand-enter-from,
.block-expand-leave-to {
  @apply opacity-0;
}

/* Keyframes */
@keyframes blockSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes emptyPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

/* Global drag styles */
:global(.drag-active) {
  cursor: grabbing !important;
  user-select: none !important;
}

:global(.drag-active) * {
  cursor: grabbing !important;
}

/* Accessibility */
.sr-only {
  @apply sr-only;
}

/* Responsive */
@media (max-width: 768px) {
  .block-item {
    @apply mx-2;
  }
  
  .drag-handle {
    @apply -left-6 w-5;
  }
  
  .drag-feedback {
    @apply top-2 right-2 max-w-[calc(100vw-1rem)];
  }
}
</style>