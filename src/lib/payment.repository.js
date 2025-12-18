import PaymentModel from "../models/payment.model.js"

export class PaymentRepository {
 async save(payment) {
    // Wrap in Mongoose model if it isn’t already
    const paymentDoc = payment instanceof PaymentModel ? payment : new PaymentModel(payment);
    return await paymentDoc.save(); // This returns the saved doc with _id
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
