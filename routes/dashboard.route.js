const express = require("express");
const {
  getRevenueSummary,
  getSalesOverTime,
  getBestSellingProducts,
  getOrderStatusSummary,
  getAverageOrderValue,
  getNewCustomerOverTime,
  getActiveOffersCount,
  getTopRatedProducts,
} = require("../controllers/dashboard.controller");
const { protect, allowedTo } = require("../controllers/auth.controller");

const router = express.Router();

router.get("/revenue", protect, allowedTo("admin"), getRevenueSummary);
router.get("/sales", protect, allowedTo("admin"), getSalesOverTime);
router.get(
  "/best-selling",
  protect,
  allowedTo("admin"),
  getBestSellingProducts,
);
router.get("/order-status", protect, allowedTo("admin"), getOrderStatusSummary);
router.get("/avg-order-val", protect, allowedTo("admin"), getAverageOrderValue);
router.get(
  "/new-customers",
  protect,
  allowedTo("admin"),
  getNewCustomerOverTime,
);
router.get("/active-offers", protect, allowedTo("admin"), getActiveOffersCount);
router.get("/top-products", protect, allowedTo("admin"), getTopRatedProducts);

module.exports = router;
