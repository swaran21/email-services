import { Router, Request, Response } from "express";
import { EmailService } from "../services/EmailService";
import { StatusTracker } from "../services/StatusTracker";
import { Email } from "../models/Email";
import { randomBytes } from "crypto";

export const createEmailRoutes = (
  emailService: EmailService,
  statusTracker: StatusTracker
): Router => {
  const router = Router();

  /**
   * POST /api/email/send
   * Sends an email. The body should be a JSON object matching the Email interface.
   */
  router.post("/send", async (req: Request, res: Response) => {
    const email: Email = req.body;

    // Basic validation
    if (!email.to || !email.from || !email.subject || !email.body) {
      return res.status(400).json({ error: "Missing required email fields." });
    }

    // Generate a unique idempotency key for this request
    const idempotencyKey = randomBytes(16).toString("hex");

    try {
      const result = await emailService.send(email, idempotencyKey);
      // We return 202 Accepted because the processing is asynchronous
      res.status(202).json({
        message: "Email has been accepted for processing.",
        emailId: result.id,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to queue email for sending." });
    }
  });

  /**
   * GET /api/email/status/:id
   * Checks the status of a previously sent email using its ID.
   */
  router.get("/status/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const status = statusTracker.get(id);

    if (status) {
      res.status(200).json(status);
    } else {
      res.status(404).json({ error: "Email ID not found." });
    }
  });

  return router;
};
