const Product = require("../models/product.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const ApiError = require("../utils/apiError");
const factory = require("../controllers/factory");
const mongoose = require("mongoose");

// =========================
// CUSTOMER
// =========================

/**
 * @desc   Create new order from cart
 * @route  POST /api/v1/orders
 * @access Protected/Customer
 */
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const cart = await Cart.findOne({
      userId: req.user._id,
    }).session(session);

    if (!cart || cart.cartItems.length === 0) {
      throw new ApiError("Your cart is empty", 400);
    }

    const orderItems = [];

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

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
      });
      await product.save({ session });
    }

    const {
      deliveryMethod,
      deliveryAddress,
      paymentMethod = "cash",
    } = req.body;

    let shippingPrice = 0;

    if (deliveryMethod === "delivery") {
      shippingPrice = process.env.SHIPPINGPRICE;
    }

    const taxPrice = process.env.TAXPRICE;
    const itemsPrice = cart.totalPriceAfterDiscount ?? cart.totalCartPrice;

    const totalOrderPrice = itemsPrice + +taxPrice + +shippingPrice;

    const [createdOrder] = await Order.create(
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

    cart.cartItems = [];
    cart.totalCartPrice = 0;
    cart.totalPriceAfterDiscount = undefined;

    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

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

/**
 * @desc   Get logged-in customer's orders
 * @route  GET /api/v1/orders/my-orders
 * @access Protected/Customer
 */
exports.getMyOrders = async (req, res, next) => {
  const orders = await Order.find({
    user: req.user._id,
  }).sort("-createdAt");

  if (orders.length === 0) {
    return next(
      new ApiError(
        "There are no orders for this user yet. Start ordering!",
        404,
      ),
    );
  }

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: orders,
  });
};

/**
 * @desc   Get specific order
 * @route  GET /api/v1/orders/:id
 * @access Protected/Customer
 */
exports.getSpecificOrder = async (req, res, next) => {
  const order = await Order.findOne({
    user: req.user._id,
    _id: req.params.id,
  });

  if (!order) {
    return next(new ApiError("This order is not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: order,
  });
};

/**
 * @desc   Cancel customer's order
 * @route  PATCH /api/v1/orders/:id/cancel
 * @access Protected/Customer
 */
exports.cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).session(session);

    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    if (!["pending", "accepted"].includes(order.status)) {
      throw new ApiError(
        `You cannot cancel an order with status: ${order.status}`,
        400,
      );
    }

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

    order.status = "cancelled";

    order.statusHistory.push({
      status: "cancelled",
      changedBy: req.user._id,
    });

    await order.save({ session });

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

/**
 * @desc   Get all orders
 * @route  GET /api/v1/orders
 * @access Protected/Admin
 */
exports.getAllOrders = factory.getAll(Order);

/**
 * @desc   Accept pending order and assign baker
 * @route  PATCH /api/v1/orders/:id/accept
 * @access Protected/Admin/Baker
 */
exports.acceptOrder = async (req, res, next) => {
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      status: "pending",
    },
    {
      status: "accepted",
    },
    { new: true },
  );

  if (!order) {
    return next(new ApiError("Could not change order status", 404));
  }

  order.statusHistory.push({
    status: "accepted",
    changedBy: req.user._id,
    changedAt: Date.now(),
  });

  order.assignedBakerId = req.body.bakerId;

  await order.save();

  res.status(200).json({
    status: "success",
    data: order,
  });
};

// =========================
// BAKER / ADMIN
// =========================

/**
 * @desc   Add baker ID to filter object
 * @middleware
 */
exports.addBakerIdFilter = async (req, res, next) => {
  req.filterObj = {
    assignedBakerId: req.params.bakerId,
  };

  next();
};

/**
 * @desc   Get orders assigned to baker
 * @route  GET /api/v1/orders/baker-orders/:bakerId
 * @access Protected/Admin/Baker
 */
exports.getBakerOrders = factory.getAll(Order);

/**
 * @desc   Mark order as preparing
 * @route  PATCH /api/v1/orders/:id/prepare
 * @access Protected/Baker/Admin
 */
exports.markOrderPreparing = async (req, res, next) => {
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      status: "accepted",
    },
    {
      status: "preparing",
    },
    { new: true },
  );

  if (!order) {
    return next(new ApiError("Could not change order status", 404));
  }

  order.statusHistory.push({
    status: "preparing",
    changedBy: req.user._id,
    changedAt: Date.now(),
  });

  await order.save();

  res.status(200).json({
    status: "success",
    data: order,
  });
};

/**
 * @desc   Mark order as ready
 * @route  PATCH /api/v1/orders/:id/ready
 * @access Protected/Baker/Admin
 */
exports.markOrderReady = async (req, res, next) => {
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      status: "preparing",
    },
    {
      status: "ready",
    },
    { new: true },
  );

  if (!order) {
    return next(new ApiError("Could not change order status", 404));
  }

  order.statusHistory.push({
    status: "ready",
    changedBy: req.user._id,
    changedAt: Date.now(),
  });

  await order.save();

  res.status(200).json({
    status: "success",
    data: order,
  });
};

/**
 * @desc   Assign ready order to delivery employee
 * @route  PATCH /api/v1/orders/:id/assign-delivery
 * @access Protected/Admin
 */
exports.assignOrderToDelivery = async (req, res, next) => {
  const { deliveryId } = req.body;

  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      status: "ready",
      deliveryMethod: "delivery",
    },
    {
      status: "out_for_delivery",
      assignedDeliveryId: deliveryId,
    },
    { new: true },
  );

  if (!order) {
    return next(
      new ApiError("Order not found or cannot be assigned for delivery", 404),
    );
  }

  order.statusHistory.push({
    status: "out_for_delivery",
    changedBy: req.user._id,
    changedAt: Date.now(),
  });

  await order.save();

  res.status(200).json({
    status: "success",
    data: order,
  });
};

/**
 * @desc   Mark assigned order as delivered
 * @route  PATCH /api/v1/orders/:id/delivered
 * @access Protected/Delivery/Admin
 */
exports.markOrderDelivered = async (req, res, next) => {
  const filter = {
    _id: req.params.id,
    status: "out_for_delivery",
    deliveryMethod: "delivery",
  };

  // Delivery employee can only update orders assigned to them.
  if (req.user.role === "delivery") {
    filter.assignedDeliveryId = req.user._id;
  }

  const order = await Order.findOne(filter);

  if (!order) {
    return next(
      new ApiError(
        "Order not found or you are not assigned to this delivery",
        404,
      ),
    );
  }

  order.status = "delivered";
  order.deliveredAt = Date.now();

  // Mark as paid only for Cash on Delivery.
  if (order.paymentMethod === "cash") {
    order.isPaid = true;
    order.paidAt = Date.now();
  }

  order.statusHistory.push({
    status: "delivered",
    changedBy: req.user._id,
    changedAt: Date.now(),
  });

  await order.save();

  res.status(200).json({
    status: "success",
    data: order,
  });
};
