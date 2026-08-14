const express = require("express");

const { protect, allowedTo } = require("../controllers/auth.controller");

const {
  createOrder,
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
  .route("/baker-orders/:bakerId")
  .get(
    protect,
    allowedTo("admin", "baker"),
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
// SPECIFIC ORDER
// =========================

router.route("/:id").get(protect, getSpecificOrderValidator, getSpecificOrder);
//--------------------
// DELIVERY
//--------------------
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

module.exports = router;
