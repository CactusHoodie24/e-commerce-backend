// controllers/payment.controller.js
import axios from "axios";
import crypto from "crypto";
import Cart from "../models/cart.model.js";
import Payment from "../models/payment.model.js";
import { PaymentService } from "../services/payment.service.js"
import { PaymentRepository } from "../lib/payment.repository.js"
import { CartRepository } from "../lib/cart.repository.js"
import { PaychanguProvider } from "../providers/paychangu.provider.js"


export const createPayment = async (req, res) => {
  try {
    const paymentService = new PaymentService(
  new CartRepository(),
  new PaymentRepository(),
  new PaychanguProvider(
    process.env.PAYCHANGU_SECRET,
    process.env.PAYCHANGU_API_URL
  )
)

    const payment = await paymentService.createPayment(req.body)
     console.log("Payment created in MongoDB:", { id: payment._id?.toString(), chargeId: payment.chargeId, userId: payment.userId });
      return res.status(200).json({
      success: true,
      message: "Payment initiated",
      userId: payment.userId,
      chargeId: payment.chargeId,
      paymentId: payment._id,
      cartId: payment.cartId,
      paychangu: payment.rawResponse
    })
  } catch (err) {
    console.error("❌ PAYMENT CREATE ERROR");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
    res.status(400).json({ error: err.message })
  } 
}


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

// Get all transactions for the authenticated user
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find all payments for this user, sorted by most recent first
    const transactions = await Payment.find({ userId })
      .populate("cartId")
      .sort({ createdAt: -1 }); // Most recent first

    // Format transactions for response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      chargeId: transaction.chargeId,
      provider: transaction.provider,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      cartId: transaction.cartId?._id || transaction.cartId
    }));

    return res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      transactions: formattedTransactions,
      count: formattedTransactions.length
    });
  } catch (err) {
    console.error("Get user transactions error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions",
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
    const { chargeId } = req.body;

    if (!chargeId) {
      return res.status(400).json({ message: "chargeId is required" });
    }

    // Find the payment record first
    const payment = await Payment.findOne({ chargeId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // If payment is already successful/completed, return it without verification
    // (webhook may have already updated it)
    if (payment.status === "success" || payment.status === "completed") {
      console.log("Payment already confirmed by webhook, skipping verification");
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed",
        payment: payment,
        verifiedStatus: payment.status
      });
    }

    // Only verify with Paychangu if payment is still pending
    // Verify payment status with Paychangu API
    try {
      const verifyResponse = await axios.get(
        `https://api.paychangu.com/verify-payment/${chargeId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYCHANGU_SECRET}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Check if the API call was successful
      if (verifyResponse.status !== 200) {
        console.warn("Paychangu verification returned non-200 status:", verifyResponse.status);
        return res.status(400).json({
          success: false,
          message: "Payment verification failed - invalid response from Paychangu"
        });
      }

      console.log("Paychangu verification response:", verifyResponse.data);

      // Extract the actual status from Paychangu's response
      // Paychangu API structure: { status: "success", message: "...", data: { status: "success", amount: ..., ... } }
      const verifiedStatus = verifyResponse.data?.data?.status;
      const verifiedAmount = verifyResponse.data?.data?.amount;

      // Only update if we got a valid status from Paychangu
      if (!verifiedStatus) {
        console.warn("Paychangu verification did not return a status");
        return res.status(400).json({ 
          success: false,
          message: "Could not verify payment status with Paychangu" 
        });
      }

      // Update payment with verified status from Paychangu (not client-provided status)
      const updated = await Payment.findOneAndUpdate(
        { chargeId },
        { 
          status: verifiedStatus,
          amount: verifiedAmount || payment.amount,
          rawResponse: verifyResponse.data,
          fallback: true 
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified and updated using fallback",
        payment: updated,
        verifiedStatus
      });

    } catch (verifyError) {
      console.error("Paychangu verification error:", verifyError.response?.data || verifyError.message);
      
      // Check if payment was updated by webhook in the meantime
      const currentPayment = await Payment.findOne({ chargeId });
      
      // If payment is now successful/completed (webhook updated it), return success
      if (currentPayment && (currentPayment.status === "success" || currentPayment.status === "completed")) {
        console.log("Payment was updated by webhook during verification, returning current status");
        return res.status(200).json({
          success: true,
          message: "Payment confirmed (updated by webhook)",
          payment: currentPayment,
          verifiedStatus: currentPayment.status
        });
      }
      
      // If Paychangu says "Payment link not found", check current payment status
      const errorMessage = verifyError.response?.data?.message || verifyError.message || "";
      if (errorMessage.includes("not found") || errorMessage.includes("Payment link not found")) {
        console.warn("Paychangu returned 'not found' - payment may have been processed or link expired");
        // Return current payment status - if webhook updated it to success, that's fine
        // If still pending, we couldn't verify but won't mark as failed
        const finalPayment = currentPayment || payment;
        return res.status(200).json({
          success: finalPayment.status === "success" || finalPayment.status === "completed",
          message: finalPayment.status === "success" || finalPayment.status === "completed" 
            ? "Payment confirmed (webhook updated status)" 
            : "Could not verify with Paychangu, but payment record exists",
          payment: finalPayment,
          verifiedStatus: finalPayment.status,
          warning: "Paychangu verification returned 'not found'"
        });
      }
      
      // For other errors, return failure
      return res.status(400).json({
        success: false,
        message: "Failed to verify payment with Paychangu. Payment status could not be confirmed.",
        error: verifyError.response?.data || verifyError.message
      });
    }

  } catch (err) {
    console.error("Backup update error:", err.message);
    res.status(500).json({ 
      success: false,
      message: "Backup update failed",
      error: err.message 
    });
  }
};

