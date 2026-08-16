const Product = require("../models/product.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const ApiError = require("../utils/apiError");
const factory = require("../controllers/factory");
const mongoose = require("mongoose");
const crypto = require("crypto");
const axios = require("axios");
const FailedOrder = require("../models/failedOrders.model");
const queryString = require("query-string"); // npm install query-string
const _ = require("underscore"); // npm install underscore
const PendingOrder = require("../models/pendingOrder.model");

exports.createOrder = async (req, res, next) => {
  const { paymentMethod = "cash" } = req.body;

  if (paymentMethod === "card") {
    return createKashierCheckout(req, res, next);
  }

  return createCashOrder(req, res, next);
};

// ---- Kashier: build payment link ----

const createKashierCheckout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.cartItems.length === 0) {
      throw new ApiError("Your cart is empty", 400);
    }

    const { deliveryMethod, deliveryAddress } = req.body;
    const shippingPrice =
      deliveryMethod === "delivery" ? +process.env.SHIPPINGPRICE : 0;
    const taxPrice = +process.env.TAXPRICE;
    const itemsPrice = cart.totalPriceAfterDiscount ?? cart.totalCartPrice;
    const totalOrderPrice = itemsPrice + taxPrice + shippingPrice;

    const merchantOrderId = `${req.user._id}_${Date.now()}`;

    // Snapshot the cart NOW, so later payments/webhooks don't depend on
    // the live cart state (which may have changed or been cleared already)
    await PendingOrder.create({
      merchantOrderId,
      user: req.user._id,
      deliveryMethod,
      deliveryAddress:
        deliveryMethod === "delivery" ? deliveryAddress : undefined,
      cartItems: cart.cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
      })),
      itemsPrice,
    });

    const apiBaseUrl =
      process.env.KASHIER_MODE === "live"
        ? "https://api.kashier.io/v3/payment/sessions"
        : "https://test-api.kashier.io/v3/payment/sessions";

    const expireAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const kashierResponse = await axios.post(
      apiBaseUrl,
      {
        expireAt,
        maxFailureAttempts: 3,
        amount: totalOrderPrice.toFixed(2),
        currency: "EGP",
        order: merchantOrderId,
        merchantId: process.env.KASHIER_MERCHANT_ID,
        merchantRedirect: `https://praising-genetics-wages.ngrok-free.dev/api/v1/orders/kashier-callback`,
        display: "en",
        type: "one-time",
        allowedMethods: "card",
        serverWebhook: `https://praising-genetics-wages.ngrok-free.dev/api/v1/orders/kashier-webhook`,
        customer: {
          email: req.user.email,
          reference: req.user._id.toString(),
        },
      },
      {
        headers: {
          Authorization: process.env.KASHIER_SECRET_KEY,
          "api-key": process.env.KASHIER_PAYMENT_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    res.status(200).json({
      status: "success",
      paymentUrl: kashierResponse.data.sessionUrl,
      merchantOrderId,
    });
  } catch (error) {
    if (error.response) {
      console.error("Kashier session creation error:", error.response.data);
      return next(
        new ApiError(
          error.response.data.messages?.en || "Payment session creation failed",
          400,
        ),
      );
    }
    next(error);
  }
};

// ---- Kashier: webhook ----
exports.kashierWebhook = async (req, res) => {
  try {
    let body = req.body;

    if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString("utf-8"));
    }

    const { data, event } = body;

    if (!data || !data.signatureKeys) {
      console.log("Kashier webhook: received test ping or empty payload");
      return res.status(200).json({ received: true });
    }

    const sortedKeys = [...data.signatureKeys].sort();
    const signaturePayload = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(data[key])}`)
      .join("&");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.KASHIER_PAYMENT_API_KEY)
      .update(signaturePayload)
      .digest("hex");

    const receivedSignature = req.header("x-kashier-signature");

    if (expectedSignature !== receivedSignature) {
      console.error("Kashier webhook: invalid signature");
      return res.status(400).send("Invalid signature");
    }

    // Acknowledge immediately per Kashier's docs, then process
    res.status(200).json({ received: true });

    if (event === "pay" && data.status === "SUCCESS") {
      await createKashierOrder(data);
    }
  } catch (error) {
    console.error("Kashier webhook error:", error);
    if (!res.headersSent) res.status(400).send("Webhook error");
  }
};

// ---- Kashier: fulfill the order ----

const createKashierOrder = async (data) => {
  const existingOrder = await Order.findOne({
    kashierTransactionId: data.transactionId,
  });
  if (existingOrder) return; // already processed — idempotency guard

  const pending = await PendingOrder.findOne({
    merchantOrderId: data.merchantOrderId,
  });
  if (!pending) {
    console.error(`No pending order found for ${data.merchantOrderId}`);
    return;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // throw new ApiError("TEST: forcing failure to verify refund flow", 500);
    // Use the SNAPSHOT taken at checkout time, not the live cart
    const orderItems = [];
    for (const item of pending.cartItems) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stockQuantity: { $gte: item.quantity },
          isAvailable: true,
        },
        {
          $inc: { stockQuantity: -item.quantity, soldQuantity: item.quantity },
        },
        { new: true, session },
      );
      if (!product) {
        throw new ApiError(`Product ${item.productId} unavailable`, 400);
      }
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
      });
    }

    const totalOrderPrice = data.amount;

    const [createdOrder] = await Order.create(
      [
        {
          user: pending.user,
          cartItems: orderItems,
          deliveryMethod: pending.deliveryMethod,
          deliveryAddress:
            pending.deliveryMethod === "delivery"
              ? pending.deliveryAddress
              : undefined,
          paymentMethod: "card",
          itemsPrice: pending.itemsPrice,
          taxPrice: process.env.TAXPRICE,
          shippingPrice:
            pending.deliveryMethod === "delivery"
              ? process.env.SHIPPINGPRICE
              : 0,
          totalOrderPrice,
          status: "pending",
          paymentStatus: "paid",
          paidAt: Date.now(),
          kashierTransactionId: data.transactionId,
          statusHistory: [{ status: "pending", changedBy: pending.user }],
        },
      ],
      { session },
    );

    // Clear the cart on a best-effort basis — the order itself is
    // already committed regardless of whether the cart still matches
    await Cart.findOneAndUpdate(
      { userId: pending.user },
      {
        cartItems: [],
        totalCartPrice: 0,
        $unset: { totalPriceAfterDiscount: "" },
      },
      { session },
    );

    await session.commitTransaction();
    await PendingOrder.deleteOne({ merchantOrderId: data.merchantOrderId });
  } catch (error) {
    await session.abortTransaction();
    console.error("Kashier order creation failed:", error);

    // Avoid double-refunding if the webhook fires more than once for the same order
    const alreadyLogged = await FailedOrder.findOne({
      transactionId: data.transactionId,
    });

    let refunded = alreadyLogged?.refunded || false;

    if (!alreadyLogged) {
      try {
        await refundKashierPayment(data.kashierOrderId, data.amount);
        refunded = true;
        console.log(
          `Refunded ${data.kashierOrderId} due to order creation failure`,
        );
      } catch (refundError) {
        console.error(
          `CRITICAL: Refund failed for ${data.kashierOrderId}. Manual review needed.`,
          refundError.message,
        );
      }

      try {
        await FailedOrder.create({
          transactionId: data.transactionId,
          merchantOrderId: data.merchantOrderId,
          user: pending.user,
          amount: data.amount,
          reason: error.message || "Unknown error during order creation",
          refunded,
        });
      } catch (logError) {
        console.error("Failed to log failed order:", logError);
      }
    } else {
      console.log(
        `Skipping duplicate refund attempt for ${data.transactionId}`,
      );
    }
  } finally {
    session.endSession();
  }
};
const refundKashierPayment = async (
  kashierOrderId,
  amount,
  reason = "Order creation failed after payment",
) => {
  try {
    const baseUrl =
      process.env.KASHIER_MODE === "live"
        ? "https://fep.kashier.io"
        : "https://test-fep.kashier.io";

    const response = await axios.put(
      `${baseUrl}/v3/orders/${kashierOrderId}`,
      {
        apiOperation: "REFUND",
        reason,
        transaction: { amount },
      },
      {
        headers: {
          Authorization: process.env.KASHIER_SECRET_KEY,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Refund failed:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * @desc   Create new order from cart
 * @route  POST /api/v1/orders
 * @access Protected/Customer
 */
exports.createCashOrder = async (req, res, next) => {
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
          paymentStatus: "pending",
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
    assignedBakerId: req.user._id,
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
 * @desc   Add Delivery ID to filter object
 * @middleware
 */
exports.addDeliveryIdFilter = async (req, res, next) => {
  req.filterObj = {
    assignedDeliveryId: req.user._id,
  };

  next();
};

/**
 * @desc   Get orders assigned to delivery
 * @route  GET /api/v1/orders/delivery-orders/:deliveryId
 * @access Protected/Admin/delivery
 */
exports.getDeliveryOrders = factory.getAll(Order);

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
    order.paymentStatus = "paid";
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
/**
 * @desc   Mark assigned order as pickup
 * @route  PATCH /api/v1/orders/:id/picked-up
 * @access Protected/baker/Admin
 */
exports.markOrderPickedUp = async (req, res, next) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: "ready", deliveryMethod: "pickup" },
    {},
    { new: true },
  );
  if (!order)
    return next(new ApiError("Could not change this order status", 400));

  order.status = "picked_up";

  if (order.paymentMethod === "cash") {
    order.paymentStatus = "paid";

    order.paidAt = Date.now();
  }

  order.statusHistory.push({
    status: "picked_up",
    changedBy: req.user._id,
    changedAt: Date.now(),
  });
  await order.save();

  res.status(200).json({ status: "success", data: order });
};
