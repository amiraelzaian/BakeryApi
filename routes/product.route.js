const express = require("express");

const { protect, allowedTo } = require("../controllers/auth.controller");

const { setCreatedBy } = require("../middlewares/setCreatedBy");
const createUploader = require("../middlewares/uploadImage");
const deleteOldImage = require("../middlewares/deleteOldImage");
const deleteImageOnRemove = require("../middlewares/deleteImageOnRemove");
const { setImageUrlToBody } = require("../middlewares/setImagesToBody");

const {
  createProductValidator,
  getProductValidator,
  deleteProductValidator,
  updateProductValidator,
} = require("../validators/product.validator");

const {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getAllProductsAdmin,
} = require("../controllers/product.controller");
const {
  createReview,
  addProductIdToFilter,
  getAllReviews,
} = require("../controllers/review.controller");
const {
  createReviewValidator,
  getAllReviewsOnProductValidator,
} = require("../validators/review.validator");
const { logAction } = require("../middlewares/logAction");
const Product = require("../models/product.model");

const router = express.Router();

const uploadProductImage = createUploader("products");

router
  .route("/")
  .get(getAllProducts)
  .post(
    protect,
    allowedTo("admin"),
    uploadProductImage.single("productImage"),
    setImageUrlToBody("imageUrl", "imagePublicId"),
    setCreatedBy,
    createProductValidator,
    logAction("CREATE_PRODUCT", "Product", (req) => ({
      changes: req.body,
    })),
    createProduct,
  );

router
  .route("/:productId/reviews")
  .post(protect, allowedTo("customer"), createReviewValidator, createReview)
  .get(addProductIdToFilter, getAllReviewsOnProductValidator, getAllReviews);

router.route("/admin").get(protect, allowedTo("admin"), getAllProductsAdmin);

router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .patch(
    protect,
    allowedTo("admin"),
    uploadProductImage.single("productImage"),
    deleteOldImage(Product, "imagePublicId"),
    setImageUrlToBody("imageUrl", "imagePublicId"),
    updateProductValidator,
    logAction("UPDATE_PRODUCT", "Product", (req) => ({
      changes: req.body,
    })),
    updateProduct,
  )
  .delete(
    protect,
    allowedTo("admin"),
    deleteProductValidator,
    deleteImageOnRemove(Product, "imagePublicId"),
    logAction("DELETE_PRODUCT", "Product"),
    deleteProduct,
  );

module.exports = router;
