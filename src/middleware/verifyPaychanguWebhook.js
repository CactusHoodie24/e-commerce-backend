// middleware/verifyPaychanguWebhook.js
import crypto from "crypto";

export default function verifyPaychanguWebhook(req, res, next) {
  try {
    const signature = req.headers["signature"];
    const secret = process.env.PAYCHANGU_WEBHOOK_SECRET;

    if (!signature) {
      return res.status(400).send("Missing signature");
    }

    // raw body string
    const rawBody = req.rawBody;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).send("Invalid signature");
    }

    next();
  } catch (error) {
    console.error("Webhook verification error:", error);
    return res.status(500).send("Internal error");
  }
}
