const ApiError = require("../utils/apiError");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Offer = require("../models/seasonalOffers.model");
const { getDateRangeFilter } = require("../utils/dashboard.util");

exports.getRevenueSummary = async (req, res, next) => {
  const range = req.query.range || "all";

  const dateFilter = getDateRangeFilter(range);

  const result = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        status: { $in: ["delivered", "picked_up"] },
        ...dateFilter,
      },
    },

    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalOrderPrice" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);
  console.log("result", result);
  const summary = result[0] || { totalRevenue: 0, totalOrders: 0 };

  res.status(200).json({
    status: "success",
    range,
    data: {
      totalRevenue: summary.totalRevenue,
      totalOrders: summary.totalOrders,
    },
  });
};
exports.getSalesOverTime = async (req, res, next) => {};
exports.getBestSellingProducts = async (req, res, next) => {};
exports.getOrderStatusSummary = async (req, res, next) => {};
exports.getAverageOrderValue = async (req, res, next) => {};
exports.getNewCustomerOverTime = async (req, res, next) => {};
exports.getTopRatedProducts = async (req, res, next) => {};
exports.getCouponUsageStats = async (req, res, next) => {};
exports.getActiveOffersCount = async (req, res, next) => {};
