const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");

const Product = require("../models/product.model");
const Category = require("../models/category.model");

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
    .notEmpty()
    .withMessage("Product price is required")
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

  check("stockQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a positive integer"),

  validatorMiddleware,
];
