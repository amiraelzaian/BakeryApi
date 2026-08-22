const Order = require("../models/order.model");
const Review = require("../models/review.model");
const User = require("../models/user.model");
const Offer = require("../models/seasonalOffers.model");
const Coupon = require("../models/coupon.model");
const { getDateRangeFilter } = require("../utils/dashboard.util");

exports.getRevenueSummary = async (req, res) => {
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
exports.getSalesOverTime = async (req, res) => {
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
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalRevenue: { $sum: "$totalOrderPrice" },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } }, // oldest first
  ]);

  const data = result.map((item) => ({
    date: item._id,
    totalRevenue: item.totalRevenue,
    totalOrders: item.totalOrders,
  }));

  res.status(200).json({
    status: "success",
    range,
    data,
  });
};
exports.getBestSellingProducts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
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
    { $unwind: "$cartItems" },
    {
      $group: {
        _id: "$cartItems.product",
        name: { $first: "$cartItems.name" },
        totalQuantitySold: { $sum: "$cartItems.quantity" },
        totalRevenue: {
          $sum: {
            $multiply: ["$cartItems.price", "$cartItems.quantity"],
          },
        },
      },
    },
    {
      $sort: { totalquantitySold: -1 },
    },
    { $limit: limit },
  ]);
  res.status(200).json({
    status: "success",
    range,
    data: result,
  });
};
exports.getOrderStatusSummary = async (req, res) => {
  const result = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: result,
  });
};
exports.getAverageOrderValue = async (req, res) => {
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
        averageValue: { $avg: "$totalOrderPrice" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const summary = result[0] || { averageValue: 0, totalOrders: 0 };

  res.status(200).json({
    status: "success",
    range,
    data: {
      averageValue: Math.round(summary.averageValue * 100) / 100,
      totalOrders: summary.totalOrders,
    },
  });
};
exports.getNewCustomerOverTime = async (req, res) => {
  const range = req.query.range || "all";
  const dateFilter = getDateRangeFilter(range);

  const result = await User.aggregate([
    {
      $match: {
        role: "customer",
        ...dateFilter,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  const data = result.map((item) => ({
    date: item._id,
    newCustomers: item.totalUsers,
  }));

  res.status(200).json({
    status: "success",
    range,
    data,
  });
};
exports.getTopRatedProducts = async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;

  const result = await Review.aggregate([
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
    { $sort: { averageRating: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $project: {
        _id: 1,
        name: "$productDetails.name",
        averageRating: { $round: ["$averageRating", 1] },
        totalReviews: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: result,
  });
};

exports.getActiveOffersCount = async (req, res, next) => {
  const now = new Date();

  const activeOffers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  res.status(200).json({
    status: "success",
    data: {
      count: activeOffers.length,
      offers: activeOffers.map((o) => ({
        name: o.name,
        discountPercentage: o.discountPercentage,
        endDate: o.endDate,
      })),
    },
  });
};
