import crypto from "crypto"
import { Payment } from "../domain/payment.js"

/** PayChangu returns the canonical charge id under `data` (may differ from the id we sent). */
function chargeIdFromPaychanguInitResponse(body) {
  if (!body || typeof body !== "object") return null
  const id =
    body.data?.transaction?.charge_id ??
    body.data?.transaction?.chargeId ??
    body.data?.charge_id ??
    body.data?.chargeId ??
    body.charge_id ??
    body.chargeId
  if (id == null || String(id).trim() === "") return null
  return String(id).trim().toUpperCase()
}

function bankInstructionsFromPaychanguResponse(body, amount, currency) {
  const accountDetails = body?.data?.payment_account_details ?? {}
  const transaction = body?.data?.transaction ?? {}
  const bankName = accountDetails.bank_name
  const accountNumber = accountDetails.account_number
  const accountName = accountDetails.account_name
  const transferAmount = transaction.amount ?? amount
  const transferCurrency = currency || "MWK"

  return {
    bankName,
    accountNumber,
    accountName,
    accountExpirationTimestamp:
      accountDetails.account_expiration_timestamp ?? null,
    message: `Please transfer ${transferCurrency} ${transferAmount} to account ${accountNumber} at ${bankName}`,
  }
}

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

    if (provider === "bank") {
      try {
        const bankChargeId = `PC-${chargeId}`
        const response = await this.paymentProvider.initiateBankTransfer({
          amount,
          currency: "MWK",
          chargeId: bankChargeId,
        })
        const bankInstructions = bankInstructionsFromPaychanguResponse(
          response,
          amount,
          "MWK",
        )
        const providerChargeId = chargeIdFromPaychanguInitResponse(response)
        const persistedChargeId = providerChargeId ?? bankChargeId

        const payment = new Payment({
          transactionId: idempotencyKey,
          userId,
          cartId: cart._id,
          amount,
          currency: cart.currency,
          provider,
          operatorId: null,
          chargeId: persistedChargeId,
          status: response?.data?.transaction?.status ?? "pending",
          rawResponse: {
            ...response,
            paymentMethod: "bank",
            bankInstructions,
          }
        });

        const savedPayment = await this.paymentRepository.save(payment);

        idempotency.markSuccess({
          responseBody: savedPayment,
          responseCode: 200,
          paymentId: savedPayment.id
        });

        await this.idempotencyRepository.save(idempotency);

        return savedPayment;
      } catch (error) {
        idempotency.markFailure({
          responseBody: { message: error.message },
          responseCode: 500
        });

        await this.idempotencyRepository.save(idempotency);

        throw error;
      }
    }
  
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

      const providerChargeId = chargeIdFromPaychanguInitResponse(response)
      const persistedChargeId = providerChargeId ?? chargeId
  
      const payment = new Payment({
        transactionId: idempotencyKey,
        userId,
        cartId: cart._id,
        amount,
        currency: cart.currency,
        provider,
        operatorId,
        chargeId: persistedChargeId,
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
