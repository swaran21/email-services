export const appConfig = {
  retry: {
    attempts: 3,
    initialDelayMs: 200,
  },

  rateLimiter: {
    tokens: 5,
    intervalMs: 1000,
  },

  circuitBreaker: {
    failureThreshold: 3,
    recoveryTimeoutMs: 5000,
  },
  port: process.env.PORT || 3000,
};
