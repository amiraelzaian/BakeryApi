const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");

const Product = require("../models/product.model");

// =========================
// ADD PRODUCT TO CART
// =========================

exports.addProductToCartValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id is required")
    .isMongoId()
    .withMessage("Invalid product id")
    .custom(async (val) => {
      const product = await Product.findById(val);

      if (!product) {
        throw new Error("Product not found");
      }

      if (!product.isAvailable || product.stockQuantity <= 0) {
        throw new Error("Product is currently unavailable");
      }

      return true;
    }),

  check("size")
    .optional()
    .isIn(["small", "medium", "large"])
    .withMessage("Size must be small, medium, or large"),

  validatorMiddleware,
];

// =========================
// UPDATE CART ITEM QUANTITY
// =========================

exports.updateCartItemQuantityValidator = [
  check("itemId").isMongoId().withMessage("Invalid cart item id"),

  check("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  validatorMiddleware,
];

// =========================
// DELETE CART ITEM
// =========================

exports.deleteCartItemValidator = [
  check("itemId").isMongoId().withMessage("Invalid cart item id"),

  validatorMiddleware,
];

// =========================
// APPLY COUPON
// =========================

exports.applyCouponValidator = [
  check("coupon")
    .notEmpty()
    .withMessage("Coupon code is required")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Coupon code is too short"),

  validatorMiddleware,
];
