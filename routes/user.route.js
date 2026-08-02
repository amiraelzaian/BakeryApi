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

const router = express.Router();

router.route("/").post(createUserValidator, createUser).get(getAllUsers);
router
  .route("/:id")
  .get(getUserValidator, getUser)
  .patch(updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);
router
  .route("/change-user-pass/:id")
  .patch(changeUserPasswordValidator, changeUserPassword);

module.exports = router;
