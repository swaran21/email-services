# Resilient Email Service

This project is a TypeScript implementation of a highly resilient email sending service. It is designed to handle provider failures gracefully through a combination of retries, fallbacks, circuit breakers, and other patterns. This service exposes a simple REST API to send emails and check their status.

## Core Features

- **Retry with Exponential Backoff**: Automatically retries sending an email if a provider fails, with increasing delays between attempts to avoid overwhelming the provider.
- **Provider Fallback**: If the primary email provider fails all retry attempts, the service automatically switches to a secondary (fallback) provider.
- **Idempotency**: Prevents duplicate emails from being sent if the client sends the same request multiple times. A unique ID is returned to the client, which can be used to track the email's status.
- **Rate Limiting**: Controls the rate of outgoing requests to avoid hitting API limits of the email providers.
- **Status Tracking**: Every email request is tracked from the moment it's received until it's either sent successfully or has failed completely.
- **Circuit Breaker Pattern**: (Bonus) Prevents the service from repeatedly trying to use a provider that is known to be failing, giving it time to recover.
- **Asynchronous Queue System**: (Bonus) API requests return immediately (`202 Accepted`), and emails are placed in a queue for background processing, making the API highly responsive.
- **Simple Logging**: (Bonus) Provides clear, structured logs for monitoring service activity.

## Architecture

The service is built on **SOLID principles** and **Dependency Injection**.

- **Interfaces (`IEmailProvider`, `ILogger`)**: Define contracts for core components, allowing for easy extension (e.g., adding a real SendGrid provider) without modifying the core service logic (Open/Closed Principle).
- **Dependency Injection**: Services like the logger, providers, and rate limiter are "injected" into the `EmailService`. This decouples the components and makes the system extremely easy to unit test.
- **Single Responsibility**: Each class has a single, well-defined purpose (e.g., `RateLimiter` only handles rate limiting, `StatusTracker` only tracks status).

## Project Structure
