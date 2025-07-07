import { createDirectus, rest, uploadFiles } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const form = await readMultipartFormData(event);

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file uploaded",
      });
    }

    const file = form[0];

    if (!file.data || !file.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file data",
      });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type || "")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Only image files are allowed",
      });
    }

    // Initialize Directus client
    const directus = createDirectus(config.public.directusUrl as string).with(
      rest(),
    );

    // Upload file to Directus
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([file.data], { type: file.type }),
      file.filename,
    );

    const uploadedFile = await directus.request(uploadFiles(formData));

    return {
      success: true,
      file: {
        id: uploadedFile.id,
        filename: uploadedFile.filename_download,
        url: `${config.public.directusUrl}/assets/${uploadedFile.id}`,
        type: uploadedFile.type,
        size: uploadedFile.filesize,
      },
    };
  } catch (error: any) {
    console.error("File upload error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "File upload failed",
    });
  }
});
