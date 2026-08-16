const express = require("express");

const { protect, allowedTo } = require("../controllers/auth.controller");

const {
  createCashOrder,
  getMyOrders,
  getSpecificOrder,
  cancelOrder,
  getAllOrders,
  acceptOrder,
  getBakerOrders,
  addBakerIdFilter,
  markOrderPreparing,
  markOrderReady,
  assignOrderToDelivery,
  markOrderDelivered,
  markOrderPickedUp,
  getDeliveryOrders,
  addDeliveryIdFilter,
  createOrder,
} = require("../controllers/order.controller");

const {
  createOrderValidator,
  getSpecificOrderValidator,
  cancelOrderValidator,
  acceptOrderValidator,
  getBakerOrdersValidator,
  markOrderPreparingValidator,
  markOrderReadyValidator,
  assignOrderToDeliveryValidator,
  markOrderDeliveredValidator,
  markOrderPickedUpValidator,
  getDeliveryOrdersValidator,
} = require("../validators/order.validator");

const router = express.Router();

// =========================
// CUSTOMER
// =========================

router
  .route("/")
  .post(protect, allowedTo("customer"), createOrderValidator, createOrder);

router.route("/my-orders").get(protect, allowedTo("customer"), getMyOrders);

router
  .route("/:id/cancel")
  .patch(protect, allowedTo("customer"), cancelOrderValidator, cancelOrder);

// =========================
// ADMIN
// =========================

router.route("/").get(protect, allowedTo("admin"), getAllOrders);

router
  .route("/:id/accept")
  .patch(
    protect,
    allowedTo("admin", "baker"),
    acceptOrderValidator,
    acceptOrder,
  );

// =========================
// BAKER / ADMIN
// =========================

router
  .route("/my-baker-orders")
  .get(
    protect,
    allowedTo("baker"),
    addBakerIdFilter,
    getBakerOrdersValidator,
    getBakerOrders,
  );

router
  .route("/:id/prepare")
  .patch(
    protect,
    allowedTo("baker", "admin"),
    markOrderPreparingValidator,
    markOrderPreparing,
  );

router
  .route("/:id/ready")
  .patch(
    protect,
    allowedTo("baker", "admin"),
    markOrderReadyValidator,
    markOrderReady,
  );

// =========================
// DELIVERY
// =========================

router
  .route("/my-deliveries")
  .get(
    protect,
    allowedTo("delivery"),
    addDeliveryIdFilter,
    getDeliveryOrdersValidator,
    getDeliveryOrders,
  );

router
  .route("/:id/assign-delivery")
  .patch(
    protect,
    allowedTo("admin"),
    assignOrderToDeliveryValidator,
    assignOrderToDelivery,
  );

router
  .route("/:id/delivered")
  .patch(
    protect,
    allowedTo("delivery", "admin"),
    markOrderDeliveredValidator,
    markOrderDelivered,
  );

router
  .route("/:id/picked-up")
  .patch(
    protect,
    allowedTo("admin", "baker"),
    markOrderPickedUpValidator,
    markOrderPickedUp,
  );

// =========================
// SPECIFIC ORDER
// =========================

router.get("/kashier-callback", (req, res) => {
  res.status(200).json({ message: "Payment processed, check your orders" });
});
router.route("/:id").get(protect, getSpecificOrderValidator, getSpecificOrder);

module.exports = router;
