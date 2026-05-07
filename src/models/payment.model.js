import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: "Cart", required: false },
  chargeId: { type: String, required: false },
  provider: { type: String, required: false },
  operatorId: { type: String, required: false },
  amount: { type: Number, required: false },
  currency: { type: String, required: false },
  status: { type: String, required: false },
  confirmationSource: { type: String, required: false },
  confirmedAt: { type: Date, required: false },
  fallbackVerifiedAt: { type: Date, required: false },
  webhookReceivedAt: { type: Date, required: false },
  rawResponse: { type: mongoose.Schema.Types.Mixed },
  fallbackResponse: { type: mongoose.Schema.Types.Mixed },
  webhookResponse: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

paymentSchema.index({ transactionId: 1, chargeId: 1 }, { unique: true });

export default mongoose.model("Payment", paymentSchema);
