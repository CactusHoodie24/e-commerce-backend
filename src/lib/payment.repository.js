import PaymentModel from "../models/payment.model.js"

export class PaymentRepository {
async save(payment) {
  // First check if payment with same transactionId already exists
  const existing = await PaymentModel.findOne({ transactionId: payment.transactionId });
  if (existing) return existing; // replay existing payment

  // Wrap in model if not already
  const paymentDoc = payment instanceof PaymentModel ? payment : new PaymentModel(payment);
  return await paymentDoc.save(); // actually save new payment
}



  async findByChargeId(chargeId) {
    return PaymentModel.findOne({ chargeId })
  }

  async updateByChargeId(chargeId, data) {
    return PaymentModel.findOneAndUpdate(
      { chargeId },
      data,
      { new: true }
    )
  }

  async findUserPayments(userId) {
    return PaymentModel.find({ userId }).sort({ createdAt: -1 })
  }
}
