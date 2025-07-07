// src/runtime/composables/ui/useDragDrop.ts
export const useDragDrop = () => {
  const dragState = ref({
    isDragging: false,
    draggedItem: null as any,
    draggedType: null as "block" | "block-type" | null,
    dropZones: [] as any[],
    activeDropZone: null as number | null,
  });

  // Start dragging
  const startDrag = (
    item: any,
    type: "block" | "block-type",
    event: DragEvent,
  ) => {
    dragState.value.isDragging = true;
    dragState.value.draggedItem = item;
    dragState.value.draggedType = type;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify({ item, type }),
      );
    }

    // Add visual feedback
    if (event.target instanceof Element) {
      event.target.classList.add("dragging");
    }
  };

  // End dragging
  const endDrag = (event: DragEvent) => {
    dragState.value.isDragging = false;
    dragState.value.draggedItem = null;
    dragState.value.draggedType = null;
    dragState.value.dropZones = [];
    dragState.value.activeDropZone = null;

    // Remove visual feedback
    if (event.target instanceof Element) {
      event.target.classList.remove("dragging");
    }
  };

  // Handle drag over
  const dragOver = (event: DragEvent, dropZoneIndex?: number) => {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }

    if (dropZoneIndex !== undefined) {
      dragState.value.activeDropZone = dropZoneIndex;
    }
  };

  // Handle drag leave
  const dragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragState.value.activeDropZone = null;
  };

  // Handle drop
  const drop = (event: DragEvent, dropZoneIndex?: number) => {
    event.preventDefault();

    try {
      const data = event.dataTransfer?.getData("application/json");
      if (!data) return null;

      const { item, type } = JSON.parse(data);

      endDrag(event);

      return {
        item,
        type,
        dropZoneIndex,
      };
    } catch (error) {
      console.error("Failed to parse drop data:", error);
      endDrag(event);
      return null;
    }
  };

  // Calculate drop zones for a container
  const calculateDropZones = (containerElement: HTMLElement, blocks: any[]) => {
    if (!containerElement) return [];

    const zones = [];
    const containerRect = containerElement.getBoundingClientRect();

    // Add zone before first block
    zones.push({
      index: 0,
      y: 0,
      height: 20,
    });

    // Add zones between blocks
    const blockElements = containerElement.querySelectorAll("[data-block-id]");
    blockElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const relativeY = rect.bottom - containerRect.top;

      zones.push({
        index: index + 1,
        y: relativeY - 10,
        height: 20,
      });
    });

    dragState.value.dropZones = zones;
    return zones;
  };

  // Get drop zone at position
  const getDropZoneAtPosition = (y: number) => {
    return dragState.value.dropZones.find(
      (zone) => y >= zone.y && y <= zone.y + zone.height,
    );
  };

  // Visual feedback helpers
  const getDragPreview = (item: any, type: "block" | "block-type") => {
    const preview = document.createElement("div");
    preview.className
      = "drag-preview p-2 bg-white border border-gray-300 rounded shadow-lg text-sm";
    preview.style.position = "absolute";
    preview.style.pointerEvents = "none";
    preview.style.zIndex = "1000";

    if (type === "block") {
      preview.textContent = `${item.block_type.name} Block`;
    } else {
      preview.textContent = item.name;
    }

    return preview;
  };

  const updateDragPreview = (preview: HTMLElement, event: DragEvent) => {
    preview.style.left = `${event.clientX + 10}px`;
    preview.style.top = `${event.clientY - 10}px`;
  };

  // Cleanup
  const cleanup = () => {
    dragState.value.isDragging = false;
    dragState.value.draggedItem = null;
    dragState.value.draggedType = null;
    dragState.value.dropZones = [];
    dragState.value.activeDropZone = null;
  };

  return {
    dragState: readonly(dragState),
    startDrag,
    endDrag,
    dragOver,
    dragLeave,
    drop,
    calculateDropZones,
    getDropZoneAtPosition,
    getDragPreview,
    updateDragPreview,
    cleanup,
  };
};
