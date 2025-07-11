Resilient Email Service:

Hello! This project is a robust, fault-tolerant email sending service built with TypeScript and Node.js.

Think of it as a smart postal worker for your application's emails. If the primary mail truck breaks down (i.e., your main email provider has an outage), this service doesn't just give up. It automatically waits, tries again, and if needed, hands the letter to a different, more reliable courier to ensure your message gets delivered.

This service was built to demonstrate a deep understanding of modern backend engineering principles, focusing on reliability, testability, and clean architecture.

Key Features & The Story They Tell

This service isn't just about sending an email; it's about guaranteeing the attempt to send it is as reliable as possible.
Retry with Exponential Backoff: If sending fails, we don't spam the provider. We politely wait, doubling our waiting time with each attempt, before trying again. This respects the provider's limits and increases the chance of success during temporary outages.

Provider Fallback: If our primary provider is having a really bad day and fails all its retries, the service seamlessly switches to a backup provider. The user of the service never has to worry; we just find another way.

Circuit Breaker Pattern: If a provider is clearly offline, the service is smart enough to stop trying for a while. It "trips a circuit," preventing useless requests that would slow down the system. After a cooldown period, it carefully tries again to see if the provider has recovered.

Idempotency: Ever accidentally clicked "submit" twice? This service is protected against that. If it receives the same request multiple times, it recognizes it as a duplicate and won't send the same email again, preventing embarrassing double-sends.

Rate Limiting: To avoid getting blacklisted by email providers, we control our sending speed. This ensures we stay within the "rules of the road" set by our providers.

Complete Status Tracking: Every email's journey is tracked from start to finish. You can ask the API at any time: "What's the status of that email I sent?" and get a detailed history of every attempt, failure, and success.

Asynchronous by Design: When you ask the service to send an email, it immediately says "Got it!" and puts it in a queue. This makes your application feel incredibly fast and responsive, while the heavy lifting happens reliably in the background.

Architecture Philosophy:

This project is built on a foundation of SOLID principles and Dependency Injection. In simple terms, this means:

Each piece has one job and does it well. The RateLimiter only worries about speed, and the StatusTracker only worries about history.


This design makes the system incredibly easy to test, maintain, and expand in the future.

How to Get Started
Prerequisites

Node.js (v18 or newer)

npm (comes with Node.js)

1. Installation

First, clone this repository and navigate into the directory. Then, install all the necessary dependencies.

git clone https://github.com/swaran21/email-services.git
cd resilient-email-service
npm install

2. Running the Service

For development, you can run the service with live-reloading, which is perfect for making changes.

npm run dev

The API will be running at http://localhost:3000.

3. Running Tests

To make sure everything is working as expected, you can run the comprehensive unit test suite:

This service is already deployed and live for you to test!

Live URL: https://email-services-indol.vercel.app

You can use a tool like Postman to interact with the endpoints.

1. Send an Email

Send a POST request to /api/email/send. This will queue your email for delivery.

Endpoint: POST /api/email/send

Body:

Generated json
{
  "to": "recipient@example.com",
  "from": "test@example.com",
  "subject": "Greetings from a Resilient Service!",
  "body": "This email demonstrates reliability and smart design."
}

Response: You'll get an immediate 202 Accepted status with the email's unique ID.

Generated json
{
  "message": "Email has been accepted for processing.",
  "emailId": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
}
2. Check the Email's Status

Use the emailId from the previous step to get a full report on the delivery attempt.

Endpoint: GET /api/email/status/:id

Example: GET /api/email/status/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

Response: A detailed JSON object showing the final status, which provider succeeded, and a complete history of the delivery journey.

Thank you for taking the time to review my work! I believe this project showcases a strong grasp of the engineering principles required for building modern, reliable backend systems.