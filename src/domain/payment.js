export class Payment {
  constructor({
    userId,
    cartId,
    amount,
    currency = 'MWK',
    provider,
    operatorId,
    chargeId,
    status = 'pending',
    rawResponse = null
  }) {
    this.userId = userId
    this.cartId = cartId
    this.amount = amount
    this.currency = currency
    this.provider = provider
    this.operatorId = operatorId
    this.chargeId = chargeId
    this.status = status
    this.rawResponse = rawResponse
  }

  markSuccess(response) {
    this.status = 'success'
    this.rawResponse = response
  }

  markFailed(response) {
    this.status = 'failed'
    this.rawResponse = response
  }

  isCompleted() {
    return this.status === 'success' || this.status === 'completed'
  }

  toJSON() {
    return {
      userId: this.userId,
      cartId: this.cartId,
      amount: this.amount,
      currency: this.currency,
      provider: this.provider,
      chargeId: this.chargeId,
      status: this.status
    }
  }
}
