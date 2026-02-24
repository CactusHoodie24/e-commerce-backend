// routes/payment.routes.js
import express from "express";
import { createPayment, getPaymentDetails, paymentCallback, backupPaymentConfirmation, getUserTransactions, getPaymentStatus } from "../controllers/payment.controller.js";
import captureResponse from "../middleware/captureResponse.middleware.js";
import useCaptured from "../middleware/useCaptured.middleware.js";
import authenticateuser from "../middleware/auth.middleware.js";
import { idempotencyMiddleware } from "../middleware/idempotentKey.middleware.js";

const router = express.Router();

// Attach captureResponse so downstream middleware/handlers can access the
// successful response body via `res.locals.capturedResponse`.
// captureResponse stores successful (200) JSON response at
// `res.locals.capturedResponse`. `useCaptured` runs after the controller
// to process that payload (log, persist, notify, etc.).
router.post("/pay", authenticateuser, captureResponse, createPayment, useCaptured);

// Retrieve payment details by paymentId
router.get("/payment-processing/:paymentId", getPaymentDetails);

// Get all transactions for the authenticated user
router.get("/transactions", authenticateuser, getUserTransactions);

router.post("/callback", paymentCallback);

router.post("/backup-confirm", backupPaymentConfirmation);

router.get("/status", idempotencyMiddleware, getPaymentStatus)

export default router;
