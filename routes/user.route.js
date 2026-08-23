const express = require("express");
const {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  getLoggedUserData,
  updateLoggedUserData,
  deleteLoggedUserData,
  reverseUserActivation,
} = require("../controllers/user.controller");
const {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
} = require("../validators/user.validator");
const { logAction } = require("../middlewares/logAction");
const { protect, allowedTo } = require("../controllers/auth.controller");
const createUploader = require("../middlewares/uploadImage");
const deleteOldImage = require("../middlewares/deleteOldImage");
const deleteImageOnRemove = require("../middlewares/deleteImageOnRemove");
const { setImageUrlToBody } = require("../middlewares/setImagesToBody");
const User = require("../models/user.model");

const router = express.Router();

const uploadAvatar = createUploader("avatars"); // متظبط مرة واحدة

router.use(protect);

router.route("/getMe").get(getLoggedUserData, getUser);

router
  .route("/updateMe")
  .patch(
    uploadAvatar.single("avatar"),
    deleteOldImage(User),
    setImageUrlToBody("avatarUrl", "avatarPublicId"),
    updateUserValidator,
    updateLoggedUserData,
  );

router
  .route("/deleteMe")
  .delete(deleteImageOnRemove(User), deleteLoggedUserData);

router.route("/activation").patch(updateUserValidator, reverseUserActivation);

router
  .route("/")
  .post(
    allowedTo("admin"),
    createUserValidator,
    logAction("CREATE_USER", "User", (req) => ({
      changes: req.body,
    })),
    createUser,
  )
  .get(allowedTo("admin"), getAllUsers);

router
  .route("/:id")
  .get(
    allowedTo("admin", "baker", "delivery", "customer"),
    getUserValidator,
    getUser,
  )
  .patch(
    allowedTo("admin", "customer"),
    uploadAvatar.single("avatar"),
    deleteOldImage(User),
    setImageUrlToBody("avatarUrl", "avatarPublicId"),
    updateUserValidator,
    logAction("UPDATE_USER", "USER"),
    updateUser,
  )
  .delete(
    allowedTo("admin"),
    deleteUserValidator,
    deleteImageOnRemove(User),
    logAction("DELETE_USER", "User"),
    deleteUser,
  );

router
  .route("/change-user-pass/:id")
  .patch(allowedTo("admin"), changeUserPasswordValidator, changeUserPassword);

module.exports = router;
