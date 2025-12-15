export class Cart {
  constructor({ userId, items = [], totalamount = 0, currency = 'MWK', status = 'active' }) {
    this.userId = userId
    this.items = items
    this.totalamount = totalamount
    this.currency = currency
    this.status = status
  }

  isEmpty() {
    return this.items.length === 0
  }

  updateItems(items) {
    if (!items || items.length === 0) {
      throw new Error('Cart items are required')
    }
    this.items = items
  }

  calculateTotal(prices) {
    this.totalamount = this.items.reduce(
      (sum, item) => sum + prices[item.itemId] * item.quantity,
      0
    )
  }

  complete() {
    this.status = 'completed'
    this.items = []
  }

  toJSON() {
  return {
    items: this.items,
    totalamount: this.totalamount,
    currency: this.currency
  }
}

}
