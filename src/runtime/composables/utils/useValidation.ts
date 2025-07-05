export const useValidation = () => {
  const errors = ref<Record<string, string[]>>({});
  const isValidating = ref(false);

  // Newsletter validation
  const validateNewsletter = (newsletter: any): boolean => {
    clearErrors();
    isValidating.value = true;

    try {
      // Required fields
      if (!newsletter.title?.trim()) {
        addError("title", "Title is required");
      }

      if (!newsletter.subject_line?.trim()) {
        addError("subject_line", "Subject line is required");
      } else {
        // Subject line best practices
        if (newsletter.subject_line.length > 50) {
          addError(
            "subject_line",
            "Subject line should be 50 characters or less for optimal display"
          );
        }

        if (newsletter.subject_line.includes("!".repeat(3))) {
          addError("subject_line", "Avoid excessive exclamation marks");
        }

        // Check for spam trigger words
        const spamWords = [
          "free",
          "urgent",
          "limited time",
          "act now",
          "click here",
          "guaranteed",
        ];
        const hasSpamWords = spamWords.some((word) =>
          newsletter.subject_line.toLowerCase().includes(word)
        );
        if (hasSpamWords) {
          addError(
            "subject_line",
            "Subject line contains words that may trigger spam filters"
          );
        }
      }

      if (!newsletter.from_email?.trim()) {
        addError("from_email", "From email is required");
      } else if (!isValidEmail(newsletter.from_email)) {
        addError("from_email", "Please enter a valid email address");
      }

      if (!newsletter.from_name?.trim()) {
        addError("from_name", "From name is required");
      }

      // Preview text validation
      if (newsletter.preview_text && newsletter.preview_text.length > 90) {
        addError(
          "preview_text",
          "Preview text should be 90 characters or less"
        );
      }

      // Content validation
      if (!newsletter.blocks || newsletter.blocks.length === 0) {
        addError("blocks", "Newsletter must have at least one content block");
      } else {
        validateBlocks(newsletter.blocks);
      }

      // Sending requirements
      if (newsletter.status === "ready") {
        if (!newsletter.mailing_list_id) {
          addError(
            "mailing_list_id",
            "Please select a mailing list before sending"
          );
        }

        if (!newsletter.compiled_html) {
          addError(
            "compiled_html",
            "Newsletter must be compiled before sending"
          );
        }
      }

      return Object.keys(errors.value).length === 0;
    } finally {
      isValidating.value = false;
    }
  };

  // Block validation
  const validateBlocks = (blocks: any[]) => {
    blocks.forEach((block, index) => {
      const fieldPrefix = `blocks.${index}`;

      switch (block.block_type.slug) {
        case "hero":
          if (!block.title?.trim()) {
            addError(`${fieldPrefix}.title`, "Hero block should have a title");
          }
          break;

        case "text":
          if (!block.text_content?.trim()) {
            addError(
              `${fieldPrefix}.text_content`,
              "Text block cannot be empty"
            );
          }
          break;

        case "image":
          if (!block.image_url?.trim()) {
            addError(`${fieldPrefix}.image_url`, "Image block needs an image");
          }
          if (!block.image_alt_text?.trim()) {
            addError(
              `${fieldPrefix}.image_alt_text`,
              "Image needs alt text for accessibility"
            );
          }
          break;

        case "button":
          if (!block.button_text?.trim()) {
            addError(`${fieldPrefix}.button_text`, "Button needs text");
          }
          if (!block.button_url?.trim()) {
            addError(`${fieldPrefix}.button_url`, "Button needs a URL");
          } else if (!isValidUrl(block.button_url)) {
            addError(`${fieldPrefix}.button_url`, "Please enter a valid URL");
          }
          break;
      }

      // Color contrast validation
      if (block.background_color && block.text_color) {
        const contrast = calculateColorContrast(
          block.background_color,
          block.text_color
        );
        if (contrast < 4.5) {
          addError(
            `${fieldPrefix}.colors`,
            "Text may be hard to read due to low color contrast"
          );
        }
      }
    });
  };

  // Subscriber validation
  const validateSubscriber = (subscriber: any): boolean => {
    clearErrors();
    isValidating.value = true;

    try {
      if (!subscriber.email?.trim()) {
        addError("email", "Email is required");
      } else if (!isValidEmail(subscriber.email)) {
        addError("email", "Please enter a valid email address");
      }

      if (!subscriber.name?.trim()) {
        addError("name", "Name is required");
      }

      return Object.keys(errors.value).length === 0;
    } finally {
      isValidating.value = false;
    }
  };

  // Mailing list validation
  const validateMailingList = (mailingList: any): boolean => {
    clearErrors();
    isValidating.value = true;

    try {
      if (!mailingList.name?.trim()) {
        addError("name", "Mailing list name is required");
      }

      if (mailingList.name && mailingList.name.length > 100) {
        addError("name", "Name should be 100 characters or less");
      }

      return Object.keys(errors.value).length === 0;
    } finally {
      isValidating.value = false;
    }
  };

  // Utility functions
  const addError = (field: string, message: string) => {
    if (!errors.value[field]) {
      errors.value[field] = [];
    }
    if (!errors.value[field].includes(message)) {
      errors.value[field].push(message);
    }
  };

  const clearErrors = (field?: string) => {
    if (field) {
      delete errors.value[field];
    } else {
      errors.value = {};
    }
  };

  const hasErrors = (field?: string): boolean => {
    if (field) {
      return !!(errors.value[field] && errors.value[field].length > 0);
    }
    return Object.keys(errors.value).length > 0;
  };

  const getErrors = (field?: string): string[] => {
    if (field) {
      return errors.value[field] || [];
    }
    return Object.values(errors.value).flat();
  };

  const getFirstError = (field: string): string | null => {
    const fieldErrors = errors.value[field];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // URL validation
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Color contrast calculation
  const calculateColorContrast = (bg: string, text: string): number => {
    const getLuminance = (color: string) => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    };

    try {
      const bgLuminance = getLuminance(bg);
      const textLuminance = getLuminance(text);

      const lighter = Math.max(bgLuminance, textLuminance);
      const darker = Math.min(bgLuminance, textLuminance);

      return (lighter + 0.05) / (darker + 0.05);
    } catch {
      return 7; // Assume good contrast if calculation fails
    }
  };

  return {
    errors: readonly(errors),
    isValidating: readonly(isValidating),
    validateNewsletter,
    validateSubscriber,
    validateMailingList,
    addError,
    clearErrors,
    hasErrors,
    getErrors,
    getFirstError,
    isValidEmail,
    isValidUrl,
  };
};
