// controllers/paychanguWebhook.controller.js
import Payment from "../models/payment.model.js";

export const handlePaychanguWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("📩 PayChangu Webhook Received:", event);

    // Validate essential fields
    if (!event.charge_id) {
      console.warn("⚠️ Webhook missing charge_id");
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    // Update payment status in database
    const updatedPayment = await Payment.findOneAndUpdate(
      { chargeId: event.charge_id },
      {
        status: event.status,
        rawResponse: event,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedPayment) {
      console.warn("⚠️ No payment found for charge_id:", event.charge_id);
    } else {
      console.log("✅ Payment status updated:", updatedPayment.status);
    }

    // IMPORTANT — MUST return 200 OK or Paychangu retries
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook Processing Error:", error.message);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
