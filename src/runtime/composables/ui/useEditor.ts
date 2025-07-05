// src/runtime/composables/ui/useEditor.ts
export const useEditor = (newsletter: Ref<any>) => {
  const editorState = ref({
    selectedBlock: null as any,
    draggedBlock: null as any,
    isPreviewMode: false,
    showTemplateLibrary: false,
    showContentLibrary: false,
    isCompiling: false,
    isSaving: false,
    canUndo: false,
    canRedo: false,
  });

  const history = ref<any[]>([]);
  const historyIndex = ref(-1);
  const maxHistorySize = 50;

  // Editor actions
  const selectBlock = (block: any) => {
    editorState.value.selectedBlock = block;
  };

  const deselectBlock = () => {
    editorState.value.selectedBlock = null;
  };

  const togglePreview = () => {
    editorState.value.isPreviewMode = !editorState.value.isPreviewMode;
    if (editorState.value.isPreviewMode) {
      deselectBlock();
    }
  };

  const toggleTemplateLibrary = () => {
    editorState.value.showTemplateLibrary =
      !editorState.value.showTemplateLibrary;
  };

  const toggleContentLibrary = () => {
    editorState.value.showContentLibrary =
      !editorState.value.showContentLibrary;
  };

  // History management
  const saveToHistory = (state: any, action: string) => {
    // Remove any history beyond current index
    history.value = history.value.slice(0, historyIndex.value + 1);

    // Add new state to history
    history.value.push({
      state: JSON.parse(JSON.stringify(state)),
      action,
      timestamp: Date.now(),
    });

    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value.shift();
    } else {
      historyIndex.value++;
    }

    updateHistoryState();
  };

  const undo = () => {
    if (editorState.value.canUndo && historyIndex.value > 0) {
      historyIndex.value--;
      const previousState = history.value[historyIndex.value];
      restoreState(previousState.state);
      updateHistoryState();
    }
  };

  const redo = () => {
    if (
      editorState.value.canRedo &&
      historyIndex.value < history.value.length - 1
    ) {
      historyIndex.value++;
      const nextState = history.value[historyIndex.value];
      restoreState(nextState.state);
      updateHistoryState();
    }
  };

  const updateHistoryState = () => {
    editorState.value.canUndo = historyIndex.value > 0;
    editorState.value.canRedo = historyIndex.value < history.value.length - 1;
  };

  const restoreState = (state: any) => {
    // Restore newsletter state
    Object.assign(newsletter.value, state);
  };

  // Keyboard shortcuts
  const { ctrl_z, ctrl_y, ctrl_shift_z, escape } = useMagicKeys({
    passive: false,
    onEventFired(e) {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        redo();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        deselectBlock();
      }
    },
  });

  // Auto-save functionality
  const { pause: pauseAutoSave, resume: resumeAutoSave } = useIntervalFn(() => {
    if (!editorState.value.isSaving && newsletter.value?.id) {
      saveNewsletter();
    }
  }, 30000); // Auto-save every 30 seconds

  const saveNewsletter = async () => {
    if (editorState.value.isSaving) return;

    try {
      editorState.value.isSaving = true;
      const { updateNewsletter } = useNewsletter();
      await updateNewsletter(newsletter.value.id, newsletter.value);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      editorState.value.isSaving = false;
    }
  };

  // Block operations
  const addBlock = (blockType: any, position?: number) => {
    const newBlock = {
      id: Date.now(), // Temporary ID
      newsletter_id: newsletter.value.id,
      block_type: blockType,
      sort: position ?? (newsletter.value.blocks?.length || 0) + 1,
      title: "",
      text_content: "",
      background_color: "#ffffff",
      text_color: "#333333",
      text_align: "center",
      padding: "20px 0",
      font_size: "14px",
    };

    if (!newsletter.value.blocks) {
      newsletter.value.blocks = [];
    }

    if (position !== undefined) {
      newsletter.value.blocks.splice(position, 0, newBlock);
      // Update sort order for subsequent blocks
      newsletter.value.blocks.forEach((block: any, index: number) => {
        block.sort = index + 1;
      });
    } else {
      newsletter.value.blocks.push(newBlock);
    }

    saveToHistory(newsletter.value, `Added ${blockType.name} block`);
    selectBlock(newBlock);
  };

  const updateBlock = (blockId: number, updates: any) => {
    if (!newsletter.value.blocks) return;

    const blockIndex = newsletter.value.blocks.findIndex(
      (b: any) => b.id === blockId
    );
    if (blockIndex === -1) return;

    const oldBlock = { ...newsletter.value.blocks[blockIndex] };
    newsletter.value.blocks[blockIndex] = {
      ...newsletter.value.blocks[blockIndex],
      ...updates,
    };

    // Only save to history for significant changes
    const significantFields = [
      "title",
      "text_content",
      "image_url",
      "button_text",
      "button_url",
    ];
    const hasSignificantChange = Object.keys(updates).some((key) =>
      significantFields.includes(key)
    );

    if (hasSignificantChange) {
      saveToHistory(
        newsletter.value,
        `Updated ${oldBlock.block_type.name} block`
      );
    }
  };

  const deleteBlock = (blockId: number) => {
    if (!newsletter.value.blocks) return;

    const blockIndex = newsletter.value.blocks.findIndex(
      (b: any) => b.id === blockId
    );
    if (blockIndex === -1) return;

    const deletedBlock = newsletter.value.blocks[blockIndex];
    newsletter.value.blocks.splice(blockIndex, 1);

    // Update sort order
    newsletter.value.blocks.forEach((block: any, index: number) => {
      block.sort = index + 1;
    });

    saveToHistory(
      newsletter.value,
      `Deleted ${deletedBlock.block_type.name} block`
    );

    // Deselect if deleted block was selected
    if (editorState.value.selectedBlock?.id === blockId) {
      deselectBlock();
    }
  };

  const duplicateBlock = (block: any) => {
    const duplicatedBlock = {
      ...block,
      id: Date.now(), // Temporary ID
      sort: block.sort + 1,
    };

    if (!newsletter.value.blocks) {
      newsletter.value.blocks = [];
    }

    // Insert after the original block
    const insertIndex =
      newsletter.value.blocks.findIndex((b: any) => b.id === block.id) + 1;
    newsletter.value.blocks.splice(insertIndex, 0, duplicatedBlock);

    // Update sort order for subsequent blocks
    newsletter.value.blocks.forEach((block: any, index: number) => {
      block.sort = index + 1;
    });

    saveToHistory(
      newsletter.value,
      `Duplicated ${block.block_type.name} block`
    );
    selectBlock(duplicatedBlock);
  };

  const moveBlock = (blockId: number, direction: "up" | "down") => {
    if (!newsletter.value.blocks) return;

    const blockIndex = newsletter.value.blocks.findIndex(
      (b: any) => b.id === blockId
    );
    if (blockIndex === -1) return;

    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= newsletter.value.blocks.length) return;

    // Swap blocks
    const temp = newsletter.value.blocks[blockIndex];
    newsletter.value.blocks[blockIndex] = newsletter.value.blocks[newIndex];
    newsletter.value.blocks[newIndex] = temp;

    // Update sort order
    newsletter.value.blocks.forEach((block: any, index: number) => {
      block.sort = index + 1;
    });

    saveToHistory(
      newsletter.value,
      `Moved ${temp.block_type.name} block ${direction}`
    );
  };

  const reorderBlocks = (newOrder: number[]) => {
    if (!newsletter.value.blocks) return;

    const reorderedBlocks = newOrder
      .map((id) => newsletter.value.blocks.find((b: any) => b.id === id))
      .filter(Boolean);

    newsletter.value.blocks = reorderedBlocks;
    newsletter.value.blocks.forEach((block: any, index: number) => {
      block.sort = index + 1;
    });

    saveToHistory(newsletter.value, "Reordered blocks");
  };

  // Validation
  const validateNewsletter = () => {
    const errors = [];

    if (!newsletter.value.title?.trim()) {
      errors.push({ field: "title", message: "Title is required" });
    }

    if (!newsletter.value.subject_line?.trim()) {
      errors.push({
        field: "subject_line",
        message: "Subject line is required",
      });
    }

    if (!newsletter.value.from_email?.trim()) {
      errors.push({ field: "from_email", message: "From email is required" });
    }

    if (!newsletter.value.blocks?.length) {
      errors.push({
        field: "blocks",
        message: "Newsletter must have at least one block",
      });
    }

    return errors;
  };

  // Cleanup
  onBeforeUnmount(() => {
    pauseAutoSave();
  });

  return {
    editorState: readonly(editorState),
    selectBlock,
    deselectBlock,
    togglePreview,
    toggleTemplateLibrary,
    toggleContentLibrary,
    undo,
    redo,
    saveNewsletter,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    reorderBlocks,
    validateNewsletter,
    saveToHistory,
  };
};
