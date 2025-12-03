// controllers/webhook.controller.js
import Cart from "../models/cart.model.js";

export const handleWebhook = async (req, res) => {
  const { payment_status, userId } = req.body;

  try {
    if (payment_status === "success") {
      // Mark cart as completed
      await Cart.findOneAndUpdate(
        { userId, status: "active" },
        { status: "completed" }
      );
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error(err);
    res.status(500).send("Webhook error");
  }
};
