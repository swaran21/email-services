import express from "express";
import { appConfig } from "./config/app.config";
import { createEmailRoutes } from "./api/email.routes";
import { Logger } from "./services/Logger";
import { MockProviderA } from "./providers/MockProviderA";
import { MockProviderB } from "./providers/MockProviderB";
import { StatusTracker } from "./services/StatusTracker";
import { EmailQueue } from "./services/EmailQueue";
import { RateLimiter } from "./services/RateLimiter";
import { EmailService } from "./services/EmailService";

const app = express();
app.use(express.json());

// --- Dependency Injection Setup ---
// 1. Core Services (no dependencies)
const logger = new Logger();
const statusTracker = new StatusTracker(logger);
const queue = new EmailQueue();

// 2. Email Providers (can be configured with different failure rates for testing)
// Provider A is our primary (higher failure rate), B is our fallback (more reliable)
const providerA = new MockProviderA(0.8); // 80% failure to easily test fallback
const providerB = new MockProviderB(0.1); // 10% failure

// 3. Helper Services (depend on core services)
const rateLimiter = new RateLimiter(
  appConfig.rateLimiter.tokens,
  appConfig.rateLimiter.intervalMs,
  logger
);

// 4. Main Application Service (injects all dependencies)
const emailService = new EmailService(
  [providerA, providerB], // Primary provider first, then fallback
  logger,
  statusTracker,
  queue,
  rateLimiter
);

// --- API Routes Setup ---
const emailRoutes = createEmailRoutes(emailService, statusTracker);
app.use("/api/email", emailRoutes);

app.get("/", (req, res) => {
  res.send("Resilient Email Service is running!");
});

// --- Start Server ---
app.listen(appConfig.port, () => {
  logger.info(`Server is running on http://localhost:${appConfig.port}`);
});
