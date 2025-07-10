// src/runtime/composables/ui/useEditor.ts
import { ref, readonly, type Ref, type DeepReadonly } from "vue";

export interface UseEditorReturn {
  editorContent: DeepReadonly<Ref<string>>;
  isEditing: DeepReadonly<Ref<boolean>>;
  selectedElement: DeepReadonly<Ref<HTMLElement | null>>;
  startEditing: () => void;
  stopEditing: () => void;
  selectElement: (element: HTMLElement) => void;
  updateContent: (content: string) => void;
}

export const useEditor = (): UseEditorReturn => {
  const editorContent = ref("");
  const isEditing = ref(false);
  const selectedElement = ref<HTMLElement | null>(null);

  const startEditing = () => {
    isEditing.value = true;
  };

  const stopEditing = () => {
    isEditing.value = false;
    selectedElement.value = null;
  };

  const selectElement = (element: HTMLElement) => {
    selectedElement.value = element;
  };

  const updateContent = (content: string) => {
    editorContent.value = content;
  };

  return {
    editorContent: readonly(editorContent),
    isEditing: readonly(isEditing),
    selectedElement: readonly(selectedElement),
    startEditing,
    stopEditing,
    selectElement,
    updateContent,
  };
};
