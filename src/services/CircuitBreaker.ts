import { ILogger } from "../interfaces/ILogger";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime: number | null = null;

  constructor(
    private serviceName: string,
    private failureThreshold: number,
    private recoveryTimeoutMs: number,
    private logger: ILogger
  ) {}

  private trip() {
    this.state = "OPEN";
    this.lastFailureTime = Date.now();
    this.logger.warn(
      `[CircuitBreaker] Circuit for ${this.serviceName} has been tripped to OPEN.`
    );
  }

  private reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.logger.info(
      `[CircuitBreaker] Circuit for ${this.serviceName} has been reset to CLOSED.`
    );
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.recoveryTimeoutMs
      ) {
        this.state = "HALF_OPEN";
        this.logger.info(
          `[CircuitBreaker] Circuit for ${this.serviceName} is now HALF_OPEN.`
        );
      } else {
        throw new Error(
          `[CircuitBreaker] Circuit is OPEN for ${this.serviceName}. Call rejected.`
        );
      }
    }

    try {
      const response = await action();
      if (this.state === "HALF_OPEN" || this.failureCount > 0) {
        this.reset();
      }
      return response;
    } catch (err) {
      this.failureCount++;
      if (
        this.state === "HALF_OPEN" ||
        this.failureCount >= this.failureThreshold
      ) {
        this.trip();
      }
      throw err;
    }
  }
}
