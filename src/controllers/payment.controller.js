// controllers/payment.controller.js
import axios from "axios";
import crypto from "crypto";
import Cart from "../models/cart.model.js";
import Payment from "../models/payment.model.js";

export const createPayment = async (req, res) => {
  try {
    const { userId, email, name, amount, mobile, provider } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid cart total amount" });
    }

    if (!mobile || !provider) {
      return res.status(400).json({ message: "Mobile number and provider are required" });
    }

    // Confirm that the user actually has an active cart
    const activeCart = await Cart.findOne({ userId, status: "active" });
    if (!activeCart) {
      return res.status(404).json({ message: "No active cart found for this user" });
    }

    // Generate unique charge ID for PayChangu
    const chargeId = crypto.randomBytes(6).toString("hex").toUpperCase();

    // Select Mobile Money Provider
    const operatorId =
      provider === "airtel"
        ? "20be6c20-adeb-4b5b-a7ba-0769820df4fb"
        : "c2be9bd0-a8b4-4fbd-9966-1b7cfe00a343"; // TNM example

    // Create mobile money charge via direct API call
    const response = await axios.post(
      `${process.env.PAYCHANGU_API_URL}`,
      {
        mobile_money_operator_ref_id: operatorId,
        mobile,
        amount: amount.toString(),
        charge_id: chargeId,
        email: email,
        first_name: name,
        last_name: name,
        metadata: { userId }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYCHANGU_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Persist payment to MongoDB before responding
    const paymentDoc = await Payment.create({
      userId,
      cartId: activeCart._id,
      chargeId,
      provider,
      operatorId,
      amount: Number(amount),
      currency: activeCart.currency || "MWK",
      status: "pending",
      rawResponse: response.data
    });

    console.log("Payment created in MongoDB:", { id: paymentDoc._id?.toString(), chargeId, userId });

    return res.status(200).json({
      success: true,
      message: "Payment initiated",
      userId,
      chargeId,
      cartId: activeCart._id,
      paymentId: paymentDoc._id,
      paychangu: response.data,
    });

 

  } catch (err) {
    console.error("Payment error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "Payment failed to start",
      error: err.response?.data || err.message,
    });
  }
};

export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await Payment.findById(paymentId).populate("userId cartId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Payment details retrieved",
      payment: {
        id: payment._id,
        chargeId: payment.chargeId,
        userId: payment.userId,
        cartId: payment.cartId,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        rawResponse: payment.rawResponse
      }
    });
  } catch (err) {
    console.error("Payment details error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment details",
      error: err.message
    });
  }
};


export const paymentCallback = async (req, res) => {
  try {
    const data = req.body;

    console.log("Paychangu callback received:", data);

    // Find the payment record by chargeId
    const payment = await Payment.findOne({ chargeId: data.charge_id });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment status based on callback
    payment.status = data.status; // e.g., "success", "failed", "pending"
    payment.rawResponse = data;

    await payment.save();

    return res.status(200).json({ message: "Payment updated successfully" });
  } catch (err) {
    console.error("Payment callback error:", err);
    return res.status(500).json({ message: "Failed to process payment callback" });
  }
};


// controllers/payment.controller.js
export const backupPaymentConfirmation = async (req, res) => {
  try {
    const { chargeId, status, amount, userId } = req.body;

    if (!chargeId) {
      return res.status(400).json({ message: "chargeId is required" });
    }

    const updated = await Payment.findOneAndUpdate(
      { chargeId },
      { status, amount, fallback: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Payment updated using fallback",
      payment: updated
    });
  } catch (err) {
    console.error("Backup update error:", err.message);
    res.status(500).json({ message: "Backup update failed" });
  }
};

