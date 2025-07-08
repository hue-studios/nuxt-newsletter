// src/runtime/composables/ui/useDragDrop.ts
import { ref, onMounted, onUnmounted } from "vue";
import type { NewsletterBlock, BlockType } from "../../types/newsletter";

export interface DragDropOptions {
  ghostClass?: string;
  chosenClass?: string;
  dragClass?: string;
  animation?: number;
  disabled?: boolean;
}

export const useDragDrop = () => {
  const isDragging = ref(false);
  const draggedItem = ref<NewsletterBlock | BlockType | null>(null);
  const dropZones = ref<HTMLElement[]>([]);
  const activeDropZone = ref<number | null>(null);

  const initializeDragDrop = (
    container: HTMLElement,
    options: DragDropOptions = {}
  ) => {
    if (!container) return;

    const {
      ghostClass = "drag-ghost",
      chosenClass = "drag-chosen",
      dragClass = "drag-dragging",
      animation = 150,
      disabled = false,
    } = options;

    // Implementation will go here when we have sortablejs
    console.log("Initializing drag drop for:", container, options);
  };

  const handleDragStart = (
    item: NewsletterBlock | BlockType,
    event: DragEvent
  ) => {
    isDragging.value = true;
    draggedItem.value = item;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", JSON.stringify(item));
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (event: DragEvent, targetIndex?: number) => {
    event.preventDefault();

    if (!draggedItem.value) return;

    const dropData = {
      item: draggedItem.value,
      targetIndex,
      event,
    };

    // Reset drag state
    isDragging.value = false;
    draggedItem.value = null;
    activeDropZone.value = null;

    return dropData;
  };

  const handleDragEnd = () => {
    isDragging.value = false;
    draggedItem.value = null;
    activeDropZone.value = null;
  };

  const addDropZone = (element: HTMLElement) => {
    if (element && !dropZones.value.includes(element)) {
      dropZones.value.push(element);
    }
  };

  const removeDropZone = (element: HTMLElement) => {
    const index = dropZones.value.indexOf(element);
    if (index > -1) {
      dropZones.value.splice(index, 1);
    }
  };

  const highlightDropZone = (index: number) => {
    activeDropZone.value = index;
  };

  const clearHighlight = () => {
    activeDropZone.value = null;
  };

  return {
    isDragging,
    draggedItem,
    dropZones,
    activeDropZone,
    initializeDragDrop,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    addDropZone,
    removeDropZone,
    highlightDropZone,
    clearHighlight,
  };
};
