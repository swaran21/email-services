import { IEmailProvider } from "../interfaces/IEmailProvider";
import { Email } from "../models/Email";

export class MockProviderB implements IEmailProvider {
  public readonly name = "MockProviderB";

  constructor(private failureRate: number = 0.1) {}

  async send(email: Email): Promise<void> {
    console.log(`[${this.name}] Attempting to send email to ${email.to}...`);

    await new Promise((res) => setTimeout(res, 200 + Math.random() * 300));

    if (Math.random() < this.failureRate) {
      throw new Error(
        `[${this.name}] Failed to send email due to a simulated transient error.`
      );
    }

    console.log(`[${this.name}] Successfully sent email to ${email.to}`);
  }
}
