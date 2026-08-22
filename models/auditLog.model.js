const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "CREATE_CATEGORY",
        "UPDATE_CATEGORY",
        "DELETE_CATEGORY",
        "CREATE_PRODUCT",
        "DELETE_PRODUCT",
        "UPDATE_PRODUCT",
        "DELETE_REVIEW",
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",
        "CREATE_COUPON",
        "UPDATE_COUPON",
        "CREATE_SEASONAL_OFFER",
        "UPDATE_SEASONAL_OFFER",
        "DELETE_SEASONAL_OFFER",
      ],
    },
    targetType: {
      type: String, // "Product", "User", "Review", "Coupon", "SeasonalOffer" and so on
      required: true,
    },
    targetId: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
