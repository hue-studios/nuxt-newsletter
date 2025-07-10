export interface Newsletter {
  id: string | number;
  title: string;
  subject_line: string;
  content: string;
  status: "draft" | "scheduled" | "published";
  created_at: string;
  updated_at: string;
  scheduled_at?: string;
  sent_at?: string;
  recipients_count?: number;
}

export interface CreateNewsletterPayload {
  title: string;
  subject_line: string;
  content: string;
  status?: "draft" | "scheduled" | "published";
  scheduled_at?: string;
}

export interface UpdateNewsletterPayload
  extends Partial<CreateNewsletterPayload> {
  id?: never; // Prevent ID from being updated
}
