export interface Email {
  to: string;
  from: string;
  subject: string;
  body: string;
}

export type EmailStatusState = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

export interface EmailStatus {
  id: string;
  state: EmailStatusState;
  attempts: number;
  lastAttemptedAt?: Date;
  finalProvider?: string;
  history: {
    timestamp: Date;
    message: string;
  }[];
}
