const express = require("express");

const { protect, allowedTo } = require("../controllers/auth.controller");

const {
  addProductToCart,
  getLoggedUserCart,
  deleteCartItem,
  clearCart,
  updateCartItemQuantity,
  applyCoupon,
} = require("../controllers/cart.controller");

const {
  addProductToCartValidator,
  updateCartItemQuantityValidator,
  deleteCartItemValidator,
  applyCouponValidator,
} = require("../validators/cart.validator");

const router = express.Router();

// Apply coupon
router
  .route("/applyCoupon")
  .post(protect, allowedTo("customer"), applyCouponValidator, applyCoupon);

// Cart
router
  .route("/")
  .post(
    protect,
    allowedTo("customer"),
    addProductToCartValidator,
    addProductToCart,
  )
  .get(protect, allowedTo("customer"), getLoggedUserCart)
  .delete(protect, allowedTo("customer"), clearCart);

// Cart item
router
  .route("/:itemId")
  .patch(
    protect,
    allowedTo("customer"),
    updateCartItemQuantityValidator,
    updateCartItemQuantity,
  )
  .delete(
    protect,
    allowedTo("customer"),
    deleteCartItemValidator,
    deleteCartItem,
  );

module.exports = router;
