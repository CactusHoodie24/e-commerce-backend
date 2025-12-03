// models/cart.model.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  itemId: {
    type: String,   // Local storage ID
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  items: [cartItemSchema],

  totalamount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "MWK"
  },

  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active"
  }
}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);
