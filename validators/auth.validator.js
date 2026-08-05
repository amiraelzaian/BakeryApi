const { check } = require("express-validator");
const User = require("../models/user.model");
const validatorMiddleware = require("../middlewares/globalValidatorMiddleware");

exports.signupValidator = [
  check("name")
    .notEmpty()
    .withMessage("User name is required")
    .isLength({ min: 3 })
    .withMessage("Too short user name"),
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("InCorrect Email")
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        return Promise.reject("Email is in use");
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Too short password ")
    .custom((val, { req }) => {
      if (val !== req.body.passwordConfirm) {
        throw new Error("Incorrect password confirmation");
      }
      return true;
    }),
  check("passwordConfirm")
    .notEmpty()
    .withMessage("Required password confirmation"),
  validatorMiddleware,
];

exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("InCorrect Email")
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (!user) {
        return Promise.reject("Incorrect Credential");
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Too short password "),

  validatorMiddleware,
];
