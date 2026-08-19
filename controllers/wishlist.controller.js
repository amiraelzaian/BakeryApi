const ApiError = require("../utils/apiError");
const Wishlist = require("../models/wishlist.model");

exports.addProductToWishlist = async (req, res, next) => {
  const wishlistItem = await Wishlist.create({
    user: req.user._id,
    product: req.body.productId,
  });

  if (!wishlistItem) {
    return next(
      new ApiError(
        "Could not add this product to your wishlist, Something went wrong",
        400,
      ),
    );
  }

  res.status(201).json({ status: "success", data: wishlistItem });
};

exports.getLoggedUserWishlist = async (req, res, next) => {
  const wishlist = await Wishlist.find({ user: req.user._id }).populate(
    "product",
  );
  if (!wishlist)
    return next(new ApiError("The user's wishlist is not found", 404));

  res
    .status(200)
    .json({ status: "success", length: wishlist.length, data: wishlist });
};

exports.removeWishlistItem = async (req, res, next) => {
  const item = await Wishlist.findOneAndDelete({
    user: req.user._id,
    product: req.params.productId,
  });

  if (!item) {
    return next(
      new ApiError("This product is not found in your wishlist", 404),
    );
  }

  // If chained after addProductToCart, res.locals.cart will exist
  if (res.locals.cart) {
    return res.status(201).json({
      status: "success",
      message: "Product was added to cart and removed from wishlist",
      data: res.locals.cart,
    });
  }

  res.status(204).send();
};

exports.addWishlistItemToCart = async (req, res, next) => {};
