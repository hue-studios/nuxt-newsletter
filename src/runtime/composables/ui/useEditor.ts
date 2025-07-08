// src/runtime/composables/ui/useEditor.ts
import { ref, computed } from "vue";
import type {
  Newsletter,
  NewsletterBlock,
  EditorState,
} from "../../types/newsletter";

export const useEditor = () => {
  const editorState = ref<EditorState>({
    selectedBlock: null,
    draggedBlock: null,
    isPreviewMode: false,
    showTemplateLibrary: false,
    showContentLibrary: false,
    isCompiling: false,
    isSaving: false,
  });

  const history = ref<any[]>([]);
  const historyIndex = ref(-1);
  const maxHistorySize = 50;

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  const selectBlock = (block: NewsletterBlock | null) => {
    editorState.value.selectedBlock = block;
  };

  const togglePreview = () => {
    editorState.value.isPreviewMode = !editorState.value.isPreviewMode;
  };

  const toggleTemplateLibrary = () => {
    editorState.value.showTemplateLibrary =
      !editorState.value.showTemplateLibrary;
  };

  const toggleContentLibrary = () => {
    editorState.value.showContentLibrary =
      !editorState.value.showContentLibrary;
  };

  const addToHistory = (action: any) => {
    // Remove any future history if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    history.value.push(action);
    historyIndex.value++;

    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value.shift();
      historyIndex.value--;
    }
  };

  const undo = () => {
    if (canUndo.value) {
      historyIndex.value--;
      const action = history.value[historyIndex.value];
      // Implementation will go here
      console.log("Undoing action:", action);
    }
  };

  const redo = () => {
    if (canRedo.value) {
      historyIndex.value++;
      const action = history.value[historyIndex.value];
      // Implementation will go here
      console.log("Redoing action:", action);
    }
  };

  const clearHistory = () => {
    history.value = [];
    historyIndex.value = -1;
  };

  const saveSnapshot = (newsletter: Newsletter) => {
    addToHistory({
      type: "snapshot",
      data: JSON.parse(JSON.stringify(newsletter)),
      timestamp: Date.now(),
    });
  };

  const initializeEditor = (newsletter: Newsletter) => {
    // Reset editor state
    editorState.value = {
      selectedBlock: null,
      draggedBlock: null,
      isPreviewMode: false,
      showTemplateLibrary: false,
      showContentLibrary: false,
      isCompiling: false,
      isSaving: false,
    };

    // Clear history
    clearHistory();

    // Take initial snapshot
    saveSnapshot(newsletter);
  };

  const setLoading = (loading: boolean) => {
    editorState.value.isSaving = loading;
  };

  const setCompiling = (compiling: boolean) => {
    editorState.value.isCompiling = compiling;
  };

  return {
    editorState,
    canUndo,
    canRedo,
    selectBlock,
    togglePreview,
    toggleTemplateLibrary,
    toggleContentLibrary,
    undo,
    redo,
    saveSnapshot,
    initializeEditor,
    setLoading,
    setCompiling,
  };
};
