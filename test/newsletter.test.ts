// test/newsletter.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import NewsletterEditor from "../components/NewsletterEditor.vue";
import { useNewsletter } from "../composables/useNewsletter";

// Mock GSAP
vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: vi.fn(),
    to: vi.fn(),
    from: vi.fn(),
    set: vi.fn(),
  },
  Draggable: vi.fn(),
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
      },
    });
  });

  it("renders newsletter editor", () => {
    expect(wrapper.find(".newsletter-editor").exists()).toBe(true);
  });

  it("displays newsletter title", () => {
    expect(wrapper.text()).toContain("Test Newsletter");
  });

  it("shows block library", () => {
    expect(wrapper.find(".block-library").exists()).toBe(true);
  });

  it("has newsletter canvas", () => {
    expect(wrapper.find(".newsletter-canvas").exists()).toBe(true);
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
    } = useNewsletter();

    expect(newsletters).toBeDefined();
    expect(currentNewsletter).toBeDefined();
    expect(isLoading).toBeDefined();
    expect(typeof createNewsletter).toBe("function");
    expect(typeof updateNewsletter).toBe("function");
    expect(typeof deleteNewsletter).toBe("function");
  });
});
