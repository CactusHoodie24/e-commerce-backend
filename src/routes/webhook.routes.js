// routes/webhook.routes.js
import express from "express";
import Payment from "../models/payment.model.js";
import crypto from "crypto";

const router = express.Router();

/** PayChangu may send charge_id at top level, camelCase, or under data. */
function extractChargeId(data) {
  if (!data || typeof data !== "object") return null;
  const top = data.charge_id ?? data.chargeId;
  if (top != null && String(top).trim() !== "") return String(top).trim();
  const nested =
    data.data?.charge_id ??
    data.data?.chargeId ??
    data.payload?.charge_id ??
    data.payload?.chargeId;
  if (nested != null && String(nested).trim() !== "") return String(nested).trim();
  return null;
}

function extractStatus(data) {
  if (!data || typeof data !== "object") return null;
  return (
    data.status ??
    data.data?.status ??
    data.payload?.status ??
    null
  );
}

router.post("/paychangu", async (req, res) => {
 try {
  console.log("Headers:", req.headers);
console.log("Raw body string:", req.rawBody.toString());
    const signature = req.headers["signature"];
    const secret = process.env.PAYCHANGU_WEBHOOK_SECRET;

    // `req.rawBody` was set in `app.js` right after `express.raw()`
    const rawBody = req.rawBody.toString();
    const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    console.log("Computed signature:", computed);

    if (computed !== signature) {
      console.log("❌ Invalid webhook signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const data = JSON.parse(rawBody);
    const chargeIdRaw = extractChargeId(data);
    // Match initiate flow: PaymentService stores chargeId as uppercase 12-char hex
    const chargeId = chargeIdRaw ? chargeIdRaw.toUpperCase() : null;
    const status = extractStatus(data);

    if (!chargeId) {
      console.warn("⚠️ Webhook missing charge_id (checked charge_id, chargeId, data.*):", Object.keys(data));
      return res.status(400).json({ message: "Invalid webhook payload: missing charge id" });
    }

    const update = { rawResponse: data };
    if (status != null && status !== "") update.status = status;

    // Try exact match first, then case-insensitive (legacy / provider casing)
    let payment = await Payment.findOneAndUpdate(
      { chargeId },
      update,
      { new: true }
    );
    if (!payment) {
      payment = await Payment.findOneAndUpdate(
        { chargeId: new RegExp(`^${chargeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        update,
        { new: true }
      );
    }

    if (!payment) {
      console.warn("⚠️ No payment for webhook charge_id:", chargeId, "(normalized from payload)");
    } else {
      console.log("✅ Payment updated via webhook:", payment._id?.toString(), payment.status);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ message: "Webhook error" });
  }});

export default router;
