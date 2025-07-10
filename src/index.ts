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
const logger = new Logger();
const statusTracker = new StatusTracker(logger);
const queue = new EmailQueue();

const providerA = new MockProviderA(0.8);
const providerB = new MockProviderB(0.1);

const rateLimiter = new RateLimiter(
  appConfig.rateLimiter.tokens,
  appConfig.rateLimiter.intervalMs,
  logger
);

const emailService = new EmailService(
  [providerA, providerB],
  logger,
  statusTracker,
  queue,
  rateLimiter
);

const emailRoutes = createEmailRoutes(emailService, statusTracker);
app.use("/api/email", emailRoutes);

app.get("/", (req, res) => {
  res.send("Resilient Email Service is running!");
});

app.listen(appConfig.port, () => {
  logger.info(`Server is running on http://localhost:${appConfig.port}`);
});
