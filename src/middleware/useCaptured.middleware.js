// useCaptured.middleware.js
// Post-handler middleware to act on `res.locals.capturedResponse` set by
// `captureResponse` middleware. By default it logs the captured payload and
// attaches it to `req.capturedPayment` for downstream use.

import Payment from "../models/payment.model.js";

export default async function useCaptured(req, res, next) {
  try {
     console.log("M3: useCaptured middleware START");
    const captured = res.locals && res.locals.capturedResponse;
    if (!captured) return next();

    // Attach to request for immediate downstream usage
    req.capturedPayment = captured;

    // Persist a Payment document with useful fields when available.
    const doc = {
      rawResponse: captured
    };

    // Try to extract known fields if present
    if (captured?.data) {
      const d = captured.data;
      if (d.charge_id) doc.chargeId = d.charge_id;
      if (d.metadata?.userId) doc.userId = d.metadata.userId;
      if (d.amount) doc.amount = Number(d.amount);
      if (d.currency) doc.currency = d.currency;
      if (d.mobile_money_operator_ref_id) doc.operatorId = d.mobile_money_operator_ref_id;
      if (d.status) doc.status = d.status;
    }

    const created = await Payment.create(doc);
    if (created) {
      console.log('useCaptured: Payment persisted', { id: created._id?.toString(), chargeId: created.chargeId });
      // attach created doc for downstream use if needed
      req.capturedPaymentDoc = created;
    }
  } catch (err) {
    console.error('useCaptured middleware error:', err);
  }

  return next();
}
