const express = require("express");
const {
  addUserIdToFilter,
  getAllReviews,
  updateReview,
  deleteReview,
  deleteReviewForAdmin,
} = require("../controllers/review.controller");
const { protect, allowedTo } = require("../controllers/auth.controller");
const {
  updateReviewValidator,
  deleteReviewValidator,
} = require("../validators/review.validator");

const router = express.Router();

router
  .route("/my-reviews")
  .get(protect, allowedTo("customer"), addUserIdToFilter, getAllReviews);
router.route("/admin/").get(protect, allowedTo("admin"), getAllReviews);
router
  .route("/:id/admin")
  .delete(
    protect,
    allowedTo("admin"),
    deleteReviewValidator,
    deleteReviewForAdmin,
  );

router
  .route("/:reviewId")
  .patch(protect, allowedTo("customer"), updateReviewValidator, updateReview)
  .delete(protect, allowedTo("customer"), deleteReviewValidator, deleteReview);

module.exports = router;
