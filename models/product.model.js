const mongoose = require("mongoose");

const productSizeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["small", "medium", "large"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Used when the product has NO sizes
    price: {
      type: Number,
      min: 0,
      default: null,
    },

    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Product must belong to Category"],
    },

    // Used when the product HAS sizes
    sizes: {
      type: [productSizeSchema],
      default: [],
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

    soldQuantity: {
      type: Number,
      default: 0,
      min: 0,
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
