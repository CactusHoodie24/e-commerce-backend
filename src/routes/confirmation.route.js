// routes/payment.routes.js
import express from "express";
import { createPayment, getPaymentDetails, paymentCallback, backupPaymentConfirmation } from "../controllers/payment.controller.js";
import captureResponse from "../middleware/captureResponse.middleware.js";
import useCaptured from "../middleware/useCaptured.middleware.js";

const router = express.Router();

// Attach captureResponse so downstream middleware/handlers can access the
// successful response body via `res.locals.capturedResponse`.
// captureResponse stores successful (200) JSON response at
// `res.locals.capturedResponse`. `useCaptured` runs after the controller
// to process that payload (log, persist, notify, etc.).


router.post("/backup-confirm", backupPaymentConfirmation);


export default router;
