const express = require("express");
const {
  signupValidator,
  loginValidator,
} = require("../validators/auth.validator");
const { signup, login } = require("../controllers/auth.controller");

const router = express.Router();

router.route("/signup").post(signupValidator, signup);
router.route("/login").post(loginValidator, login);

module.exports = router;
