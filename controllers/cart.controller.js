const ApiError = require("../utils/apiError");
const Cart = require("../models/cart.model.js");
const Product = require("../models/product.model.js");
const Coupon = require("../models/coupon.model.js");
const { getActiveOffersForProducts } = require("./seasonalOffer.controller.js");

// calculate total price
const calcTotalPrice = (cart) => {
  let totalPrice = 0;

  cart.cartItems.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });

  // Remove previous discount whenever cart changes
  cart.totalPriceAfterDiscount = undefined;

  return totalPrice;
};

/** 
 @ desc   add product to cart
 @ route  POST /api/v1/cart
 @ access protected/customer
 **/

// =========================
// CORE LOGIC (shared, no response handling)
// =========================
const addProductToCartCore = async (req) => {
  const productId = req.params.productId || req.body.productId;
  const { size } = req.body;

  // 1- Get product
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  // 2- Check product availability
  if (!product.isAvailable || product.stockQuantity <= 0) {
    throw new ApiError("Product is currently unavailable", 400);
  }

  // 3- Determine price based on product sizes
  let selectedPrice = product.price;

  if (product.sizes && product.sizes.length > 0) {
    if (!size) {
      throw new ApiError("Size is required for this product", 400);
    }

    const selectedSize = product.sizes.find((item) => item.name === size);

    if (!selectedSize) {
      throw new ApiError(`Product is not available in ${size} size`, 400);
    }

    selectedPrice = selectedSize.price;
  } else {
    if (size) {
      throw new ApiError("This product does not have sizes", 400);
    }

    if (product.price === null || product.price === undefined) {
      throw new ApiError("Product price is not configured", 400);
    }
  }

  // 3.5- Apply active seasonal offer discount, if any
  const offersCoveringThisProduct = await getActiveOffersForProducts(
    [product._id],
    [product.categoryId],
  );

  if (offersCoveringThisProduct.length > 0) {
    const offer = offersCoveringThisProduct[0];
    const discountPercentage = offer.discountPercentage;

    selectedPrice =
      Math.round(
        (selectedPrice - (selectedPrice * discountPercentage) / 100) * 100,
      ) / 100;
  }

  // 4- Get cart for logged user
  let cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user._id,
      cartItems: [
        {
          productId: product._id,
          size: size || undefined,
          price: selectedPrice,
          quantity: 1,
        },
      ],
    });
  } else {
    const productIndex = cart.cartItems.findIndex(
      (item) => item.productId.toString() === productId && item.size === size,
    );

    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];

      if (cartItem.quantity >= product.stockQuantity) {
        throw new ApiError("Cannot add more than available stock", 400);
      }

      cartItem.quantity += 1;
    } else {
      cart.cartItems.push({
        productId: product._id,
        size: size || undefined,
        price: selectedPrice,
        quantity: 1,
      });
    }
  }

  const totalPrice = calcTotalPrice(cart);
  cart.totalCartPrice = totalPrice;

  await cart.save();

  return cart;
};

// =========================
// STANDALONE ROUTE — POST /api/v1/cart
// Responds directly, nothing chained after it
// =========================
exports.addProductToCart = async (req, res, next) => {
  try {
    const cart = await addProductToCartCore(req);

    res.status(201).json({
      status: "success",
      message: "Product was added successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// CHAINED VERSION — used in wishlist's move-to-cart route
// Stores result in res.locals, calls next() so the next
// middleware (removeWishlistItem) can send the final response
// =========================
exports.addProductToCartChained = async (req, res, next) => {
  try {
    const cart = await addProductToCartCore(req);
    res.locals.cart = cart;
    next();
  } catch (error) {
    next(error);
  }
};

// @desc   Get logged users cart
// @route  GET /api/v1/cart
// @access protected/customer
exports.getLoggedUserCart = async (req, res, next) => {
  const cart = await Cart.findOne({
    userId: req.user._id,
  }).populate({
    path: "cartItems.productId",
    select: "name price imageUrl stockQuantity isAvailable",
  });

  if (!cart) {
    return next(new ApiError("There is no cart", 404));
  }

  res.status(200).json({
    status: "success",
    result: cart.cartItems.length,
    data: cart,
  });
};

// @desc   Remove cart item
// @route  DELETE /api/v1/cart/:itemId
// @access protected/customer
exports.deleteCartItem = async (req, res, next) => {
  const cart = await Cart.findOne({
    userId: req.user._id,
  });

  if (!cart) {
    return next(new ApiError("Cart not found", 404));
  }

  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId,
  );

  if (itemIndex === -1) {
    return next(
      new ApiError(`There is no cart item with id ${req.params.itemId}`, 404),
    );
  }

  cart.cartItems.splice(itemIndex, 1);

  // calculate total cart price
  const totalPrice = calcTotalPrice(cart);
  cart.totalCartPrice = totalPrice;

  await cart.save();

  res.status(200).json({
    status: "success",
    result: cart.cartItems.length,
    data: cart,
  });
};

// @desc   Clear cart
// @route  DELETE /api/v1/cart
// @access protected/customer
exports.clearCart = async (req, res, next) => {
  const result = await Cart.findOneAndDelete({
    userId: req.user._id,
  });

  if (!result) {
    return next(new ApiError("Cart is not found", 404));
  }

  res.status(204).send();
};

// @desc   Update cart item (quantity)
// @route  PATCH /api/v1/cart/:itemId
// @access protected/customer
exports.updateCartItemQuantity = async (req, res, next) => {
  const { quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity < 1) {
    return next(
      new ApiError("Quantity must be an integer greater than 0", 400),
    );
  }

  const cart = await Cart.findOne({
    userId: req.user._id,
  });

  if (!cart) {
    return next(new ApiError(`There is no cart for user ${req.user._id}`, 404));
  }

  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId,
  );

  if (itemIndex === -1) {
    return next(
      new ApiError(`There is no item with this id: ${req.params.itemId}`, 404),
    );
  }

  const cartItem = cart.cartItems[itemIndex];

  // Get latest product stock
  const product = await Product.findById(cartItem.productId);

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }

  // Check product availability
  if (!product.isAvailable || product.stockQuantity <= 0) {
    return next(new ApiError("Product is currently unavailable", 400));
  }

  // Prevent quantity from exceeding stock
  if (quantity > product.stockQuantity) {
    return next(
      new ApiError(`Only ${product.stockQuantity} items are available`, 400),
    );
  }

  cartItem.quantity = quantity;

  // calculate total cart price
  const totalPrice = calcTotalPrice(cart);

  cart.totalCartPrice = totalPrice;

  await cart.save();

  res.status(200).json({
    status: "success",
    result: cart.cartItems.length,
    data: cart,
  });
};

// not implemented yet as we don't have coupon model yet
exports.applyCoupon = async (req, res, next) => {
  const coupon = await Coupon.findOne({
    name: req.body.coupon,
    expire: { $gt: Date.now() },
  });
  if (!coupon) return next(new ApiError("Coupon is expired or invalid", 404));

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) return next(new ApiError("There is no cart for this user"));
  let totalPrice = cart.totalCartPrice;

  const totalPriceAfterCoupon = (
    totalPrice -
    totalPrice * (coupon.discount / 100)
  ).toFixed(2);

  cart.totalPriceAfterDiscount = totalPriceAfterCoupon;
  await cart.save();

  res.status(200).json({
    status: "success",
    result: cart.cartItems.length,
    data: cart,
  });
};
