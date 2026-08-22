const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");
const SeasonalOffer = require("../models/seasonalOffers.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");

exports.createSeasonalOfferValidator = [
  check("name")
    .notEmpty()
    .withMessage("Offer name is required")
    .isString()
    .withMessage("Offer name must be a string")
    .trim(),

  check("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim(),

  check("bannerImage").optional().isString(),

  check("discountPercentage")
    .notEmpty()
    .withMessage("Discount percentage is required")
    .isFloat({ min: 1, max: 100 })
    .withMessage("Discount percentage must be between 1 and 100"),

  check("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  check("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid date")
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  check("products")
    .optional()
    .isArray()
    .withMessage("Products must be an array")
    .custom(async (products) => {
      if (!products || products.length === 0) return true;
      const found = await Product.find({ _id: { $in: products } });
      if (found.length !== products.length) {
        throw new Error("One or more product ids are invalid");
      }
      return true;
    }),

  check("products.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid product id format"),

  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom(async (categoryId) => {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
      return true;
    }),

  // Must target at least one product OR a category
  check("products").custom((products, { req }) => {
    const hasProducts = Array.isArray(products) && products.length > 0;
    const hasCategory = !!req.body.category;
    if (!hasProducts && !hasCategory) {
      throw new Error(
        "You must provide either specific products or a category for this offer",
      );
    }
    return true;
  }),

  validatorMiddleware,
];

exports.updateSeasonalOfferValidator = [
  check("id").isMongoId().withMessage("Invalid offer id format"),

  check("name").optional().isString().trim(),

  check("description").optional().isString().trim(),

  check("bannerImage").optional().isString(),

  check("discountPercentage")
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage("Discount percentage must be between 1 and 100"),

  check("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  check("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date")
    .custom((endDate, { req }) => {
      if (
        req.body.startDate &&
        new Date(endDate) <= new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  check("products")
    .optional()
    .isArray()
    .withMessage("Products must be an array")
    .custom(async (products) => {
      if (!products || products.length === 0) return true;
      const found = await Product.find({ _id: { $in: products } });
      if (found.length !== products.length) {
        throw new Error("One or more product ids are invalid");
      }
      return true;
    }),

  check("products.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid product id format"),

  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom(async (categoryId) => {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
      return true;
    }),

  check("isActive").optional().isBoolean(),

  validatorMiddleware,
];

exports.getSeasonalOfferValidator = [
  check("id").isMongoId().withMessage("Invalid offer id format"),
  validatorMiddleware,
];

exports.deleteSeasonalOfferValidator = [
  check("id").isMongoId().withMessage("Invalid offer id format"),
  validatorMiddleware,
];
