import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: "Cart", required: false },
  chargeId: { type: String, required: false },
  provider: { type: String, required: false },
  operatorId: { type: String, required: false },
  amount: { type: Number, required: false },
  currency: { type: String, required: false },
  status: { type: String, required: false },
  rawResponse: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
