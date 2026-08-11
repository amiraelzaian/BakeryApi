const express = require("express");

const { protect, allowedTo } = require("../controllers/auth.controller");

const {
  getAllCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/coupon.controller");

const {
  createCouponValidator,
  getCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} = require("../validators/coupon.validator");

const router = express.Router();

//router.use(protect, allowedTo("admin"));

router.route("/").get(getAllCoupons).post(createCouponValidator, createCoupon);

router
  .route("/:id")
  .get(getCouponValidator, getCoupon)
  .patch(updateCouponValidator, updateCoupon)
  .delete(deleteCouponValidator, deleteCoupon);

module.exports = router;
