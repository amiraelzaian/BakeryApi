const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");
const Review = require("../models/review.model");

exports.createReviewValidator = [
  check("productId").isMongoId().withMessage("Invalid product id format"),
  check("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  check("comment")
    .optional()
    .isString()
    .withMessage("Comment must be a string")
    .trim(),

  // Prevent duplicate review (schema already enforces this at DB level,
  // but a friendly 400 here is better than a raw duplicate-key error)
  check("productId").custom(async (productId, { req }) => {
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
    });
    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }
    return true;
  }),

  validatorMiddleware,
];

exports.getAllReviewsOnProductValidator = [
  check("productId").isMongoId().withMessage("Invalid product id format"),

  validatorMiddleware,
];

exports.getReviewValidator = [
  check("reviewId").isMongoId().withMessage("Invalid review id format"),

  validatorMiddleware,
];

exports.updateReviewValidator = [
  check("reviewId").isMongoId().withMessage("Invalid review id format"),

  check("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  check("comment")
    .optional()
    .isString()
    .withMessage("Comment must be a string")
    .trim(),

  // Ownership check: only the review's author can update it
  check("reviewId").custom(async (reviewId, { req }) => {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }
    if (review.user.toString() !== req.user._id.toString()) {
      throw new Error("You are not allowed to edit this review");
    }
    return true;
  }),

  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check("id").isMongoId().withMessage("Invalid review id format"),

  check("id").custom(async (reviewId, { req }) => {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }
    // Owner can delete their own review; admin can delete any (moderation)
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      throw new Error("You are not allowed to delete this review");
    }
    return true;
  }),

  validatorMiddleware,
];
