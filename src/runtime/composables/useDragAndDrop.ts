// src/runtime/composables/useAdvancedDragDrop.ts
import { computed, onUnmounted, ref } from 'vue'

export interface DragDropOptions {
  onMove?: (fromIndex: number, toIndex: number) => void
  onStart?: (index: number) => void
  onEnd?: () => void
  onCancel?: () => void
  disabled?: boolean
  scrollContainer?: HTMLElement | string
  hapticFeedback?: boolean
  autoScroll?: boolean
  smoothAnimations?: boolean
  ghostOpacity?: number
  longPressDelay?: number
  minimumDistance?: number
  snapToGrid?: boolean
  accessibilityMode?: boolean
}

interface DragState {
   isDragging: boolean
  draggedIndex: number | null
  dragOverIndex: number | null
  initialPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  draggedElement: HTMLElement | null
  ghostElement: HTMLElement | null
  scrollContainer: HTMLElement | null
  animationFrameId: number | null
  touchStartTime: number
  hasMovedMinDistance: boolean
  velocityTracker: VelocityPoint[]
  isLongPress: boolean
  cancelTimeout: NodeJS.Timeout | null
}

// Add this interface to your types at the top of the file
interface VelocityPoint {
  x: number
  y: number
  time: number
}

const createGhostElement = (element: HTMLElement): HTMLElement => {
  const rect = element.getBoundingClientRect()
  const ghost = element.cloneNode(true) as HTMLElement
  
  // Style the ghost element
  ghost.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 9999;
    pointer-events: none;
    opacity: 0.9;
    transform: rotate(2deg) scale(1.05);
    transition: none;
    animation: ghostPulse 2s ease-in-out infinite;
  `
  
  // Remove any interactive elements
  ghost.querySelectorAll('button, input, textarea, select').forEach(el => {
    el.setAttribute('disabled', 'true')
    el.style.pointerEvents = 'none'
  })
  
  return ghost
}

const findDropTarget = (clientX: number, clientY: number): { index: number, element: HTMLElement | null } => {
  const dropZones = document.querySelectorAll('[data-drop-zone]')
  
  for (let i = 0; i < dropZones.length; i++) {
    const zone = dropZones[i] as HTMLElement
    const rect = zone.getBoundingClientRect()
    
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return {
        index: parseInt(zone.getAttribute('data-drop-zone') || '-1'),
        element: zone
      }
    }
  }
  
  return { index: -1, element: null }
}

const calculateVelocity = (): { x: number, y: number } => {
  const tracker = dragState.value.velocityTracker
  if (tracker.length < 2) return { x: 0, y: 0 }
  
  const recent = tracker.slice(-2)
  const timeDiff = recent[1].time - recent[0].time
  
  if (timeDiff === 0) return { x: 0, y: 0 }
  
  return {
    x: (recent[1].x - recent[0].x) / timeDiff,
    y: (recent[1].y - recent[0].y) / timeDiff
  }
}

const handleAutoScroll = (clientY: number) => {
  const scrollContainer = dragState.value.scrollContainer
  if (!scrollContainer || !autoScroll) return
  
  const rect = scrollContainer.getBoundingClientRect()
  const scrollZone = 60 // px from edge to trigger scroll
  const scrollSpeed = 5 // px per frame
  
  if (clientY < rect.top + scrollZone) {
    // Scroll up
    scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop - scrollSpeed)
  } else if (clientY > rect.bottom - scrollZone) {
    // Scroll down
    scrollContainer.scrollTop = Math.min(
      scrollContainer.scrollHeight - scrollContainer.clientHeight,
      scrollContainer.scrollTop + scrollSpeed
    )
  }
}

const handleTouchMove = (event: TouchEvent) => {
  handleMove(event.touches[0].clientX, event.touches[0].clientY)
}

const handleMouseMove = (event: MouseEvent) => {
  handleMove(event.clientX, event.clientY)
}

// Update the trackVelocity function
const trackVelocity = (clientX: number, clientY: number) => {
  const now = Date.now()
  dragState.value.velocityTracker.push({ x: clientX, y: clientY, time: now })
  
  // Keep only last 5 points for velocity calculation
  if (dragState.value.velocityTracker.length > 5) {
    dragState.value.velocityTracker.shift()
  }
}



export function useAdvancedDragDrop(options: DragDropOptions = {}) {
  const {
    hapticFeedback = true,
    autoScroll = true,
    smoothAnimations = true,
    ghostOpacity = 0.8,
    longPressDelay = 500,
    minimumDistance = 5,
    snapToGrid = false,
    accessibilityMode = false
  } = options

  const dragState = ref<DragState>({
    isDragging: false,
    draggedIndex: null,
    dragOverIndex: null,
    initialPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    draggedElement: null,
    ghostElement: null,
    scrollContainer: null,
    animationFrameId: null,
    touchStartTime: 0,
    hasMovedMinDistance: false,
    velocityTracker: [],
    isLongPress: false,
    cancelTimeout: null
  })

  const isActive = computed(() => dragState.value.isDragging)
  const draggedIndex = computed(() => dragState.value.draggedIndex)
  const dragOverIndex = computed(() => dragState.value.dragOverIndex)

  // Haptic feedback utilities
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback) return
    
    try {
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        }
        navigator.vibrate(patterns[type])
      }
      
      // iOS haptic feedback
      if ('ontouchstart' in window) {
        const event = new CustomEvent('hapticFeedback', { detail: { type } })
        window.dispatchEvent(event)
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error)
    }
  }

  // Create ghost element for visual feedback
  const createGhostElement = (sourceElement: HTMLElement): HTMLElement => {
    const ghost = sourceElement.cloneNode(true) as HTMLElement
    const rect = sourceElement.getBoundingClientRect()
    
    // Style the ghost
    ghost.style.position = 'fixed'
    ghost.style.top = `${rect.top}px`
    ghost.style.left = `${rect.left}px`
    ghost.style.width = `${rect.width}px`
    ghost.style.height = `${rect.height}px`
    ghost.style.opacity = ghostOpacity.toString()
    ghost.style.pointerEvents = 'none'
    ghost.style.zIndex = '9999'
    ghost.style.borderRadius = '12px'
    ghost.style.transform = 'rotate(2deg) scale(1.05)'
    ghost.style.transition = smoothAnimations ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
    ghost.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
    ghost.style.backdropFilter = 'blur(8px)'
    
    // Add pulsing animation
    ghost.style.animation = smoothAnimations ? 'ghostPulse 2s ease-in-out infinite' : 'none'
    
    // Remove any event listeners from the clone
    ghost.removeAttribute('draggable')
    ghost.querySelectorAll('*').forEach(el => {
      el.removeAttribute('draggable')
    })
    
    return ghost
  }

  // Track velocity for momentum calculations
  const trackVelocity = (x: number, y: number) => {
    const now = Date.now()
    dragState.value.velocityTracker.push({ x, y, time: now })
    
    // Keep only recent entries (last 100ms)
    dragState.value.velocityTracker = dragState.value.velocityTracker.filter(
      entry => now - entry.time < 100
    )
  }

  // Calculate velocity for momentum
  const calculateVelocity = (): { x: number; y: number } => {
    const tracker = dragState.value.velocityTracker
    if (tracker.length < 2) return { x: 0, y: 0 }
    
    const recent = tracker.slice(-5) // Last 5 entries
    const first = recent[0]
    const last = recent[recent.length - 1]
    
    const timeDiff = last.time - first.time
    if (timeDiff === 0) return { x: 0, y: 0 }
    
    return {
      x: (last.x - first.x) / timeDiff,
      y: (last.y - first.y) / timeDiff
    }
  }

  // Auto-scroll when dragging near edges
  const handleAutoScroll = (clientY: number) => {
    if (!autoScroll || !dragState.value.scrollContainer) return

    const container = dragState.value.scrollContainer
    const rect = container.getBoundingClientRect()
    const scrollZone = 50 // pixels from edge
    const maxSpeed = 10 // pixels per frame
    
    let scrollSpeed = 0
    
    if (clientY < rect.top + scrollZone) {
      // Scroll up
      scrollSpeed = -maxSpeed * (1 - (clientY - rect.top) / scrollZone)
    } else if (clientY > rect.bottom - scrollZone) {
      // Scroll down
      scrollSpeed = maxSpeed * (1 - (rect.bottom - clientY) / scrollZone)
    }
    
    if (scrollSpeed !== 0) {
      container.scrollTop += scrollSpeed
    }
  }

  // Find drop target at coordinates
  const findDropTarget = (x: number, y: number): { element: HTMLElement | null; index: number } => {
    const elements = document.elementsFromPoint(x, y)
    
    for (const element of elements) {
      const dropZone = element.closest('[data-drop-zone]') as HTMLElement
      if (dropZone && dropZone !== dragState.value.draggedElement) {
        const index = parseInt(dropZone.dataset.dropZone || '0')
        return { element: dropZone, index }
      }
    }
    
    return { element: null, index: -1 }
  }

  // Enhanced drag start
  const handleDragStart = (index: number, event: MouseEvent | TouchEvent) => {
    if (options.disabled) return

    const target = event.currentTarget as HTMLElement
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

    // Initialize drag state
    dragState.value = {
      ...dragState.value,
      draggedIndex: index,
      draggedElement: target,
      initialPosition: { x: clientX, y: clientY },
      currentPosition: { x: clientX, y: clientY },
      touchStartTime: Date.now(),
      hasMovedMinDistance: false,
      velocityTracker: [{ x: clientX, y: clientY, time: Date.now() }],
      isLongPress: false
    }

    // Set up scroll container
    if (options.scrollContainer) {
      dragState.value.scrollContainer = typeof options.scrollContainer === 'string'
        ? document.querySelector(options.scrollContainer)
        : options.scrollContainer
    }

    // Long press detection for touch devices
    if ('touches' in event) {
      dragState.value.cancelTimeout = setTimeout(() => {
        if (!dragState.value.hasMovedMinDistance) {
          dragState.value.isLongPress = true
          startDragging()
        }
      }, longPressDelay)
    } else {
      // Immediate start for mouse events
      startDragging()
    }

    // Prevent default behaviors
    event.preventDefault()
    event.stopPropagation()
  }

  const startDragging = () => {
    dragState.value.isDragging = true
    
    // Create ghost element
    if (dragState.value.draggedElement) {
      dragState.value.ghostElement = createGhostElement(dragState.value.draggedElement)
      document.body.appendChild(dragState.value.ghostElement)
      
      // Style the original element
      dragState.value.draggedElement.style.opacity = '0.5'
      dragState.value.draggedElement.style.transform = 'scale(0.98)'
      
      if (smoothAnimations) {
        dragState.value.draggedElement.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
    
    // Trigger haptic feedback
    triggerHapticFeedback('medium')
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchend', handleDragEnd)
    document.addEventListener('keydown', handleKeyDown)
    
    // Start animation loop
    dragState.value.animationFrameId = requestAnimationFrame(animationLoop)
    
    // Callback
    options.onStart?.(dragState.value.draggedIndex!)
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!dragState.value.isDragging) return
    updateDragPosition(event.clientX, event.clientY)
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!dragState.value.isDragging) return
    event.preventDefault()
    
    const touch = event.touches[0]
    updateDragPosition(touch.clientX, touch.clientY)
  }

  const updateDragPosition = (clientX: number, clientY: number) => {
    const deltaX = clientX - dragState.value.initialPosition.x
    const deltaY = clientY - dragState.value.initialPosition.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Check if minimum distance moved
    if (!dragState.value.hasMovedMinDistance && distance >= minimumDistance) {
      dragState.value.hasMovedMinDistance = true
      
      // Cancel long press timer if still active
      if (dragState.value.cancelTimeout) {
        clearTimeout(dragState.value.cancelTimeout)
        dragState.value.cancelTimeout = null
      }
      
      // Start dragging if not already started (for touch)
      if (!dragState.value.isDragging) {
        startDragging()
      }
    }
    
    if (!dragState.value.isDragging) return
    
    // Update position
    dragState.value.currentPosition = { x: clientX, y: clientY }
    
    // Track velocity
    trackVelocity(clientX, clientY)
    
    // Update ghost position
    if (dragState.value.ghostElement) {
      let newX = clientX - dragState.value.initialPosition.x
      let newY = clientY - dragState.value.initialPosition.y
      
      // Snap to grid if enabled
      if (snapToGrid) {
        const gridSize = 20
        newX = Math.round(newX / gridSize) * gridSize
        newY = Math.round(newY / gridSize) * gridSize
      }
      
      dragState.value.ghostElement.style.transform = `translate(${newX}px, ${newY}px) rotate(2deg) scale(1.05)`
    }
    
    // Find drop target
    const dropTarget = findDropTarget(clientX, clientY)
    
    if (dropTarget.index !== -1 && dropTarget.index !== dragState.value.dragOverIndex) {
      // Update drop target
      const previousIndex = dragState.value.dragOverIndex
      dragState.value.dragOverIndex = dropTarget.index
      
      // Visual feedback for drop zones
      updateDropZoneVisuals(previousIndex, dropTarget.index)
      
      // Haptic feedback for new drop zone
      triggerHapticFeedback('light')
    }
    
    // Auto-scroll
    handleAutoScroll(clientY)
  }

  const updateDropZoneVisuals = (previousIndex: number | null, newIndex: number) => {
    // Clear previous highlights
    if (previousIndex !== null) {
      const prevElement = document.querySelector(`[data-drop-zone="${previousIndex}"]`)
      if (prevElement) {
        prevElement.classList.remove('drop-zone-active')
      }
    }
    
    // Add new highlight
    const newElement = document.querySelector(`[data-drop-zone="${newIndex}"]`)
    if (newElement) {
      newElement.classList.add('drop-zone-active')
      
      // Smooth highlight animation
      if (smoothAnimations) {
        newElement.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!dragState.value.isDragging) return
    
    switch (event.key) {
      case 'Escape':
        cancelDrag()
        break
      case 'ArrowUp':
        if (accessibilityMode) {
          moveToIndex(Math.max(0, (dragState.value.dragOverIndex || 0) - 1))
        }
        break
      case 'ArrowDown':
        if (accessibilityMode) {
          moveToIndex((dragState.value.dragOverIndex || 0) + 1)
        }
        break
      case 'Enter':
      case ' ':
        if (accessibilityMode) {
          completeDrag()
        }
        break
    }
  }

  const moveToIndex = (index: number) => {
    if (dragState.value.dragOverIndex !== index) {
      updateDropZoneVisuals(dragState.value.dragOverIndex, index)
      dragState.value.dragOverIndex = index
      triggerHapticFeedback('light')
    }
  }

  const animationLoop = () => {
    if (!dragState.value.isDragging) return
    
    // Smooth animations and physics can be added here
    // For now, just continue the loop
    dragState.value.animationFrameId = requestAnimationFrame(animationLoop)
  }

  const completeDrag = () => {
    const fromIndex = dragState.value.draggedIndex
    const toIndex = dragState.value.dragOverIndex
    
    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      // Calculate momentum for smooth transition
      const velocity = calculateVelocity()
      
      // Trigger completion haptic
      triggerHapticFeedback('heavy')
      
      // Animate to final position
      if (dragState.value.ghostElement && smoothAnimations) {
        const targetElement = document.querySelector(`[data-drop-zone="${toIndex}"]`)
        if (targetElement) {
          const targetRect = targetElement.getBoundingClientRect()
          const ghostRect = dragState.value.ghostElement.getBoundingClientRect()
          
          dragState.value.ghostElement.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
          dragState.value.ghostElement.style.transform = `translate(${targetRect.left - ghostRect.left}px, ${targetRect.top - ghostRect.top}px) scale(1) rotate(0deg)`
          dragState.value.ghostElement.style.opacity = '0'
          
          // Complete after animation
          setTimeout(() => {
            options.onMove?.(fromIndex, toIndex)
            cleanupDrag()
          }, 300)
          return
        }
      }
      
      // Immediate completion if no animation
      options.onMove?.(fromIndex, toIndex)
    }
    
    cleanupDrag()
  }

  const cancelDrag = () => {
    triggerHapticFeedback('light')
    options.onCancel?.()
    cleanupDrag()
  }

  const handleDragEnd = () => {
    if (dragState.value.cancelTimeout) {
      clearTimeout(dragState.value.cancelTimeout)
      dragState.value.cancelTimeout = null
    }
    
    if (dragState.value.isDragging) {
      completeDrag()
    } else {
      cleanupDrag()
    }
  }

  const cleanupDrag = () => {
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('mouseup', handleDragEnd)
    document.removeEventListener('touchend', handleDragEnd)
    document.removeEventListener('keydown', handleKeyDown)
    
    // Cancel animation loop
    if (dragState.value.animationFrameId) {
      cancelAnimationFrame(dragState.value.animationFrameId)
      dragState.value.animationFrameId = null
    }
    
    // Cleanup ghost element
    if (dragState.value.ghostElement) {
      document.body.removeChild(dragState.value.ghostElement)
      dragState.value.ghostElement = null
    }
    
    // Reset original element styles
    if (dragState.value.draggedElement) {
      dragState.value.draggedElement.style.opacity = ''
      dragState.value.draggedElement.style.transform = ''
      dragState.value.draggedElement.style.transition = ''
    }
    
    // Clear drop zone highlights
    document.querySelectorAll('.drop-zone-active').forEach(el => {
      el.classList.remove('drop-zone-active')
    })
    
    // Reset state
    dragState.value = {
      isDragging: false,
      draggedIndex: null,
      dragOverIndex: null,
      initialPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      draggedElement: null,
      ghostElement: null,
      scrollContainer: null,
      animationFrameId: null,
      touchStartTime: 0,
      hasMovedMinDistance: false,
      velocityTracker: [],
      isLongPress: false,
      cancelTimeout: null
    }
    
    // Callback
    options.onEnd?.()
  }

  // Accessibility helpers
  const getAriaAttributes = (index: number) => {
    if (!accessibilityMode) return {}
    
    return {
      'aria-grabbed': dragState.value.draggedIndex === index,
      'aria-dropeffect': dragState.value.isDragging ? 'move' : 'none',
      'tabindex': '0',
      'role': 'button',
      'aria-label': `Drag to reorder item ${index + 1}. Press space or enter to pick up, arrow keys to move, space or enter to drop.`
    }
  }

  const getDragAttributes = (index: number) => {
    return {
      'data-drop-zone': index.toString(),
      'data-drag-index': index.toString(),
      onMousedown: (event: MouseEvent) => handleDragStart(index, event),
      onTouchstart: (event: TouchEvent) => handleDragStart(index, event),
      ...getAriaAttributes(index)
    }
  }

  const getDragClasses = (index: number) => {
    return {
      'is-dragging': dragState.value.draggedIndex === index,
      'is-drag-over': dragState.value.dragOverIndex === index,
      'drop-zone-active': dragState.value.dragOverIndex === index,
      'drag-disabled': options.disabled,
      'accessibility-mode': accessibilityMode
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (dragState.value.isDragging) {
      cleanupDrag()
    }
  })

  return {
    // State
    isActive,
    draggedIndex,
    dragOverIndex,
    isDragging: computed(() => dragState.value.isDragging),
    
    // Methods
    getDragAttributes,
    getDragClasses,
    cancelDrag,
    handleKeyDown,
    handleDragStart,
    handleMouseMove,
    handleTouchMove,
    handleDragEnd,
    
    // Utilities
    triggerHapticFeedback
  }
}

// CSS keyframes for ghost animation (add to your styles)
export const dragDropStyles = `
@keyframes ghostPulse {
  0%, 100% { transform: rotate(2deg) scale(1.05); }
  50% { transform: rotate(2deg) scale(1.08); }
}

.drop-zone-active {
  transform: scale(1.02) !important;
  background-color: rgba(59, 130, 246, 0.1) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
}

.is-dragging {
  opacity: 0.5 !important;
  transform: scale(0.98) !important;
}

.drag-disabled {
  cursor: not-allowed !important;
  opacity: 0.6 !important;
}

.accessibility-mode {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.accessibility-mode:focus {
  outline-color: rgba(59, 130, 246, 0.5);
}
`

export const useDragAndDrop = useAdvancedDragDrop

export default useDragAndDrop