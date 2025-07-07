export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateNewsletter(newsletter: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!newsletter.title?.trim()) {
    errors.push("Title is required");
  }

  if (!newsletter.subject_line?.trim()) {
    errors.push("Subject line is required");
  }

  if (!newsletter.from_email?.trim()) {
    errors.push("From email is required");
  } else if (!validateEmail(newsletter.from_email)) {
    errors.push("From email is not valid");
  }

  if (!newsletter.from_name?.trim()) {
    errors.push("From name is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}
