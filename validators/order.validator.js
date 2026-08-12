const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");

// =========================
// CREATE ORDER
// =========================

exports.createOrderValidator = [
  check("deliveryMethod")
    .notEmpty()
    .withMessage("Delivery method is required")
    .isIn(["delivery", "pickup"])
    .withMessage("Delivery method must be delivery or pickup"),

  check("deliveryAddress")
    .if((value, { req }) => req.body.deliveryMethod === "delivery")
    .notEmpty()
    .withMessage("Delivery address is required for delivery"),

  check("deliveryAddress.governorate")
    .if((value, { req }) => req.body.deliveryMethod === "delivery")
    .notEmpty()
    .withMessage("Governorate is required"),

  check("deliveryAddress.city")
    .if((value, { req }) => req.body.deliveryMethod === "delivery")
    .notEmpty()
    .withMessage("City is required"),

  check("deliveryAddress.street")
    .if((value, { req }) => req.body.deliveryMethod === "delivery")
    .notEmpty()
    .withMessage("Street is required"),

  check("deliveryAddress.zipCode")
    .if((value, { req }) => req.body.deliveryMethod === "delivery")
    .notEmpty()
    .withMessage("Zip code is required"),

  check("paymentMethod")
    .optional()
    .isIn(["cash", "card"])
    .withMessage("Payment method must be cash or card"),

  validatorMiddleware,
];

// =========================
// GET SPECIFIC ORDER
// =========================

exports.getSpecificOrderValidator = [
  check("id").isMongoId().withMessage("Invalid order id"),

  validatorMiddleware,
];

// =========================
// CANCEL ORDER
// =========================

exports.cancelOrderValidator = [
  check("id").isMongoId().withMessage("Invalid order id"),

  validatorMiddleware,
];
// =========================
// accept order  ORDER
// =========================

exports.acceptOrderValidator = [
  check("id").isMongoId().withMessage("Invalid order id"),

  validatorMiddleware,
];
