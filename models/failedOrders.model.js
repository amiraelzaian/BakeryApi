const mongoose = require("mongoose");

const failedOrderSchema = new mongoose.Schema(
  {
    transactionId: String,
    merchantOrderId: String,
    user: mongoose.Schema.ObjectId,
    amount: Number,
    reason: String,
    refunded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FailedOrder", failedOrderSchema);
