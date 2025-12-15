import { Cart } from "../domain/cart.js"

export class CartService {
  constructor(cartRepository, ) {
      this.cartRepository = cartRepository
  }

  async getCart(userId) {
    const cartData = await this.cartRepository.findExistingUser(userId)

    if(!cartData) {
      return new Cart({userId})
    }

    return new Cart(cartData)
  }

  async updateCart(userId,items,currency) {
    const cart = await this.getCart(userId)
    cart.updateItems(items)
    cart.currency = currency || 'MWK'

    return this.cartRepository.save(cart)

  }

  async clearCart(userId) {
    return this.cartRepository.clear(userId)
  }
}