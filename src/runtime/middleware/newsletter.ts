<script lang="ts">
export default defineNuxtRouteMiddleware((to) => {
  // Validate newsletter ID parameter
  if (to.params.id && !/^\d+$/.test(to.params.id as string)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Newsletter not found",
    });
  }
});
</script>