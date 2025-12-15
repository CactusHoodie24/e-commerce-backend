import Cart from "../models/cart.model.js";

export class CartRepository {
   async findExistingUser(userId) {
  return Cart.findOne({
    userId,
    status: 'active'
  })
}


    async save(cart) {
        return await Cart.findOneAndUpdate({
            userId: cart.userId,
            status: 'active'
        }, cart, {upsert: true, new: true})
    }

    async clear(userId) {
    return Cart.findOneAndUpdate(
      { userId, status: 'active' },
      { status: 'completed', items: [] },
      { new: true }
    )
  }
}