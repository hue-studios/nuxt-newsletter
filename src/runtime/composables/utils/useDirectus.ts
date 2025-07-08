// src/runtime/composables/utils/useDirectus.ts
import { useRuntimeConfig, useNuxtApp } from "#imports";
import { ref } from "vue";
import { createDirectus, rest } from "@directus/sdk";

export const useDirectus = () => {
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const config = useRuntimeConfig();
  const directus = createDirectus(config.public.newsletter.directusUrl).with(
    rest()
  );

  const testConnection = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.testConnection();

      if (result.success) {
        isConnected.value = true;
        return result;
      } else {
        isConnected.value = false;
        throw new Error(result.error?.message || "Connection failed");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to connect to Directus";
      isConnected.value = false;
      console.error("Directus connection failed:", err);
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  };

  const query = async (collection: string, options: any = {}) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.getItems(collection, options);

      if (result.success) {
        return result.items;
      } else {
        throw new Error(result.error?.message || "Query failed");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to query Directus";
      console.error("Directus query failed:", err);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const create = async (collection: string, data: any) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.createItem(collection, data);

      if (result.success) {
        return result.item;
      } else {
        throw new Error(result.error?.message || "Create failed");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to create item";
      console.error("Directus create failed:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const update = async (collection: string, id: string | number, data: any) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.updateItem(collection, id, data);

      if (result.success) {
        return result.item;
      } else {
        throw new Error(result.error?.message || "Update failed");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to update item";
      console.error("Directus update failed:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const remove = async (collection: string, id: string | number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.deleteItem(collection, id);

      if (!result.success) {
        throw new Error(result.error?.message || "Delete failed");
      }
    } catch (err: any) {
      error.value = err.message || "Failed to delete item";
      console.error("Directus delete failed:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const authenticate = async (email: string, password: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.login(email, password);

      if (result.success) {
        isConnected.value = true;
        return result;
      } else {
        throw new Error(result.error?.message || "Authentication failed");
      }
    } catch (err: any) {
      error.value = err.message || "Authentication failed";
      console.error("Directus authentication failed:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      const { $directusHelpers } = useNuxtApp();
      await $directusHelpers.logout();
      isConnected.value = false;
    } catch (err: any) {
      console.error("Directus logout failed:", err);
    }
  };

  const getCurrentUser = async () => {
    try {
      const { $directusHelpers } = useNuxtApp();
      const result = await $directusHelpers.getCurrentUser();

      if (result.success) {
        return result.user;
      } else {
        return null;
      }
    } catch (err: any) {
      console.error("Failed to get current user:", err);
      return null;
    }
  };

  return {
    directus,
    isConnected,
    isLoading,
    error,
    testConnection,
    query,
    create,
    update,
    remove,
    authenticate,
    logout,
    getCurrentUser,
  };
};
