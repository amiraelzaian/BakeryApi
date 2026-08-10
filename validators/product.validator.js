const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");

const Product = require("../models/product.model");
const Category = require("../models/category.model");

// =========================
// CREATE PRODUCT
// =========================

exports.createProductValidator = [
  check("name")
    .notEmpty()
    .withMessage("Product name is required")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Too short product name")
    .custom(async (val) => {
      const product = await Product.findOne({ name: val });

      if (product) {
        throw new Error("This product name already exists");
      }

      return true;
    }),

  check("description")
    .optional()
    .trim()
    .isLength({ max: 400 })
    .withMessage("Description must not exceed 400 characters"),

  check("price")
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage("Price must be between 0 and 50000"),

  check("imageUrl")
    .optional()
    .isURL()
    .withMessage("Please enter a valid image URL"),

  check("categoryId")
    .notEmpty()
    .withMessage("Product must belong to a category")
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (val) => {
      const category = await Category.findById(val);

      if (!category) {
        throw new Error(`Category with id ${val} is not found`);
      }

      if (!category.isActive) {
        throw new Error("Cannot create product under an inactive category");
      }

      return true;
    }),

  check("sizes")
    .optional()
    .isArray()
    .withMessage("Sizes must be an array")
    .custom((sizes) => {
      const allowedSizes = ["small", "medium", "large"];

      const names = sizes.map((size) => size.name);

      const valid = sizes.every(
        (size) =>
          allowedSizes.includes(size.name) &&
          typeof size.price === "number" &&
          size.price >= 0 &&
          size.price <= 50000,
      );

      if (!valid) {
        throw new Error("Each size must have a valid name and price");
      }

      if (new Set(names).size !== names.length) {
        throw new Error("Duplicate product sizes are not allowed");
      }

      return true;
    }),

  check("stockQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer"),

  validatorMiddleware,
];

// =========================
// GET PRODUCT
// =========================

exports.getProductValidator = [
  check("id").isMongoId().withMessage("Invalid mongo id"),

  validatorMiddleware,
];

// =========================
// UPDATE PRODUCT
// =========================

exports.updateProductValidator = [
  check("id").isMongoId().withMessage("Invalid mongo id"),

  check("name")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Too short product name")
    .custom(async (val, { req }) => {
      const product = await Product.findOne({
        name: val,
        _id: { $ne: req.params.id },
      });

      if (product) {
        throw new Error("This product name already exists");
      }

      return true;
    }),

  check("description")
    .optional()
    .trim()
    .isLength({ max: 400 })
    .withMessage("Description must not exceed 400 characters"),

  check("price")
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage("Price must be between 0 and 50000"),

  check("imageUrl")
    .optional()
    .isURL()
    .withMessage("Please enter a valid image URL"),

  check("categoryId")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (val) => {
      const category = await Category.findById(val);

      if (!category) {
        throw new Error(`Category with id ${val} is not found`);
      }

      if (!category.isActive) {
        throw new Error("Cannot update product to an inactive category");
      }

      return true;
    }),

  check("sizes")
    .optional()
    .isArray()
    .withMessage("Sizes must be an array")
    .custom((sizes) => {
      const allowedSizes = ["small", "medium", "large"];

      const names = sizes.map((size) => size.name);

      const valid = sizes.every(
        (size) =>
          allowedSizes.includes(size.name) &&
          typeof size.price === "number" &&
          size.price >= 0 &&
          size.price <= 50000,
      );

      if (!valid) {
        throw new Error("Each size must have a valid name and price");
      }

      if (new Set(names).size !== names.length) {
        throw new Error("Duplicate product sizes are not allowed");
      }

      return true;
    }),

  check("stockQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer"),

  validatorMiddleware,
];

// =========================
// DELETE PRODUCT
// =========================

exports.deleteProductValidator = [
  check("id").isMongoId().withMessage("Invalid mongo id"),

  validatorMiddleware,
];
