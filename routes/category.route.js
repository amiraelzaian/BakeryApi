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
const router = express.Router();

router.route("/admin").get(protect, allowedTo("admin"), getAllCategoriesAdmin);
router
  .route("/")
  .post(
    protect,
    allowedTo("admin"),
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
    logAction("DELETE_CATEGORY", "Category"),
    deleteCategory,
  );

module.exports = router;
