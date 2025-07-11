import { EmailStatus, EmailStatusState } from "../models/Email";
import { ILogger } from "../interfaces/ILogger";

export class StatusTracker {
  private statuses = new Map<string, EmailStatus>();

  constructor(private logger: ILogger) {}

  public initialize(id: string): EmailStatus {
    if (this.statuses.has(id)) {
      this.logger.warn(
        `Attempted to re-initialize status for existing ID: ${id}`
      );
      return this.statuses.get(id)!;
    }
    const newStatus: EmailStatus = {
      id,
      state: "PENDING",
      attempts: 0,
      history: [
        {
          timestamp: new Date(),
          message: "Email received and queued for processing.",
        },
      ],
    };
    this.statuses.set(id, newStatus);
    return newStatus;
  }

  public update(
    id: string,
    state: EmailStatusState,
    message: string,
    finalProvider?: string
  ): void {
    const status = this.statuses.get(id);
    if (!status) {
      this.logger.error(
        `Attempted to update status for non-existent ID: ${id}`
      );
      return;
    }
    status.state = state;
    status.lastAttemptedAt = new Date();
    status.history.push({ timestamp: new Date(), message });
    if (state === "SENT" && finalProvider) {
      status.finalProvider = finalProvider;
    }
    if (state !== "PENDING" && state !== "SENT") {
      status.attempts++;
    }
  }

  public get(id: string): EmailStatus | undefined {
    return this.statuses.get(id);
  }


  public isKnownId(id: string): boolean {
    return this.statuses.has(id);
  }
}
