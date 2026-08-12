const Product = require("../models/product.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const ApiError = require("../utils/apiError");
const factory = require("../controllers/factory");
const mongoose = require("mongoose");

// =========================
// CUSTOMER
// =========================

// @desc   Create new order from cart
// @route  POST /api/v1/orders
// @access protected/customer

exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1- Get user's cart
    const cart = await Cart.findOne({
      userId: req.user._id,
    }).session(session);

    if (!cart || cart.cartItems.length === 0) {
      throw new ApiError("Your cart is empty", 400);
    }

    // 2- Prepare order items
    const orderItems = [];

    // 3- Check/update every product atomically
    for (const item of cart.cartItems) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stockQuantity: { $gte: item.quantity },
          isAvailable: true,
        },
        {
          $inc: {
            stockQuantity: -item.quantity,
            soldQuantity: item.quantity,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!product) {
        throw new ApiError(
          `Product ${item.productId} is unavailable or has insufficient stock`,
          400,
        );
      }

      // 4- Create order item snapshot
      // Price comes from the cart.
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
      });
    }

    // 5- Get order information from request
    const {
      deliveryMethod,
      deliveryAddress,
      paymentMethod = "cash",
    } = req.body;

    // 6- Calculate shipping only
    let shippingPrice = 0;

    if (deliveryMethod === "delivery") {
      shippingPrice = 30;
    }

    // 7- Tax
    const taxPrice = 0;

    // 8- Use the cart's already-calculated price
    const itemsPrice = cart.totalPriceAfterDiscount ?? cart.totalCartPrice;

    // 9- Calculate final order price
    const totalOrderPrice = itemsPrice + taxPrice + shippingPrice;

    // 10- Create order
    const order = await Order.create(
      [
        {
          user: req.user._id,

          cartItems: orderItems,

          deliveryMethod,

          deliveryAddress:
            deliveryMethod === "delivery" ? deliveryAddress : undefined,

          paymentMethod,

          itemsPrice,
          taxPrice,
          shippingPrice,
          totalOrderPrice,

          status: "pending",

          isPaid: false,

          statusHistory: [
            {
              status: "pending",
              changedBy: req.user._id,
            },
          ],
        },
      ],
      { session },
    );

    const createdOrder = order[0];

    // 11- Clear user's cart
    cart.cartItems = [];
    cart.totalCartPrice = 0;
    cart.totalPriceAfterDiscount = undefined;

    await cart.save({ session });

    // 12- Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 13- Send response
    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: createdOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    next(error);
  }
};

// @desc   Get logged-in customer's orders
// @route  GET /api/v1/orders/my-orders
// @access protected/customer
exports.getMyOrders = async (req, res, next) => {
  const orders = await Order.find({
    user: req.user._id,
  }).sort("-createdAt");

  if (!orders) {
    return next(
      new ApiError("There is no ordrs for this user yet, Start ordering!", 404),
    );
  }
  res.status(200).json({
    status: "success",
    results: orders.length,
    data: orders,
  });
};

// @desc   Get specific order
// @route  GET /api/v1/orders/id
// @access protected/customer
exports.getSpecificOrder = async (req, res, next) => {
  const order = await Order.findOne({ user: req.user._id, _id: req.params.id });
  if (!order) {
    return next(new ApiError("This order is not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: order,
  });
};

// @desc   Cancel customer's order
// @route  PATCH /api/v1/orders/:id/cancel
// @access protected/customer
exports.cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1- Get order belonging to logged-in customer
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).session(session);

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // 2- Check if order can be cancelled
    if (!["pending", "accepted"].includes(order.status)) {
      throw new ApiError(
        `You cannot cancel an order with status: ${order.status}`,
        400,
      );
    }

    // 3- Return products to stock
    for (const item of order.cartItems) {
      const product = await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stockQuantity: item.quantity,
            soldQuantity: -item.quantity,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!product) {
        throw new ApiError(`Product ${item.product} was not found`, 404);
      }
      product.isAvailable = product.stockQuantity > 0;
      await product.save({ session });
    }

    // 4- Update order status
    order.status = "cancelled";

    // 5- Add status history
    order.statusHistory.push({
      status: "cancelled",
      changedBy: req.user._id,
    });

    await order.save({ session });

    // 6- Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    next(error);
  }
};

// =========================
// ADMIN
// =========================

// Get all orders
exports.getAllOrders = async (req, res, next) => {};

// Accept pending order
exports.acceptOrder = async (req, res, next) => {};

// =========================
// BAKER
// =========================

// Get orders assigned/available to baker
exports.getBakerOrders = async (req, res, next) => {};

// Mark order as preparing
exports.markOrderPreparing = async (req, res, next) => {};

// Mark order as ready
exports.markOrderReady = async (req, res, next) => {};
