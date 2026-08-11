const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");

const Coupon = require("../models/coupon.model");

// =========================
// CREATE COUPON
// =========================

exports.createCouponValidator = [
  check("name")
    .notEmpty()
    .withMessage("Coupon name is required")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Coupon name must be between 3 and 50 characters")
    .custom(async (val) => {
      const coupon = await Coupon.findOne({
        name: val.toUpperCase(),
      });

      if (coupon) {
        throw new Error("Coupon name already exists");
      }

      return true;
    }),

  check("expire")
    .notEmpty()
    .withMessage("Coupon expire date is required")
    .isISO8601()
    .withMessage("Please provide a valid expire date")
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error("Coupon expiration date must be in the future");
      }

      return true;
    }),

  check("discount")
    .notEmpty()
    .withMessage("Coupon discount is required")
    .isFloat({ min: 1, max: 100 })
    .withMessage("Discount must be between 1 and 100"),

  validatorMiddleware,
];

// =========================
// GET COUPON
// =========================

exports.getCouponValidator = [
  check("id").isMongoId().withMessage("Invalid coupon id"),

  validatorMiddleware,
];

// =========================
// UPDATE COUPON
// =========================

exports.updateCouponValidator = [
  check("id").isMongoId().withMessage("Invalid coupon id"),

  check("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Coupon name must be between 3 and 50 characters")
    .custom(async (val, { req }) => {
      const coupon = await Coupon.findOne({
        name: val.toUpperCase(),
        _id: { $ne: req.params.id },
      });

      if (coupon) {
        throw new Error("Coupon name already exists");
      }

      return true;
    }),

  check("expire")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid expire date")
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error("Coupon expiration date must be in the future");
      }

      return true;
    }),

  check("discount")
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage("Discount must be between 1 and 100"),

  validatorMiddleware,
];

// =========================
// DELETE COUPON
// =========================

exports.deleteCouponValidator = [
  check("id").isMongoId().withMessage("Invalid coupon id"),

  validatorMiddleware,
];
