const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },

        size: {
          type: String,
          enum: ["small", "medium", "large"],
          required: false,
        },

        // Price at the time the item was added
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    totalCartPrice: {
      type: Number,
      default: 0,
    },

    totalPriceAfterDiscount: {
      type: Number,
      default: null,
    },

    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cart", cartSchema);
