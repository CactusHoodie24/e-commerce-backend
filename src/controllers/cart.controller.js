// controllers/cart.controller.js
import Cart from "../models/cart.model.js";

// Get the active cart for a user
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      userId: req.params.userId,
      status: "active"
    });

    res.status(200).json(cart || { items: [], totalamount: 0, currency: "MWK" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch cart",
      error: err.message
    });
  }
};

// Update or create cart (runs at checkout)
export const updateCart = async (req, res) => {
  try {
    const { items, totalamount, currency } = req.body;

    if (!items || Object.keys(items).length === 0) {
      return res.status(400).json({ message: "Cart items are required" });
    }

    if (!totalamount) {
      return res.status(400).json({ message: "Total amount is required" });
    }

    // Convert { id: qty } into array objects
    const cartItems = Object.entries(items).map(([itemId, quantity]) => ({
      itemId,
      quantity
    }));

    let cart = await Cart.findOne({
      userId: req.params.userId,
      status: "active"
    });

    if (cart) {
      cart.items = cartItems;
      cart.totalamount = totalamount;
      cart.currency = currency || "MWK";
      await cart.save();
    } else {
      cart = await Cart.create({
        userId: req.params.userId,
        items: cartItems,
        totalamount,
        currency: currency || "MWK"
      });
    }

    res.status(200).json({
      message: "Cart saved successfully",
      cart
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update cart",
      error: err.message
    });
  }
};

// Clear cart after order is completed
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.params.userId, status: "active" },
      { status: "completed", items: [] },
      { new: true }
    );

    res.status(200).json(cart || { message: "No active cart to clear" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to clear cart",
      error: err.message
    });
  }
};
