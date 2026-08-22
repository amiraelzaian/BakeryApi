const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");

exports.addProductToWishlistValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id is required")
    .isMongoId()
    .withMessage("Invalid product id format"),

  validatorMiddleware,
];

exports.removeWishlistItemValidator = [
  check("productId").isMongoId().withMessage("Invalid product id format"),

  validatorMiddleware,
];

exports.moveToCartValidator = [
  check("productId").isMongoId().withMessage("Invalid product id format"),

  check("size")
    .optional()
    .isString()
    .withMessage("Size must be a string")
    .trim(),

  validatorMiddleware,
];
