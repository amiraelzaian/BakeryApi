const express = require("express");
const {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  changeUserPassword,
} = require("../controllers/user.controller");
const {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
} = require("../validators/user.validator");
const { protect, allowedTo } = require("../controllers/auth.controller");

const router = express.Router();
router.use(protect);

router
  .route("/")
  .post(allowedTo("admin"), createUserValidator, createUser)
  .get(allowedTo("admin"), getAllUsers);

router
  .route("/:id")
  .get(
    allowedTo("admin", "baker", "delivery", "customer"),
    getUserValidator,
    getUser,
  )
  .patch(allowedTo("admin", "customer"), updateUserValidator, updateUser)
  .delete(allowedTo("admin"), deleteUserValidator, deleteUser);

router
  .route("/change-user-pass/:id")
  .patch(allowedTo("admin"), changeUserPasswordValidator, changeUserPassword);

module.exports = router;
