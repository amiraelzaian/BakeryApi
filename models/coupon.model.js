const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Coupon name is required"],
      unique: true,
      uppercase: true,
    },

    expire: {
      type: Date,
      required: [true, "Coupon expire time is required"],
    },

    discount: {
      type: Number,
      required: [true, "Coupon discount value is required"],
      min: 1,
      max: 100,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Coupon", couponSchema);
