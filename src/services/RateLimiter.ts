import { ILogger } from "../interfaces/ILogger";

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private intervalMs: number,
    private logger: ILogger
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    if (now - this.lastRefill >= this.intervalMs) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
    }
  }

  public async wait(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    // Not enough tokens, wait until the next interval
    const timeToWait = this.lastRefill + this.intervalMs - Date.now();
    this.logger.warn(`Rate limit exceeded. Waiting for ${timeToWait}ms...`);
    await new Promise((res) => setTimeout(res, timeToWait));

    // After waiting, we can proceed
    this.refill();
    this.tokens--;
  }
}
