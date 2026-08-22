const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Order must belong to user"],
    },

    cartItems: {
      type: [
        {
          product: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"],
          },
          size: {
            type: String,
            enum: ["small", "medium", "large"],
            default: null,
          },
          price: {
            type: Number,
            required: true,
          },
        },
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Order must contain at least one item",
      },
    },

    assignedBakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedDeliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Current order status
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "picked_up",
      ],
      default: "pending",
    },

    // Complete order status history
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "accepted",
            "preparing",
            "ready",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "picked_up",
          ],
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    taxPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    shippingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      required: true,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    kashierTransactionId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    deliveryAddress: {
      governorate: String,
      city: String,
      street: String,
      zipCode: String,
    },

    totalOrderPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
