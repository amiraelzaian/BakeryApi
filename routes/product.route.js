const express = require("express");

const { protect, allowedTo } = require("../controllers/auth.controller");

const { setCreatedBy } = require("../middlewares/setCreatedBy");

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

const router = express.Router();

router
  .route("/")
  .get(getAllProducts)
  .post(
    protect,
    allowedTo("admin"),
    setCreatedBy,
    createProductValidator,
    createProduct,
  );

router.route("/admin").get(protect, allowedTo("admin"), getAllProductsAdmin);

router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .patch(protect, allowedTo("admin"), updateProductValidator, updateProduct)
  .delete(protect, allowedTo("admin"), deleteProductValidator, deleteProduct);

module.exports = router;
