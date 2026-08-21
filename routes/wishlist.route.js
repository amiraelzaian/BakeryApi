const express = require("express");
const { protect, allowedTo } = require("../controllers/auth.controller");
const {
  addProductToWishlist,
  getLoggedUserWishlist,
  removeWishlistItem,
} = require("../controllers/wishlist.controller");
const { addProductToCartChained } = require("../controllers/cart.controller");
const {
  addProductToWishlistValidator,
  removeWishlistItemValidator,
  moveToCartValidator,
} = require("../validators/wishlist.validator");

const router = express.Router();

router.use(protect, allowedTo("customer"));

router
  .route("/")
  .post(addProductToWishlistValidator, addProductToWishlist)
  .get(getLoggedUserWishlist);

router
  .route("/:productId")
  .delete(removeWishlistItemValidator, removeWishlistItem);

router
  .route("/:productId/move-to-cart")
  .post(moveToCartValidator, addProductToCartChained, removeWishlistItem);

module.exports = router;
