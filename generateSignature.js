import crypto from "crypto";
import dotenv from "dotenv";

// Load .env so we use the exact same secret as the server
dotenv.config();

const secret = process.env.PAYCHANGU_WEBHOOK_SECRET;

if (!secret) {
  console.error("PAYCHANGU_WEBHOOK_SECRET is not set in .env");
  process.exit(1);
}

// Sample payload – adjust to match an existing payment (chargeId/status)
const payload = {
  chargeId: "TEST12345",
  status: "success",
  amount: 1000,
};

// IMPORTANT: stringify once and use this exact string in Postman body
const body = JSON.stringify(payload);

// HMAC SHA256
const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

console.log("=== Webhook test values ===");
console.log("Signature header value:", signature);
console.log("Raw JSON body to paste:", body);
