const express = require("express");
const {
  createCategoryValidator,
  getCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../validators/category.validator");
const {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getAllCategoriesAdmin,
} = require("../controllers/category.controller");

const { protect, allowedTo } = require("../controllers/auth.controller.js");
const { logAction } = require("../middlewares/logAction.js");
const createUploader = require("../middlewares/uploadImage.js");
const deleteOldImage = require("../middlewares/deleteOldImage.js");
const deleteImageOnRemove = require("../middlewares/deleteImageOnRemove.js");
const { setImageUrlToBody } = require("../middlewares/setImagesToBody.js");
const Category = require("../models/category.model.js");

const router = express.Router();

const uploadCategoryImage = createUploader("categories");

router.route("/admin").get(protect, allowedTo("admin"), getAllCategoriesAdmin);

router
  .route("/")
  .post(
    protect,
    allowedTo("admin"),
    uploadCategoryImage.single("categoryImage"),
    setImageUrlToBody("imageUrl", "imagePublicId"),
    createCategoryValidator,
    logAction("CREATE_CATEGORY", "Category", (req) => ({
      changes: req.body,
    })),
    createCategory,
  )
  .get(getAllCategories);

router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .patch(
    protect,
    allowedTo("admin"),
    uploadCategoryImage.single("categoryImage"),
    deleteOldImage(Category),
    setImageUrlToBody("imageUrl", "imagePublicId"),
    updateCategoryValidator,
    logAction("UPDATE_CATEGORY", "Category", (req) => ({
      changes: req.body,
    })),
    updateCategory,
  )
  .delete(
    protect,
    allowedTo("admin"),
    deleteCategoryValidator,
    deleteImageOnRemove(Category),
    logAction("DELETE_CATEGORY", "Category"),
    deleteCategory,
  );

module.exports = router;
