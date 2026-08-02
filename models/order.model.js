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
            required: true, // snapshot so renamed/deleted products don't break order history
          },
          quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"],
          },
          size: {
            type: String,
            enum: ["small", "medium", "large"],
            required: true,
          },
          price: {
            type: Number,
            required: true, // snapshot at time of order
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
      ],
      default: "pending",
    },
    taxPrice: {
      type: Number,
      default: 0,
    },
    deliveryMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      required: true,
    },
    deliveryAddress: {
      governorate: String,
      city: String,
      street: String,
      zipCode: String,
    },
    shippingPrice: {
      type: Number,
      default: 0,
    },
    totalOrderPrice: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    deliveredAt: Date,
    acceptedAt: { type: Date, default: null },
    preparingAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
