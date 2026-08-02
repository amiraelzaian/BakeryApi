const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Proudct name is  required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is rquired"],
      min: 0,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Product must belong to Category"],
      required: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, "Product stock is required"],
      min: 0,
      default: 0,
    },
    isAvaliable: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

productSchema.pre("save", function () {
  if (this.stockQuantity <= 0) {
    this.isAvailable = false;
  }
});

module.exports.mongoose.model("Product", productSchema);
