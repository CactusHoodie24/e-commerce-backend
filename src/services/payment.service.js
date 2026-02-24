import crypto from "crypto"
import { Payment } from "../domain/payment.js"

export class PaymentService {
  constructor(cartRepository, paymentRepository, paymentProvider, idempotencyRepository) {
    this.cartRepository = cartRepository
    this.paymentRepository = paymentRepository
    this.paymentProvider = paymentProvider
    this.idempotencyRepository = idempotencyRepository
  }
  
  async createPayment(input) {
    const {
      userId,
      email,
      name,
      mobile,
      provider,
      amount,
      idempotencyKey,
    } = input;
  
    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
  
    // 1️⃣ Try to create idempotency intent atomically
    let idempotency;
  
    try {
      idempotency = await this.idempotencyRepository.createIntent({
        key: idempotencyKey,
        userId,
        requestHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });
    } catch (err) {
      // Duplicate key → fetch existing and replay
      const existing = await this.idempotencyRepository.findByKey(idempotencyKey, userId);
  
      if (!existing) throw err;
  
      if (existing.requestHash !== requestHash) {
        throw new Error("Idempotency key reused with different payload");
      }
  
      if (existing.status === "SUCCESS") {
       return existing.responseBody;
}

if (existing.status === "IN_PROGRESS") {
  return { status: "PROCESSING" };
}

if (existing.status === "FAILED") {
  return existing.responseBody;
}

    }
  
  
    const cart = await this.cartRepository.findExistingUser(userId);
    if (!cart) throw new Error("No active cart");
  
    const chargeId = crypto
  .createHash("sha256")
  .update(idempotencyKey) // tie to transactionId
  .digest("hex")
  .slice(0, 12) // shorten to 12 chars
  .toUpperCase();
  
    const operatorId =
      provider === "airtel"
        ? "20be6c20-adeb-4b5b-a7ba-0769820df4fb"
        : "c2be9bd0-a8b4-4fbd-9966-1b7cfe00a343";
  
    try {
      const response = await this.paymentProvider.initiateMobileMoney({
        operatorId,
        mobile,
        amount,
        chargeId,
        email,
        name,
        metadata: { userId }
      });
      console.log(response)
  
      const payment = new Payment({
        transactionId: idempotencyKey,
        userId,
        cartId: cart._id,
        amount,
        currency: cart.currency,
        provider,
        operatorId,
        chargeId,
        rawResponse: response
      });
  
      const savedPayment = await this.paymentRepository.save(payment);
  
      // 3️⃣ Mark idempotency success
      idempotency.markSuccess({
        responseBody: savedPayment,
        responseCode: 200,
        paymentId: savedPayment.id
      });
  
      await this.idempotencyRepository.save(idempotency);
  
      return savedPayment;
  
    } catch (error) {
  
      // 4️⃣ Mark idempotency failure
      idempotency.markFailure({
        responseBody: { message: error.message },
        responseCode: 500
      });
  
      await this.idempotencyRepository.save(idempotency);
  
      throw error;
    }
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

  async checkStatus(idempotencyKey, userId) {
    return await this.idempotencyRepository.findByKey(idempotencyKey, userId)
  }
}
