import mongoose from "mongoose";

const { Schema } = mongoose;

const IdempotencySchema = new Schema(
  {
    // The client-generated transaction ID / idempotency key
    key: {
      type: String,
      required: true,
      trim: true,
    },

    // Scope the key to a specific user
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Hash of request body to ensure same request payload
    requestHash: {
      type: String,
      required: true,
    },

    // Current processing state
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUCCESS", "FAILED"],
      required: true,
      default: "IN_PROGRESS",
    },

    // Store final HTTP response body
    responseBody: {
      type: Schema.Types.Mixed,
    },

    // Store HTTP status code (200, 400, etc.)
    responseCode: {
      type: Number,
    },

    // Optional: link to payment document
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },

    // Useful for debugging / expiration
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

export default mongoose.model("Idempotency", IdempotencySchema);