// routes/webhook.routes.js
import express from "express";
import Payment from "../models/payment.model.js";
import crypto from "crypto";

const router = express.Router();

function extractChargeId(data) {
  if (!data || typeof data !== "object") return null;
  const top = data.charge_id ?? data.chargeId;
  if (top != null && String(top).trim() !== "") return String(top).trim();

  const nested =
    data.data?.charge_id ??
    data.data?.chargeId ??
    data.payload?.charge_id ??
    data.payload?.chargeId;

  if (nested != null && String(nested).trim() !== "") {
    return String(nested).trim();
  }

  return null;
}

function extractStatus(data) {
  if (!data || typeof data !== "object") return null;
  return data.status ?? data.data?.status ?? data.payload?.status ?? null;
}

function chargeIdQuery(chargeId) {
  const escapedChargeId = chargeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return {
    $or: [
      { chargeId },
      { chargeId: new RegExp(`^${escapedChargeId}$`, "i") },
    ],
  };
}

router.post("/paychangu", async (req, res) => {
  try {
    const signature = req.headers["signature"];
    const secret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    const rawBody = req.rawBody.toString();
    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (computed !== signature) {
      console.log("Invalid webhook signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const data = JSON.parse(rawBody);
    const chargeIdRaw = extractChargeId(data);
    const chargeId = chargeIdRaw ? chargeIdRaw.toUpperCase() : null;
    const status = extractStatus(data);

    if (!chargeId) {
      console.warn("Webhook missing charge_id:", Object.keys(data));
      return res.status(400).json({
        message: "Invalid webhook payload: missing charge id",
      });
    }

    console.log("PayChangu webhook received:", { chargeId, status });

    const existingPayment = await Payment.findOne(chargeIdQuery(chargeId));

    if (!existingPayment) {
      console.warn("No payment for webhook charge_id:", chargeId);
      return res.status(200).json({ success: true });
    }

    if (
      existingPayment.status === "success" ||
      existingPayment.status === "completed"
    ) {
      await Payment.updateOne(
        { _id: existingPayment._id },
        {
          $set: {
            webhookResponse: data,
            webhookReceivedAt: new Date(),
          },
        },
      );

      console.log("Payment already confirmed, recorded and ignored webhook:", {
        id: existingPayment._id?.toString(),
        chargeId: existingPayment.chargeId,
        status: existingPayment.status,
        confirmationSource: existingPayment.confirmationSource,
      });

      return res.status(200).json({ success: true });
    }

    const update = {
      rawResponse: data,
      webhookResponse: data,
      webhookReceivedAt: new Date(),
    };

    if (status != null && status !== "") {
      update.status = status;
      if (status === "success" || status === "completed") {
        update.confirmationSource = "webhook";
        update.confirmedAt = new Date();
      }
    }

    const payment = await Payment.findOneAndUpdate(
      chargeIdQuery(chargeId),
      { $set: update },
      { new: true },
    );

    console.log("Payment updated via webhook:", {
      id: payment._id?.toString(),
      chargeId: payment.chargeId,
      status: payment.status,
      confirmationSource: payment.confirmationSource,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ message: "Webhook error" });
  }
});

export default router;
