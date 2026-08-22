const ApiError = require("../utils/apiError");
const Review = require("../models/review.model");
const factory = require("./factory");

exports.createReview = async (req, res, next) => {
  const review = await Review.create({
    product: req.params.productId,
    user: req.user._id,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  if (!review) {
    return next(
      new ApiError("Could not make review on this product, Try later", 400),
    );
  }

  res.status(201).json({ status: "success" });
};

exports.addProductIdToFilter = async (req, res, next) => {
  if (req.params.productId) {
    req.filterObj = { product: req.params.productId };
  }
  next();
};

exports.addUserIdToFilter = async (req, res, next) => {
  if (req.user._id) {
    req.filterObj = { user: req.user._id };
  }
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.updateReview = async (req, res, next) => {
  const review = await Review.findOneAndUpdate(
    { _id: req.params.reviewId, user: req.user._id },
    req.body,
    { new: true },
  );
  if (!review)
    return next(
      new ApiError("could not update this review, Try again later", 400),
    );
  res.status(200).json({ status: "success", data: review });
};
exports.deleteReview = async (req, res, next) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.reviewId,
    user: req.user._id,
  });
  if (!review)
    return next(
      new ApiError("could not update this review, Try again later", 400),
    );
  res.status(204).send();
};

exports.deleteReviewForAdmin = factory.deleteOne(Review);
