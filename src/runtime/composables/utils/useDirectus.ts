export const useDirectus = () => {
  const config = useRuntimeConfig();
  const directus = createDirectus(config.public.newsletter.directusUrl).with(
    rest()
  );

  // Connection state
  const connectionState = ref({
    isConnected: false,
    isConnecting: false,
    lastError: null as string | null,
  });

  // Test connection
  const testConnection = async () => {
    connectionState.value.isConnecting = true;
    connectionState.value.lastError = null;

    try {
      await directus.request(readItems("collections", { limit: 1 }));
      connectionState.value.isConnected = true;
      return true;
    } catch (error: any) {
      connectionState.value.lastError = error.message;
      connectionState.value.isConnected = false;
      return false;
    } finally {
      connectionState.value.isConnecting = false;
    }
  };

  // Enhanced file operations
  const uploadFile = async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) {
      formData.append("folder", folder);
    }

    return await directus.request(uploadFiles(formData));
  };

  const getFileUrl = (fileId: string, transform?: any) => {
    let url = `${config.public.newsletter.directusUrl}/assets/${fileId}`;

    if (transform) {
      const params = new URLSearchParams();
      Object.entries(transform).forEach(([key, value]) => {
        params.set(key, String(value));
      });
      url += `?${params.toString()}`;
    }

    return url;
  };

  const deleteFile = async (fileId: string) => {
    return await directus.request(deleteItems("directus_files", [fileId]));
  };

  // Batch operations
  const batchCreate = async (collection: string, items: any[]) => {
    return await directus.request(createItems(collection, items));
  };

  const batchUpdate = async (
    collection: string,
    updates: { id: any; data: any }[]
  ) => {
    const promises = updates.map(({ id, data }) =>
      directus.request(updateItem(collection, id, data))
    );
    return await Promise.all(promises);
  };

  const batchDelete = async (collection: string, ids: any[]) => {
    return await directus.request(deleteItems(collection, ids));
  };

  // Search functionality
  const search = async (
    collection: string,
    query: string,
    fields: string[] = []
  ) => {
    const searchFilter = {
      _or: fields.map((field) => ({
        [field]: { _icontains: query },
      })),
    };

    return await directus.request(
      readItems(collection, {
        filter: searchFilter,
        limit: 50,
      })
    );
  };

  // Aggregation helpers
  const count = async (collection: string, filter?: any) => {
    const result = await directus.request(
      aggregate(collection, {
        aggregate: { count: "*" },
        filter,
      })
    );
    return result[0]?.count || 0;
  };

  const sum = async (collection: string, field: string, filter?: any) => {
    const result = await directus.request(
      aggregate(collection, {
        aggregate: { sum: [field] },
        filter,
      })
    );
    return result[0]?.sum || 0;
  };

  const average = async (collection: string, field: string, filter?: any) => {
    const result = await directus.request(
      aggregate(collection, {
        aggregate: { avg: [field] },
        filter,
      })
    );
    return result[0]?.avg || 0;
  };

  // Cache management
  const cache = new Map<string, { data: any; expires: number }>();
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const getCached = (key: string) => {
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  };

  const setCached = (key: string, data: any, duration = CACHE_DURATION) => {
    cache.set(key, {
      data,
      expires: Date.now() + duration,
    });
  };

  const clearCache = (pattern?: string) => {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  };

  // Cached read operations
  const readItemsCached = async (
    collection: string,
    options?: any,
    cacheKey?: string
  ) => {
    const key = cacheKey || `${collection}-${JSON.stringify(options)}`;
    const cached = getCached(key);

    if (cached) {
      return cached;
    }

    const data = await directus.request(readItems(collection, options));
    setCached(key, data);
    return data;
  };

  const readItemCached = async (
    collection: string,
    id: any,
    options?: any,
    cacheKey?: string
  ) => {
    const key = cacheKey || `${collection}-${id}-${JSON.stringify(options)}`;
    const cached = getCached(key);

    if (cached) {
      return cached;
    }

    const data = await directus.request(readItem(collection, id, options));
    setCached(key, data);
    return data;
  };

  // Real-time subscriptions (WebSocket)
  const subscriptions = new Map<string, any>();

  const subscribe = (
    collection: string,
    callback: (data: any) => void,
    filter?: any
  ) => {
    // Note: This would require WebSocket implementation in Directus
    const subscriptionKey = `${collection}-${JSON.stringify(filter)}`;

    // For now, simulate with polling
    const interval = setInterval(async () => {
      try {
        const data = await directus.request(readItems(collection, { filter }));
        callback(data);
      } catch (error) {
        console.error("Subscription error:", error);
      }
    }, 5000); // Poll every 5 seconds

    subscriptions.set(subscriptionKey, interval);
    return subscriptionKey;
  };

  const unsubscribe = (subscriptionKey: string) => {
    const interval = subscriptions.get(subscriptionKey);
    if (interval) {
      clearInterval(interval);
      subscriptions.delete(subscriptionKey);
    }
  };

  // Cleanup on unmount
  onBeforeUnmount(() => {
    subscriptions.forEach((interval) => clearInterval(interval));
    subscriptions.clear();
  });

  return {
    directus,
    connectionState: readonly(connectionState),
    testConnection,
    uploadFile,
    getFileUrl,
    deleteFile,
    batchCreate,
    batchUpdate,
    batchDelete,
    search,
    count,
    sum,
    average,
    getCached,
    setCached,
    clearCache,
    readItemsCached,
    readItemCached,
    subscribe,
    unsubscribe,
  };
};
