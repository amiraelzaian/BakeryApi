const mongoose = require("mongoose");

const pendingOrderSchema = new mongoose.Schema({
  merchantOrderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
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
  cartItems: [
    {
      productId: mongoose.Schema.ObjectId,
      quantity: Number,
      size: String,
      price: Number,
    },
  ],
  itemsPrice: Number,
  createdAt: { type: Date, default: Date.now, expires: 3600 },
});

module.exports = mongoose.model("PendingOrder", pendingOrderSchema);
