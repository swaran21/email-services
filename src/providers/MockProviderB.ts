import { IEmailProvider } from "../interfaces/IEmailProvider";
import { Email } from "../models/Email";

/**
 * A mock email provider that can be configured to fail intermittently.
 * Represents our fallback provider. It might be more reliable but more expensive.
 */
export class MockProviderB implements IEmailProvider {
  public readonly name = "MockProviderB";

  constructor(private failureRate: number = 0.1) {} // 10% chance of failure, more reliable

  async send(email: Email): Promise<void> {
    console.log(`[${this.name}] Attempting to send email to ${email.to}...`);

    // Simulate network delay (slightly slower)
    await new Promise((res) => setTimeout(res, 200 + Math.random() * 300));

    if (Math.random() < this.failureRate) {
      throw new Error(
        `[${this.name}] Failed to send email due to a simulated transient error.`
      );
    }

    console.log(`[${this.name}] Successfully sent email to ${email.to}`);
  }
}
