import { EmailService } from "./EmailService";
import { IEmailProvider } from "../interfaces/IEmailProvider";
import { ILogger } from "../interfaces/ILogger";
import { StatusTracker } from "./StatusTracker";
import { EmailQueue } from "./EmailQueue";
import { RateLimiter } from "./RateLimiter";
import { Email } from "../models/Email";
import { appConfig } from "../config/app.config";

// Mock dependencies
const mockLogger: ILogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockProviderA: IEmailProvider = {
  name: "MockA",
  send: jest.fn(),
};

const mockProviderB: IEmailProvider = {
  name: "MockB",
  send: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (mockProviderA.send as jest.Mock).mockReset();
  (mockProviderB.send as jest.Mock).mockReset();
  appConfig.retry.attempts = 3;
  appConfig.retry.initialDelayMs = 1;
});

const testEmail: Email = {
  to: "test@example.com",
  from: "sender@example.com",
  subject: "Hi",
  body: "Test",
};

describe("EmailService", () => {
  let statusTracker: StatusTracker;
  let queue: EmailQueue;
  let rateLimiter: RateLimiter;
  let service: EmailService;
  const processAndCompleteQueue = async (q: EmailQueue, s: EmailService) => {
    const privateProcessMethod = (s as any).processQueue.bind(s);
    await privateProcessMethod();
  };

  beforeEach(() => {
    statusTracker = new StatusTracker(mockLogger);
    queue = new EmailQueue();
    rateLimiter = new RateLimiter(100, 1000, mockLogger);
    service = new EmailService(
      [mockProviderA, mockProviderB],
      mockLogger,
      statusTracker,
      queue,
      rateLimiter
    );
  });

  it("should send an email successfully with the primary provider on the first attempt", async () => {
    (mockProviderA.send as jest.Mock).mockResolvedValue(undefined);

    await service.send(testEmail, "id-1");
    await processAndCompleteQueue(queue, service);

    expect(mockProviderA.send).toHaveBeenCalledTimes(1);
    expect(mockProviderB.send).not.toHaveBeenCalled();
    const status = statusTracker.get("id-1");
    expect(status?.state).toBe("SENT");
    expect(status?.finalProvider).toBe("MockA");
  });

  it("should retry with the primary provider on failure and then succeed", async () => {
    (mockProviderA.send as jest.Mock)
      .mockRejectedValueOnce(new Error("Transient error"))
      .mockResolvedValueOnce(undefined);

    await service.send(testEmail, "id-2");
    await processAndCompleteQueue(queue, service);

    expect(mockProviderA.send).toHaveBeenCalledTimes(2);
    expect(mockProviderB.send).not.toHaveBeenCalled();
    const status = statusTracker.get("id-2");
    expect(status?.state).toBe("SENT");
    expect(status?.attempts).toBe(1);
  });

  it("should fall back to the secondary provider if the primary provider fails all attempts", async () => {
    (mockProviderA.send as jest.Mock).mockRejectedValue(
      new Error("Permanent error")
    );
    (mockProviderB.send as jest.Mock).mockResolvedValue(undefined);

    await service.send(testEmail, "id-3");
    await processAndCompleteQueue(queue, service);

    expect(mockProviderA.send).toHaveBeenCalledTimes(appConfig.retry.attempts);
    expect(mockProviderB.send).toHaveBeenCalledTimes(1);
    const status = statusTracker.get("id-3");
    expect(status?.state).toBe("SENT");
    expect(status?.finalProvider).toBe("MockB");
  });

  it("should mark the email as FAILED if all providers fail", async () => {
    (mockProviderA.send as jest.Mock).mockRejectedValue(new Error("A fails"));
    (mockProviderB.send as jest.Mock).mockRejectedValue(new Error("B fails"));

    await service.send(testEmail, "id-4");
    await processAndCompleteQueue(queue, service);

    expect(mockProviderA.send).toHaveBeenCalledTimes(appConfig.retry.attempts);
    expect(mockProviderB.send).toHaveBeenCalledTimes(appConfig.retry.attempts);
    const status = statusTracker.get("id-4");
    expect(status?.state).toBe("FAILED");
  });

  it("should not process a duplicate email request (idempotency)", async () => {
    (mockProviderA.send as jest.Mock).mockResolvedValue(undefined);

    const result1 = await service.send(testEmail, "id-5");
    await processAndCompleteQueue(queue, service);

    const result2 = await service.send(testEmail, "id-5");

    expect(result1.status).toBe("QUEUED");
    expect(result2.status).toBe("DUPLICATE");
    expect(mockProviderA.send).toHaveBeenCalledTimes(1);
  });
});
