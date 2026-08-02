const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");
const { check, body } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

exports.createUserValidator = [
  check("name")
    .notEmpty()
    .withMessage("The User name is required")
    .isLength({ min: 3 })
    .withMessage("Too short user name"),
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("Email is already used"));
        }
      }),
    ),
  check("password")
    .notEmpty()
    .withMessage("Passowrd is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at leadt 6 characters")
    .custom((passowrd, { req }) => {
      if (passowrd !== req.body.passwordConfirm) {
        throw new Error("Incorrect password confirmation");
      }
      return true;
    }),
  check("passwordConfirm")
    .notEmpty()
    .withMessage("PasswordConfirmation required"),
  check("phone")
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number"),
  check("address").optional(),
  check("provider").optional(),
  check("role").optional(),
  check("avatarUrl").optional(),
  check("isActive").optional(),
  validatorMiddleware,
];
exports.updateUserValidator = [
  check("id").optional().isMongoId().withMessage("Invalid user id format"),
  body("name").optional(),
  check("email")
    .optional()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("Email is already in use"));
        }
      }),
    ),
  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number"),
  check("address").optional(),
  check("provider").optional(),
  check("role").optional(),
  check("avatarUrl").optional(),
  check("isActive").optional(),
  validatorMiddleware,
];

exports.getUserValidator = [
  check("id").isMongoId().withMessage("Invalid user id format"),
  validatorMiddleware,
];
exports.deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid user id format"),
  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  check("id").isMongoId().withMessage("Invalid user id format"),
  check("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password"),
  check("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter the password confirm"),
  check("password")
    .notEmpty()
    .withMessage("You must enter the new password")
    .custom(async (val, { req }) => {
      //1- verify current password
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error("There is not user for this id");
      }
      const isCorrectPass = await bcrypt.compare(
        req.body.currentPassword,
        user.password,
      );
      if (!isCorrectPass) {
        throw new Error("Incorrect current password");
      }
      //2- verify password confirm
      if (val !== req.body.passwordConfirm) {
        throw new Error("Password confirmation incorrect");
      }
      return true;
    }),
  validatorMiddleware,
];
