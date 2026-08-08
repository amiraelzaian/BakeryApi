const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");
const Category = require("../models/category.model");

exports.createCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 3 })
    .withMessage("Too short category name")
    .trim()
    .custom(async (val) => {
      const category = await Category.findOne({ name: val });

      if (category) {
        throw new Error("This category name already exists");
      }

      return true;
    }),

  check("description")
    .notEmpty()
    .withMessage("Category description is required")
    .trim(),

  check("imageUrl").optional(),

  check("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  validatorMiddleware,
];

exports.getCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid mongo id"),

  validatorMiddleware,
];

exports.updateCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid mongo id"),

  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short category name")
    .trim()
    .custom(async (val) => {
      const category = await Category.findOne({ name: val });

      if (category) {
        throw new Error("This category name already exists");
      }

      return true;
    }),

  check("description").optional().trim(),

  check("imageUrl").optional(),

  check("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  validatorMiddleware,
];

exports.deleteCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid mongo id"),

  validatorMiddleware,
];
