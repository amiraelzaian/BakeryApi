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
const router = express.Router();

router.route("/admin").get(protect, allowedTo("admin"), getAllCategoriesAdmin);
router
  .route("/")
  .post(protect, allowedTo("admin"), createCategoryValidator, createCategory)
  .get(getAllCategories);

router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .patch(protect, allowedTo("admin"), updateCategoryValidator, updateCategory)
  .delete(protect, allowedTo("admin"), deleteCategoryValidator, deleteCategory);

module.exports = router;
