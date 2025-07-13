// src/runtime/composables/useDragAndDrop.ts
import { nextTick, readonly, ref } from 'vue'

export interface DragDropOptions {
  onMove?: (fromIndex: number, toIndex: number) => void
  onStart?: (index: number) => void
  onEnd?: () => void
  disabled?: boolean
}

export function useDragAndDrop(options: DragDropOptions = {}) {
  const draggedIndex = ref<number | null>(null)
  const dragOverIndex = ref<number | null>(null)
  const isDragging = ref(false)

  const handleDragStart = (index: number, event: DragEvent) => {
    if (options.disabled) return

    draggedIndex.value = index
    isDragging.value = true
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', index.toString())
      
      // Create a custom drag image (optional)
      const dragElement = event.target as HTMLElement
      const rect = dragElement.getBoundingClientRect()
      
      // Set drag image offset to mouse position
      event.dataTransfer.setDragImage(dragElement, 
        event.clientX - rect.left, 
        event.clientY - rect.top
      )
    }
    
    options.onStart?.(index)
  }

  const handleDragEnter = (index: number, event: DragEvent) => {
    if (options.disabled) return
    event.preventDefault()
    dragOverIndex.value = index
  }

  const handleDragOver = (index: number, event: DragEvent) => {
    if (options.disabled) return
    
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    
    // Only update if different from current
    if (dragOverIndex.value !== index) {
      dragOverIndex.value = index
    }
  }

  const handleDragLeave = (event: DragEvent) => {
    if (options.disabled) return
    
    // Only clear if actually leaving the element
    const relatedTarget = event.relatedTarget as HTMLElement
    const currentTarget = event.currentTarget as HTMLElement
    
    if (!currentTarget.contains(relatedTarget)) {
      dragOverIndex.value = null
    }
  }

  const handleDrop = (toIndex: number, event: DragEvent) => {
    if (options.disabled) return
    
    event.preventDefault()
    const fromIndex = draggedIndex.value
    
    if (fromIndex !== null && fromIndex !== toIndex) {
      options.onMove?.(fromIndex, toIndex)
    }
    
    handleDragEnd()
  }

  const handleDragEnd = () => {
    draggedIndex.value = null
    dragOverIndex.value = null
    isDragging.value = false
    options.onEnd?.()
  }

  // Helper to get drag attributes for an element
  const getDragAttributes = (index: number, draggable = true) => ({
    draggable: draggable && !options.disabled,
    onDragstart: (event: DragEvent) => handleDragStart(index, event),
    onDragenter: (event: DragEvent) => handleDragEnter(index, event),
    onDragover: (event: DragEvent) => handleDragOver(index, event),
    onDragleave: handleDragLeave,
    onDrop: (event: DragEvent) => handleDrop(index, event),
    onDragend: handleDragEnd
  })

  // Helper to get CSS classes for drag states
  const getDragClasses = (index: number) => ({
    'is-dragging': draggedIndex.value === index,
    'is-drag-over': dragOverIndex.value === index,
    'is-drop-zone': isDragging.value && draggedIndex.value !== index
  })

  // Animate element when dropped
  const animateMove = async (element: HTMLElement) => {
    if (!element) return
    
    element.style.transform = 'scale(1.02)'
    element.style.transition = 'transform 0.2s ease'
    
    await nextTick()
    
    setTimeout(() => {
      element.style.transform = ''
      setTimeout(() => {
        element.style.transition = ''
      }, 200)
    }, 100)
  }

  return {
    // State
    draggedIndex: readonly(draggedIndex),
    dragOverIndex: readonly(dragOverIndex),
    isDragging: readonly(isDragging),
    
    // Handlers
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    
    // Helpers
    getDragAttributes,
    getDragClasses,
    animateMove
  }
}

// Touch support for mobile devices
export function useMobileDragAndDrop(options: DragDropOptions = {}) {
  const activeTouch = ref<{ index: number; startY: number; element: HTMLElement } | null>(null)
  const touchOffset = ref(0)

  const handleTouchStart = (index: number, event: TouchEvent) => {
    if (options.disabled) return
    
    const touch = event.touches[0]
    const element = event.currentTarget as HTMLElement
    
    activeTouch.value = {
      index,
      startY: touch.clientY,
      element
    }
    
    element.style.transition = 'none'
    element.style.zIndex = '1000'
    element.style.pointerEvents = 'none'
    
    options.onStart?.(index)
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!activeTouch.value || options.disabled) return
    
    event.preventDefault()
    const touch = event.touches[0]
    const offset = touch.clientY - activeTouch.value.startY
    touchOffset.value = offset
    
    activeTouch.value.element.style.transform = `translateY(${offset}px)`
    
    // Find drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    const dropZone = elementBelow?.closest('[data-drop-zone]')
    
    if (dropZone) {
      const toIndex = parseInt(dropZone.getAttribute('data-drop-zone') || '0')
      // Highlight drop zone
    }
  }

  const handleTouchEnd = (event: TouchEvent) => {
    if (!activeTouch.value || options.disabled) return
    
    const element = activeTouch.value.element
    const touch = event.changedTouches[0]
    
    // Reset element styles
    element.style.transform = ''
    element.style.transition = ''
    element.style.zIndex = ''
    element.style.pointerEvents = ''
    
    // Find drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    const dropZone = elementBelow?.closest('[data-drop-zone]')
    
    if (dropZone) {
      const toIndex = parseInt(dropZone.getAttribute('data-drop-zone') || '0')
      if (toIndex !== activeTouch.value.index) {
        options.onMove?.(activeTouch.value.index, toIndex)
      }
    }
    
    activeTouch.value = null
    touchOffset.value = 0
    options.onEnd?.()
  }

  const getTouchAttributes = (index: number) => ({
    'data-drop-zone': index.toString(),
    onTouchstart: (event: TouchEvent) => handleTouchStart(index, event),
    onTouchmove: handleTouchMove,
    onTouchend: handleTouchEnd
  })

  return {
    activeTouch: readonly(activeTouch),
    touchOffset: readonly(touchOffset),
    getTouchAttributes
  }
}