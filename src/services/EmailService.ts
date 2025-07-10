import { appConfig } from "../config/app.config";
import { IEmailProvider } from "../interfaces/IEmailProvider";
import { ILogger } from "../interfaces/ILogger";
import { Email } from "../models/Email";
import { CircuitBreaker } from "./CircuitBreaker";
import { EmailQueue, QueuedEmail } from "./EmailQueue";
import { RateLimiter } from "./RateLimiter";
import { StatusTracker } from "./StatusTracker";

export class EmailService {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(
    private providers: IEmailProvider[],
    private logger: ILogger,
    private statusTracker: StatusTracker,
    private queue: EmailQueue,
    private rateLimiter: RateLimiter
  ) {
    if (!providers || providers.length === 0) {
      throw new Error("EmailService requires at least one provider.");
    }
    this.providers.forEach((p) => {
      this.circuitBreakers.set(
        p.name,
        new CircuitBreaker(
          p.name,
          appConfig.circuitBreaker.failureThreshold,
          appConfig.circuitBreaker.recoveryTimeoutMs,
          this.logger
        )
      );
    });
  }
  public async send(
    email: Email,
    id: string
  ): Promise<{ id: string; status: "QUEUED" | "DUPLICATE" }> {
    if (this.statusTracker.isKnownId(id)) {
      this.logger.warn(
        `[Idempotency] Duplicate email request received for ID: ${id}.`
      );
      return { id, status: "DUPLICATE" };
    }

    this.statusTracker.initialize(id);
    this.queue.enqueue({ id, email });
    this.logger.info(`Email ${id} has been queued for sending.`);

    if (!this.queue.isRunning()) {
      this.processQueue();
    }

    return { id, status: "QUEUED" };
  }

  private async processQueue(): Promise<void> {
    this.queue.startProcessing();
    this.logger.info("Email queue processing started.");

    while (!this.queue.isEmpty()) {
      const item = this.queue.dequeue();
      if (item) {
        await this.sendWithRetriesAndFallback(item);
      }
    }

    this.queue.stopProcessing();
    this.logger.info("Email queue processing finished.");
  }
  private async sendWithRetriesAndFallback({
    id,
    email,
  }: QueuedEmail): Promise<void> {
    this.statusTracker.update(id, "PROCESSING", "Started processing email.");

    for (const provider of this.providers) {
      const circuitBreaker = this.circuitBreakers.get(provider.name)!;
      for (let attempt = 1; attempt <= appConfig.retry.attempts; attempt++) {
        try {
          await this.rateLimiter.wait();
          this.logger.info(
            `[Attempt ${attempt}/${appConfig.retry.attempts}] [Provider: ${provider.name}] Sending email ${id}...`
          );

          await circuitBreaker.execute(() => provider.send(email));

          this.statusTracker.update(
            id,
            "SENT",
            `Successfully sent with ${provider.name}.`,
            provider.name
          );
          this.logger.info(
            `Email ${id} sent successfully with ${provider.name}.`
          );
          return;
        } catch (error: any) {
          this.logger.error(
            `[Attempt ${attempt}] Failed to send email ${id} with ${provider.name}.`,
            error.message
          );
          this.statusTracker.update(
            id,
            "PROCESSING",
            `Attempt ${attempt} with ${provider.name} failed: ${error.message}`
          );

          if (attempt < appConfig.retry.attempts) {
            const delay =
              appConfig.retry.initialDelayMs * Math.pow(2, attempt - 1);
            this.logger.info(`Waiting ${delay}ms before next retry...`);
            await new Promise((res) => setTimeout(res, delay));
          }
        }
      }
      this.logger.warn(
        `All attempts with provider ${provider.name} failed for email ${id}. Falling back...`
      );
    }

    this.statusTracker.update(
      id,
      "FAILED",
      "All providers failed to send the email."
    );
    this.logger.error(
      `Email ${id} failed to send after all retries and fallbacks.`
    );
  }
}
