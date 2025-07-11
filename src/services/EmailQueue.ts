import { Email } from "../models/Email";

export interface QueuedEmail {
  id: string;
  email: Email;
}

export class EmailQueue {
  private queue: QueuedEmail[] = [];
  private isProcessing = false;

  public enqueue(item: QueuedEmail) {
    this.queue.push(item);
  }

  public dequeue(): QueuedEmail | undefined {
    return this.queue.shift();
  }

  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  public startProcessing() {
    this.isProcessing = true;
  }

  public stopProcessing() {
    this.isProcessing = false;
  }

  public isRunning(): boolean {
    return this.isProcessing;
  }
}
