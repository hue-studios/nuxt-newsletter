// utils/performance.ts
export function lazyLoadComponent(componentPath: string) {
  return defineAsyncComponent({
    loader: () => import(componentPath),
    loadingComponent: () =>
      h("div", { class: "animate-pulse bg-gray-200 h-32 rounded" }),
    errorComponent: () =>
      h("div", { class: "text-red-500 p-4" }, "Failed to load component"),
    delay: 200,
    timeout: 3000,
  });
}

export function optimizeImages(
  url: string,
  options: { width?: number; height?: number; quality?: number } = {}
) {
  const { width = 800, height, quality = 80 } = options;

  // If using Directus assets
  if (url.includes("/assets/")) {
    const params = new URLSearchParams();
    params.set("width", width.toString());
    if (height) params.set("height", height.toString());
    params.set("quality", quality.toString());
    params.set("format", "webp");

    return `${url}?${params.toString()}`;
  }

  return url;
}

export function debounceRef<T>(ref: Ref<T>, delay: number = 300) {
  const debouncedRef = customRef((track, trigger) => {
    let timeout: NodeJS.Timeout;

    return {
      get() {
        track();
        return ref.value;
      },
      set(newValue) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          ref.value = newValue;
          trigger();
        }, delay);
      },
    };
  });

  return debouncedRef;
}
