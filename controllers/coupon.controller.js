const factory = require("./factory");
const Coupon = require("../models/coupon.model");

// @desc   Get list of  coupons
// @route  GET /api/v1/coupons
// @access private/protect/Admin/manager
exports.getAllCoupons = factory.getAll(Coupon);
// @desc   Get specific coupon by id
// @route  Get /api/v1/coupons/:id
// @access private/protect/Admin/manager

exports.getCoupon = factory.getOne(Coupon);
// @desc   create coupon
// @route  POST /api/v1/coupons
// @access private/protect/Admin/manager
exports.createCoupon = factory.createOne(Coupon);
// @desc   Update specific coupon
// @route  Patch/put /api/v1/coupons/id
// @access private/protect/Admin/manager
exports.updateCoupon = factory.updateOne(Coupon);
// @desc   Delete specific coupon
// @route  Delete /api/v1/coupons/id
// @access private/protect/Admin/manager
exports.deleteCoupon = factory.deleteOne(Coupon);
