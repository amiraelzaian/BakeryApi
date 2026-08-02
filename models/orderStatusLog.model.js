const mongoose = require("mongoose");

const orderStatusLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    status: {
      type: String,
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
  { timestamps: false },
);

module.exports = mongoose.model("OrderStatusLog", orderStatusLogSchema);
