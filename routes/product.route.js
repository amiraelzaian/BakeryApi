const express = require("express");
const { protect, allowedTo } = require("../controllers/auth.controller");
const { setCreatedBy } = require("../middlewares/setCreatedBy");
const { createProductValidator } = require("../validators/product.validator");
const { createProduct } = require("../controllers/product.controller");

const router = express.Router();

router
  .route("/")
  .post(
    protect,
    allowedTo("admin"),
    setCreatedBy,
    createProductValidator,
    createProduct,
  );

module.exports = router;
