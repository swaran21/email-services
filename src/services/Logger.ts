import { ILogger } from "../interfaces/ILogger";

export class Logger implements ILogger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  public info(message: string): void {
    console.log(`[${this.getTimestamp()}] [INFO] ${message}`);
  }

  public warn(message: string): void {
    console.warn(`[${this.getTimestamp()}] [WARN] ${message}`);
  }

  public error(message: string, error?: any): void {
    console.error(`[${this.getTimestamp()}] [ERROR] ${message}`, error || "");
  }
}
