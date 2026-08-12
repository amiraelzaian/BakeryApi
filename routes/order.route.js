const express = require("express");

const { protect, allowedTo } = require("../controllers/auth.controller");

const {
  createOrder,
  getMyOrders,
  getSpecificOrder,
  cancelOrder,
} = require("../controllers/order.controller");
const {
  createOrderValidator,
  getSpecificOrderValidator,
  cancelOrderValidator,
} = require("../validators/order.validator");

const router = express.Router();

router
  .route("/")
  .post(protect, allowedTo("customer"), createOrderValidator, createOrder);
router.route("/my-orders").get(protect, allowedTo("customer"), getMyOrders);
router.route("/:id").get(protect, getSpecificOrderValidator, getSpecificOrder);
router
  .route("/:id/cancel")
  .patch(protect, allowedTo("customer"), cancelOrderValidator, cancelOrder);

module.exports = router;
