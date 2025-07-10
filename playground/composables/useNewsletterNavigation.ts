export const useNewsletterNavigation = () => {
  const navigateToList = () => {
    return navigateTo("/newsletters");
  };

  const navigateToCreate = () => {
    return navigateTo("/newsletters/create");
  };

  const navigateToEdit = (newsletterId: string | number) => {
    return navigateTo(`/newsletters/${newsletterId}/edit`);
  };

  const navigateToPreview = (newsletterId: string | number) => {
    return navigateTo(`/newsletters/${newsletterId}/preview`);
  };

  return {
    navigateToList,
    navigateToCreate,
    navigateToEdit,
    navigateToPreview,
  };
};
