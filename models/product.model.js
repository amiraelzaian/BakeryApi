const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is  required"],
      trim: true,
      unique: true,
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
    },
    stockQuantity: {
      type: Number,
      required: [true, "Product stock is required"],
      min: 0,
      default: 0,
    },
    isAvailable: {
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
  this.isAvailable = this.stockQuantity > 0;
});

module.exports = mongoose.model("Product", productSchema);
