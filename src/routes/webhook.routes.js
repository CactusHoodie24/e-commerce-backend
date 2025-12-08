// routes/webhook.routes.js
import express from "express";
import Payment from "../models/payment.model.js";
import crypto from "crypto";
import authenticateuser from "../middleware/auth.middleware.js";


const router = express.Router();

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
    const chargeId = data.charge_id;   // note the underscore
    const status = data.status;  

    const payment = await Payment.findOneAndUpdate(
      { chargeId },
      { status, rawWebhook: data },
      { new: true }
    );

    console.log("✅ Payment updated via webhook:", payment);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ message: "Webhook error" });
  }});

export default router;
