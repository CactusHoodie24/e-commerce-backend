import crypto from "crypto"
import { Payment } from "../domain/payment.js"

export class PaymentService {
  constructor(cartRepository, paymentRepository, paymentProvider) {
    this.cartRepository = cartRepository
    this.paymentRepository = paymentRepository
    this.paymentProvider = paymentProvider
  }

  async createPayment({ userId, email, name, mobile, provider, amount }) {
    const cart = await this.cartRepository.findExistingUser(userId)
    if (!cart) throw new Error("No active cart")

    const chargeId = crypto.randomBytes(6).toString("hex").toUpperCase()

    const operatorId =
      provider === "airtel"
        ? "20be6c20-adeb-4b5b-a7ba-0769820df4fb"
        : "c2be9bd0-a8b4-4fbd-9966-1b7cfe00a343"

    const response = await this.paymentProvider.initiateMobileMoney({
      operatorId,
      mobile,
      amount,
      chargeId,
      email,
      name,
      metadata: { userId }
    })

    const payment = new Payment({
      userId,
      cartId: cart._id,
      amount,
      currency: cart.currency,
      provider,
      operatorId,
      chargeId,
      rawResponse: response
    })

const savedPayment = await this.paymentRepository.save(payment)
return savedPayment
  }

  async handleCallback(data) {
    const payment = await this.paymentRepository.findByChargeId(data.charge_id)
    if (!payment) throw new Error("Payment not found")

    return this.paymentRepository.updateByChargeId(
      data.charge_id,
      {
        status: data.status,
        rawResponse: data
      }
    )
  }
}
