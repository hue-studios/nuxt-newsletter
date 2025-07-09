// src/runtime/composables/ui/useDragDrop.ts
import { ref, readonly } from "vue";

export const useDragDrop = () => {
  const isDragging = ref(false);
  const draggedItem = ref<any>(null);
  const dropZones = ref<HTMLElement[]>([]);

  const onDragStart = (item: any, event: DragEvent) => {
    isDragging.value = true;
    draggedItem.value = item;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", JSON.stringify(item));
    }
  };

  const onDragEnd = () => {
    isDragging.value = false;
    draggedItem.value = null;
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  };

  const onDrop = (
    event: DragEvent,
    onDropCallback?: (item: any, target: any) => void
  ) => {
    event.preventDefault();

    if (event.dataTransfer) {
      const data = event.dataTransfer.getData("text/plain");
      try {
        const item = JSON.parse(data);
        if (onDropCallback) {
          onDropCallback(item, event.target);
        }
      } catch (error) {
        console.error("Error parsing drag data:", error);
      }
    }

    isDragging.value = false;
    draggedItem.value = null;
  };

  return {
    isDragging: readonly(isDragging),
    draggedItem: readonly(draggedItem),
    dropZones: readonly(dropZones),
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
  };
};
