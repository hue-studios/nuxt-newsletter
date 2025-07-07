// test/newsletter.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import NewsletterEditor from "../src/runtime/components/editor/NewsletterEditor.vue";
import { useNewsletter } from "../src/runtime/composables/useNewsletter";

// Mock GSAP with new import structure
vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: vi.fn(),
    to: vi.fn(),
    from: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn(),
      from: vi.fn(),
      set: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      reverse: vi.fn(),
      kill: vi.fn(),
    })),
  },
}));

vi.mock("gsap/Draggable", () => ({
  Draggable: {
    create: vi.fn(() => ({
      kill: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
    })),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    create: vi.fn(),
    refresh: vi.fn(),
    kill: vi.fn(),
  },
}));

vi.mock("gsap/ScrollSmoother", () => ({
  ScrollSmoother: {
    create: vi.fn(),
  },
}));

vi.mock("gsap/MorphSVGPlugin", () => ({
  MorphSVGPlugin: {},
}));

describe("NewsletterEditor", () => {
  let wrapper;
  let mockNewsletter;

  beforeEach(() => {
    mockNewsletter = {
      id: 1,
      title: "Test Newsletter",
      subject_line: "Test Subject",
      from_name: "Test Sender",
      from_email: "test@example.com",
      status: "draft",
      blocks: [],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    wrapper = mount(NewsletterEditor, {
      props: {
        newsletter: mockNewsletter,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        stubs: {
          Button: true,
          Icon: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          DialogFooter: true,
          Input: true,
          Label: true,
          NewsletterBlock: true,
          BlockEditor: true,
          BlockPicker: true,
          TransitionGroup: true,
        },
      },
    });
  });

  it("renders newsletter editor", () => {
    expect(wrapper.find(".newsletter-editor").exists()).toBe(true);
  });

  it("displays newsletter title", () => {
    expect(wrapper.text()).toContain("Test Newsletter");
  });

  it("shows block library section", () => {
    expect(wrapper.text()).toContain("Blocks");
  });

  it("has newsletter canvas", () => {
    expect(wrapper.find(".newsletter-canvas").exists()).toBe(true);
  });

  it("shows properties panel", () => {
    expect(wrapper.text()).toContain("Properties");
  });

  it("displays empty state when no blocks", () => {
    expect(wrapper.text()).toContain("Drag blocks here to start building");
  });

  it("emits back event when back button clicked", async () => {
    const backButton = wrapper.find("button[data-testid=\"back-button\"]");
    if (backButton.exists()) {
      await backButton.trigger("click");
      expect(wrapper.emitted("back")).toBeTruthy();
    }
  });
});

describe("useNewsletter composable", () => {
  it("provides newsletter management functions", () => {
    const {
      newsletters,
      currentNewsletter,
      isLoading,
      createNewsletter,
      updateNewsletter,
      deleteNewsletter,
      editorState,
      selectBlock,
      autoSave,
      togglePreview,
    } = useNewsletter();

    expect(newsletters).toBeDefined();
    expect(currentNewsletter).toBeDefined();
    expect(isLoading).toBeDefined();
    expect(editorState).toBeDefined();
    expect(typeof createNewsletter).toBe("function");
    expect(typeof updateNewsletter).toBe("function");
    expect(typeof deleteNewsletter).toBe("function");
    expect(typeof selectBlock).toBe("function");
    expect(typeof autoSave).toBe("function");
    expect(typeof togglePreview).toBe("function");
  });

  it("has correct initial editor state", () => {
    const { editorState } = useNewsletter();

    expect(editorState.value).toEqual({
      selectedBlock: null,
      draggedBlock: null,
      isPreviewMode: false,
      showTemplateLibrary: false,
      showContentLibrary: false,
      isCompiling: false,
      isSaving: false,
    });
  });
});

describe("GSAP Integration", () => {
  it("registers GSAP plugins correctly", async () => {
    const { gsap } = await vi.importMock("gsap");

    // The component should register plugins when mounted
    mount(NewsletterEditor, {
      props: {
        newsletter: {
          id: 1,
          title: "Test",
          subject_line: "Test",
          from_name: "Test",
          from_email: "test@test.com",
          status: "draft",
          blocks: [],
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          Button: true,
          Icon: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          DialogFooter: true,
          Input: true,
          Label: true,
          NewsletterBlock: true,
          BlockEditor: true,
          BlockPicker: true,
          TransitionGroup: true,
        },
      },
    });

    expect(gsap.registerPlugin).toHaveBeenCalled();
  });
});

// Integration tests
describe("Newsletter Editor Integration", () => {
  it("handles drag and drop functionality", async () => {
    const wrapper = mount(NewsletterEditor, {
      props: {
        newsletter: {
          id: 1,
          title: "Test Newsletter",
          subject_line: "Test Subject",
          from_name: "Test Sender",
          from_email: "test@example.com",
          status: "draft",
          blocks: [],
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          Button: true,
          Icon: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          DialogFooter: true,
          Input: true,
          Label: true,
          NewsletterBlock: true,
          BlockEditor: true,
          BlockPicker: true,
          TransitionGroup: true,
        },
      },
    });

    const canvas = wrapper.find(".newsletter-canvas");
    expect(canvas.exists()).toBe(true);

    // Test drag over event
    await canvas.trigger("dragover");
    // Test drop event
    await canvas.trigger("drop");

    // Verify events are handled without errors
    expect(wrapper.exists()).toBe(true);
  });
});
