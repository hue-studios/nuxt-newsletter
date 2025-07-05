// src/runtime/composables/useDirectus.ts
export const useDirectus = () => {
  const config = useRuntimeConfig();

  const directus = createDirectus(config.public.newsletter.directusUrl).with(
    rest()
  );

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await directus.request(uploadFiles(formData));
  };

  const getFileUrl = (fileId: string) => {
    return `${config.public.newsletter.directusUrl}/assets/${fileId}`;
  };

  return {
    directus,
    uploadFile,
    getFileUrl,
  };
};
